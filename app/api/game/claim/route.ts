import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { getPlan, type PlanId, dayOf, isDone, nextClaimAt, type Owned } from "@/lib/game"
import { parseGameState } from "@/lib/order-credit"
import { getUserWalletSummary } from "@/lib/wallet-ledger"
import crypto from "crypto"

/**
 * POST /api/game/claim
 * 
 * Server-authoritative daily reward claim endpoint.
 * Validates eligibility, cycle expiration, calendar day constraints,
 * and atomically credits the reward to the live wallet ledger.
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const uid = cookieStore.get("paisax_uid")?.value

    if (!uid) {
      return NextResponse.json({ error: "Please log in to claim rewards" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { planInstanceId, claimAll = false } = body

    // 1. Fetch current game state from DB
    const [gsRow] = await db`SELECT state FROM game_states WHERE user_id = ${uid} LIMIT 1`
    if (!gsRow) {
      return NextResponse.json({ error: "Game account not found" }, { status: 404 })
    }

    const state = parseGameState(gsRow.state)
    const owned: Owned[] = Array.isArray(state.owned) ? state.owned : []
    const now = Date.now()
    const today = dayOf(now)

    // 2. Identify candidate plans
    const candidates = owned.filter((o) => {
      if (planInstanceId && o.id !== planInstanceId) return false
      return true
    })

    if (candidates.length === 0) {
      return NextResponse.json({ error: "No matching solar plan found" }, { status: 404 })
    }

    const eligibleToClaim: {
      ownedItem: Owned
      plan: ReturnType<typeof getPlan>
      dayToClaim: number
      rewardCoins: number
    }[] = []

    for (const o of candidates) {
      const plan = getPlan(o.planId)

      // A. Check cycle expiration
      if (isDone(o) || o.claimed >= plan.days) {
        if (!claimAll && planInstanceId === o.id) {
          return NextResponse.json({ error: `This ${plan.name} has completed its full ${plan.days}-day cycle.` }, { status: 400 })
        }
        continue
      }

      // B. Check readiness time
      const readyAt = nextClaimAt(o)
      if (readyAt === null || now < readyAt) {
        if (!claimAll && planInstanceId === o.id) {
          return NextResponse.json({ error: `Daily reward for ${plan.name} is not ready yet.` }, { status: 400 })
        }
        continue
      }

      // C. Check if already claimed today
      if (o.lastClaimAt !== null && dayOf(o.lastClaimAt) === today) {
        if (!claimAll && planInstanceId === o.id) {
          return NextResponse.json({ error: `Today's reward for ${plan.name} has already been claimed.` }, { status: 400 })
        }
        continue
      }

      eligibleToClaim.push({
        ownedItem: o,
        plan,
        dayToClaim: o.claimed + 1,
        rewardCoins: plan.perDay,
      })
    }

    if (eligibleToClaim.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No daily returns are currently available to claim. Next payout cycle starts at midnight.",
      }, { status: 400 })
    }

    // 3. Atomically apply claims
    let totalClaimedCoins = 0
    const claimLogs: any[] = []
    const newHistoryEntries: any[] = []

    const updatedOwned = owned.map((o) => {
      const match = eligibleToClaim.find((e) => e.ownedItem.id === o.id)
      if (!match) return o

      const claimId = `CLM_${o.id}_D${match.dayToClaim}_${now}`
      totalClaimedCoins += match.rewardCoins

      claimLogs.push({
        planInstanceId: o.id,
        planId: o.planId,
        planName: match.plan.name,
        day: match.dayToClaim,
        totalDays: match.plan.days,
        reward: match.rewardCoins,
        claimId,
      })

      newHistoryEntries.push({
        id: claimId,
        at: now,
        coins: match.rewardCoins,
        kind: "claim",
        planId: o.planId,
        day: match.dayToClaim,
      })

      return {
        ...o,
        claimed: match.dayToClaim,
        lastClaimAt: now,
      }
    })

    const existingHistory = Array.isArray(state.history) ? state.history : []
    const updatedHistory = [...newHistoryEntries, ...existingHistory]

    // 4. Update coins & lifetime in state
    const currentCoins = Number(state.coins) || 0
    const currentLifetime = Number(state.lifetime) || 0
    const newCoins = currentCoins + totalClaimedCoins
    const newLifetime = currentLifetime + totalClaimedCoins

    const updatedState = {
      ...state,
      coins: newCoins,
      lifetime: newLifetime,
      lastClaimDay: today,
      owned: updatedOwned,
      history: updatedHistory,
    }

    // 5. Persist to DB atomically
    await db`
      UPDATE game_states
      SET state = ${JSON.stringify(updatedState)}::jsonb,
          updated_at = now()
      WHERE user_id = ${uid}
    `

    // 6. Fetch authoritative balance after claim
    const summary = await getUserWalletSummary(uid)

    console.log(`[ClaimAPI] User ${uid} claimed ₹${totalClaimedCoins} across ${eligibleToClaim.length} plan(s). New balance: ₹${summary.availableBalance}`)

    return NextResponse.json({
      success: true,
      claimedCoins: totalClaimedCoins,
      claimedCount: eligibleToClaim.length,
      availableBalance: summary.availableBalance,
      claims: claimLogs,
      message: `🎉 Successfully claimed ₹${totalClaimedCoins} daily returns!`,
    })
  } catch (err: unknown) {
    console.error("[Daily Claim API Error]:", err)
    const msg = err instanceof Error ? err.message : "Failed to claim rewards"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
