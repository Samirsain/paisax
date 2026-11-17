import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { getPlan, type PlanId, dayOf, isDone, nextClaimAt, isClaimedToday, getISTDateString, type Owned } from "@/lib/game"
import { parseGameState } from "@/lib/order-credit"
import { getUserWalletSummary } from "@/lib/wallet-ledger"

class ClaimError extends Error {
  statusCode: number
  serverState?: any
  constructor(message: string, statusCode = 400, serverState?: any) {
    super(message)
    this.name = "ClaimError"
    this.statusCode = statusCode
    this.serverState = serverState
  }
}

/**
 * POST /api/game/claim
 * 
 * Server-authoritative daily reward claim endpoint with:
 * - Atomic database transaction (db.begin)
 * - Row-level locking (FOR UPDATE) to prevent concurrency/race conditions
 * - Relational daily_claims table insertion with UNIQUE constraint on (user_id, plan_instance_id, claim_date)
 * - IST (UTC+05:30) date validation
 * - Instant wallet balance synchronization
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const uid = cookieStore.get("paisax_uid")?.value

    if (!uid) {
      return NextResponse.json({ success: false, error: "Please log in to claim rewards" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { planInstanceId, claimAll = false } = body

    const now = Date.now()
    const todayIST = getISTDateString(now)

    // Execute claim inside an atomic PostgreSQL transaction
    const txResult = await db.begin(async (sql) => {
      // 1. Lock user's game_states row for update
      const [gsRow] = await sql`
        SELECT state FROM game_states WHERE user_id = ${uid} FOR UPDATE
      `
      if (!gsRow) {
        throw new ClaimError("Game account not found", 404)
      }

      const state = parseGameState(gsRow.state)
      const owned: Owned[] = Array.isArray(state.owned) ? state.owned : []

      // 2. Identify candidate plans
      const candidates = owned.filter((o) => {
        if (planInstanceId && o.id !== planInstanceId) return false
        return true
      })

      if (candidates.length === 0) {
        throw new ClaimError("No matching solar plan found", 404)
      }

      const eligibleToClaim: {
        ownedItem: Owned
        plan: ReturnType<typeof getPlan>
        dayToClaim: number
        rewardCoins: number
      }[] = []

      for (const o of candidates) {
        const plan = getPlan(o.planId)

        // A. Check if deactivated by admin
        if (o.status === "deactivated") {
          if (!claimAll && planInstanceId === o.id) {
            throw new ClaimError(`This ${plan.name} has been deactivated by administrator.`, 400)
          }
          continue
        }

        // B. Check cycle expiration
        if (isDone(o) || (Number(o.claimed) || 0) >= plan.days) {
          if (!claimAll && planInstanceId === o.id) {
            throw new ClaimError(`This ${plan.name} has completed its full ${plan.days}-day cycle.`, 400)
          }
          continue
        }

        // C. Check readiness time
        const readyAt = nextClaimAt(o)
        if (readyAt === null || now < readyAt) {
          if (!claimAll && planInstanceId === o.id) {
            throw new ClaimError(`Daily reward for ${plan.name} is not ready yet. Next payout at midnight.`, 400)
          }
          continue
        }

        // D. Check if already claimed today in state (IST)
        if (isClaimedToday(o, now)) {
          if (!claimAll && planInstanceId === o.id) {
            throw new ClaimError(`Today's reward for ${plan.name} has already been claimed.`, 400)
          }
          continue
        }

        // E. Check if already claimed today in daily_claims table (Double check)
        const [existingClaim] = await sql`
          SELECT id FROM daily_claims 
          WHERE user_id = ${uid} 
            AND plan_instance_id = ${o.id} 
            AND claim_date = ${todayIST} 
            AND status = 'SUCCESS'
          LIMIT 1
        `
        if (existingClaim) {
          if (!claimAll && planInstanceId === o.id) {
            throw new ClaimError(`Today's reward for ${plan.name} has already been claimed.`, 400)
          }
          continue
        }

        const nextDayToClaim = (Number(o.claimed) || 0) + 1

        // F. Check day number uniqueness in daily_claims
        const [existingDayClaim] = await sql`
          SELECT id FROM daily_claims 
          WHERE user_id = ${uid} 
            AND plan_instance_id = ${o.id} 
            AND day_number = ${nextDayToClaim} 
            AND status = 'SUCCESS'
          LIMIT 1
        `
        if (existingDayClaim) {
          if (!claimAll && planInstanceId === o.id) {
            throw new ClaimError(`Day ${nextDayToClaim} reward for ${plan.name} has already been claimed.`, 400)
          }
          continue
        }

        eligibleToClaim.push({
          ownedItem: o,
          plan,
          dayToClaim: nextDayToClaim,
          rewardCoins: plan.perDay,
        })
      }

      if (eligibleToClaim.length === 0) {
        // Reconcile owned plans with daily_claims table so stale state is fixed immediately
        const allUserClaims = await sql`
          SELECT plan_instance_id, plan_id, day_number, amount, claim_date, created_at
          FROM daily_claims
          WHERE user_id = ${uid} AND status = 'SUCCESS'
        `
        let fixedAny = false
        const reconciledOwned = owned.map((o) => {
          const matching = allUserClaims.filter(
            (c: any) => c.plan_instance_id === o.id || (!o.id && c.plan_id === o.planId)
          )
          if (matching.length > 0) {
            const maxClaimDay = Math.max(...matching.map((c: any) => Number(c.day_number) || 0))
            const maxClaimTime = Math.max(...matching.map((c: any) => new Date(c.created_at).getTime()))
            if ((Number(o.claimed) || 0) < maxClaimDay || (Number(o.lastClaimAt) || 0) < maxClaimTime) {
              fixedAny = true
              return {
                ...o,
                claimed: Math.max(Number(o.claimed) || 0, maxClaimDay),
                lastClaimAt: Math.max(Number(o.lastClaimAt) || 0, maxClaimTime),
              }
            }
          }
          return o
        })

        // Also ensure all claims exist in history
        const existingHistory = Array.isArray(state.history) ? [...state.history] : []
        const historyIds = new Set(existingHistory.map((h: any) => h?.id))
        for (const cl of allUserClaims) {
          if (!historyIds.has(cl.id)) {
            existingHistory.unshift({
              id: cl.id,
              at: cl.created_at ? new Date(cl.created_at).getTime() : Date.now(),
              coins: Number(cl.amount) || 0,
              kind: "claim",
              planId: cl.plan_id,
              day: Number(cl.day_number) || 1,
            })
            historyIds.add(cl.id)
            fixedAny = true
          }
        }

        const reconciledState = {
          ...state,
          owned: reconciledOwned,
          history: existingHistory,
        }

        if (fixedAny) {
          await sql`
            UPDATE game_states
            SET state = ${JSON.stringify(reconciledState)}::jsonb,
                updated_at = now()
            WHERE user_id = ${uid}
          `
        }

        throw new ClaimError("Daily Amount Not Available. Next payout cycle starts at midnight.", 400, reconciledState)
      }

      // 3. Apply claims atomically
      let totalClaimedCoins = 0
      const claimLogs: any[] = []
      const newHistoryEntries: any[] = []

      for (const item of eligibleToClaim) {
        const { ownedItem: o, plan, dayToClaim, rewardCoins } = item
        const claimTxnId = `CLM_${o.id}_D${dayToClaim}_${now}`
        totalClaimedCoins += rewardCoins

        // Insert into daily_claims table
        await sql`
          INSERT INTO daily_claims (
            id, user_id, plan_instance_id, plan_id, day_number, claim_date, amount, status, created_at
          ) VALUES (
            ${claimTxnId}, ${uid}, ${o.id}, ${o.planId}, ${dayToClaim}, ${todayIST}, ${rewardCoins}, 'SUCCESS', now()
          )
        `

        claimLogs.push({
          claimId: claimTxnId,
          planInstanceId: o.id,
          planId: o.planId,
          planName: plan.name,
          day: dayToClaim,
          totalDays: plan.days,
          reward: rewardCoins,
          claimDate: todayIST,
        })

        newHistoryEntries.push({
          id: claimTxnId,
          at: now,
          coins: rewardCoins,
          kind: "claim",
          planId: o.planId,
          day: dayToClaim,
        })
      }

      // 4. Update owned plans
      const updatedOwned = owned.map((o) => {
        const match = eligibleToClaim.find((e) => e.ownedItem.id === o.id)
        if (!match) return o
        return {
          ...o,
          claimed: match.dayToClaim,
          lastClaimAt: now,
        }
      })

      const existingHistory = Array.isArray(state.history) ? state.history : []
      const updatedHistory = [...newHistoryEntries, ...existingHistory]

      const currentCoins = Number(state.coins) || 0
      const currentLifetime = Number(state.lifetime) || 0
      const newCoins = currentCoins + totalClaimedCoins
      const newLifetime = currentLifetime + totalClaimedCoins

      const updatedState = {
        ...state,
        coins: newCoins,
        lifetime: newLifetime,
        lastClaimDay: dayOf(now),
        owned: updatedOwned,
        history: updatedHistory,
      }

      // 5. Update game_states within the same transaction
      await sql`
        UPDATE game_states
        SET state = ${JSON.stringify(updatedState)}::jsonb,
            updated_at = now()
        WHERE user_id = ${uid}
      `

      return {
        totalClaimedCoins,
        claimedCount: eligibleToClaim.length,
        claimLogs,
        updatedState,
      }
    })

    // 6. Fetch authoritative balance after claim
    const summary = await getUserWalletSummary(uid)

    console.log(`[ClaimAPI] User ${uid} claimed ₹${txResult.totalClaimedCoins} across ${txResult.claimedCount} plan(s). New balance: ₹${summary.availableBalance}`)

    return NextResponse.json({
      success: true,
      claimedCoins: txResult.totalClaimedCoins,
      claimedCount: txResult.claimedCount,
      availableBalance: summary.availableBalance,
      claims: txResult.claimLogs,
      serverState: txResult.updatedState,
      message: `🎉 Successfully claimed ₹${txResult.totalClaimedCoins} daily returns!`,
    })
  } catch (err: unknown) {
    if (err instanceof ClaimError) {
      return NextResponse.json({
        success: false,
        error: err.message,
        serverState: err.serverState || null,
      }, { status: err.statusCode })
    }

    // Postgres unique constraint violation error code 23505
    if (typeof err === "object" && err !== null && "code" in err && (err as any).code === "23505") {
      return NextResponse.json({
        success: false,
        error: "Today's reward for this plan has already been claimed.",
      }, { status: 400 })
    }

    console.error("[Daily Claim API Error]:", err)
    const msg = err instanceof Error ? err.message : "Failed to claim rewards"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
