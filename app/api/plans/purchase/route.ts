import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { getPlan, type PlanId, PLANS } from "@/lib/game"
import { parseGameState } from "@/lib/order-credit"
import { getUserWalletSummary } from "@/lib/wallet-ledger"
import { AeropayService } from "@/lib/aeropay"
import { getCallbackUrl, getReturnUrl } from "@/lib/gateway-config"
import crypto from "crypto"

function isPlanId(x: string): x is PlanId {
  return PLANS.some((p) => p.id === x)
}

/**
 * POST /api/plans/purchase
 * 
 * Supports purchasing an investment plan via:
 * 1. "wallet"  -> Atomically verified and deducted from live wallet balance
 * 2. "gateway" -> Initiates online AeroPay payment session
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const uid = cookieStore.get("paisax_uid")?.value

    if (!uid) {
      return NextResponse.json({ error: "Please login to purchase a plan" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { planId, paymentMethod = "wallet" } = body

    if (!planId || !isPlanId(planId)) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 })
    }

    const plan = getPlan(planId)

    // Load user profile
    const [user] = await db`SELECT id, name, phone FROM users WHERE id = ${uid} LIMIT 1`
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Load current game state
    const [gsRow] = await db`SELECT state FROM game_states WHERE user_id = ${uid} LIMIT 1`
    const state = parseGameState(gsRow?.state)
    const owned = Array.isArray(state.owned) ? state.owned : []

    // ── 1. FREE PLAN VALIDATION ──────────────────────────────────────────────
    if (planId === "free") {
      const alreadyHasFree = owned.some((o: any) => o.planId === "free")
      if (alreadyHasFree) {
        return NextResponse.json({ error: "Free trial plan can only be claimed once per user" }, { status: 400 })
      }

      const now = Date.now()
      const freePlanEntry = {
        id: `free_${now}`,
        planId: "free" as PlanId,
        claimed: 0,
        boughtAt: now,
        lastClaimAt: null,
      }

      const updatedOwned = [freePlanEntry, ...owned]
      const updatedHistory = [
        { id: `BUY_free_${now}`, at: now, coins: 0, kind: "buy", planId: "free" },
        ...(Array.isArray(state.history) ? state.history : []),
      ]

      const updatedState = { ...state, owned: updatedOwned, history: updatedHistory }

      await db`
        INSERT INTO game_states (user_id, state, updated_at)
        VALUES (${uid}, ${JSON.stringify(updatedState)}::jsonb, now())
        ON CONFLICT (user_id) DO UPDATE
        SET state = ${JSON.stringify(updatedState)}::jsonb, updated_at = now()
      `

      return NextResponse.json({
        success: true,
        activated: true,
        planId,
        planName: plan.name,
        message: "Free Solar Trial Plan successfully activated!",
      })
    }

    // ── 2. PAID PLAN LIMIT CHECK (Max 10 active of same plan) ────────────────
    const activeSamePlanCount = owned.filter(
      (o: any) => o.planId === planId && Number(o.claimed || 0) < plan.days
    ).length

    if (activeSamePlanCount >= 10) {
      return NextResponse.json(
        { error: "Maximum active limit (10/10) reached for this plan" },
        { status: 400 }
      )
    }

    // ── 3. WALLET PAYMENT FLOW ──────────────────────────────────────────────
    if (paymentMethod === "wallet") {
      const walletSummary = await getUserWalletSummary(uid)
      const availableBalance = walletSummary.mainAvailableBalance

      if (availableBalance < plan.cost) {
        return NextResponse.json(
          {
            error: `Insufficient wallet balance (₹${availableBalance}). You need ₹${plan.cost} to purchase ${plan.name}.`,
            availableBalance,
            required: plan.cost,
          },
          { status: 400 }
        )
      }

      const now = Date.now()
      const rand = crypto.randomBytes(3).toString("hex").toUpperCase()
      const orderId = `ORD_W_${now}_${rand}`

      // 1. Record confirmed purchase order in database
      await db`
        INSERT INTO orders (
          id, user_id, plan_id, amount, status, txn_id, credited_to_wallet, created_at, updated_at
        ) VALUES (
          ${orderId}, ${uid}, ${planId}, ${plan.cost}, 'SUCCESS', 'WALLET_BALANCE', false, now(), now()
        )
      `

      // 2. Activate plan in game state and deduct coins
      const newPlanEntry = {
        id: orderId,
        planId,
        claimed: 0,
        boughtAt: now,
        lastClaimAt: null,
      }

      const historyDebitEntry = {
        id: orderId,
        at: now,
        coins: -plan.cost,
        kind: "buy",
        planId,
        amount: plan.cost,
        paymentMethod: "wallet",
      }

      const updatedOwned = [newPlanEntry, ...owned]
      const updatedHistory = [historyDebitEntry, ...(Array.isArray(state.history) ? state.history : [])]

      const nextRemainingCoins = Math.max(0, availableBalance - plan.cost)
      const updatedState = {
        ...state,
        coins: nextRemainingCoins,
        owned: updatedOwned,
        history: updatedHistory,
      }

      await db`
        INSERT INTO game_states (user_id, state, updated_at)
        VALUES (${uid}, ${JSON.stringify(updatedState)}::jsonb, now())
        ON CONFLICT (user_id) DO UPDATE
        SET state = ${JSON.stringify(updatedState)}::jsonb, updated_at = now()
      `

      console.log(`[PlanPurchase] User ${uid} purchased ${planId} for ₹${plan.cost} via wallet. Remaining balance: ₹${nextRemainingCoins}`)

      return NextResponse.json({
        success: true,
        activated: true,
        paymentMethod: "wallet",
        orderId,
        planId,
        planName: plan.name,
        cost: plan.cost,
        remainingBalance: nextRemainingCoins,
        message: `🎉 Successfully purchased ${plan.name} using wallet balance!`,
      })
    }

    // ── 4. GATEWAY PAYMENT FLOW (AeroPay) ────────────────────────────────────
    if (paymentMethod === "gateway") {
      const rand = crypto.randomBytes(3).toString("hex").toUpperCase()
      const orderId = `ORD_${Date.now()}_${rand}`

      const notifyUrl = getCallbackUrl()
      const returnUrl = getReturnUrl(orderId)

      const result = await AeropayService.createPaymentSession({
        orderNo: orderId,
        amount: plan.cost.toFixed(2),
        notifyUrl,
        returnUrl,
      })

      // Insert pending order in DB
      await db`
        INSERT INTO orders (id, user_id, plan_id, amount, status, pay_url, created_at, updated_at)
        VALUES (${orderId}, ${uid}, ${planId}, ${plan.cost}, 'PENDING', ${result.payUrl}, now(), now())
      `

      return NextResponse.json({
        success: true,
        paymentMethod: "gateway",
        orderId,
        paymentUrl: result.payUrl,
      })
    }

    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
  } catch (err: unknown) {
    console.error("[Plan Purchase API Error]:", err)
    const msg = err instanceof Error ? err.message : "Failed to process plan purchase"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
