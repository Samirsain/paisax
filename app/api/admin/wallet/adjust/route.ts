import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { getUserWalletSummary } from "@/lib/wallet-ledger"
import { parseGameState } from "@/lib/order-credit"

/**
 * POST /api/admin/wallet/adjust
 * 
 * Secure Admin Wallet Adjustment:
 * Supports credit or debit to user's Main Wallet or Referral Balance.
 * Logs adminId, reason, amount, balanceType, timestamp in wallet_adjustments table.
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get("paisax_admin_session")?.value

    if (adminSession !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { userId, amount: rawAmount, balanceType = "main", reason } = body

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const amount = Number(rawAmount)
    if (isNaN(amount) || amount === 0) {
      return NextResponse.json({ error: "Adjustment amount cannot be zero" }, { status: 400 })
    }

    if (!reason?.trim()) {
      return NextResponse.json({ error: "Please provide a reason for the adjustment" }, { status: 400 })
    }

    const [user] = await db`SELECT id, name, phone FROM users WHERE id = ${userId} LIMIT 1`
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 1. Record adjustment in wallet_adjustments table
    const [adjustment] = await db`
      INSERT INTO wallet_adjustments (
        user_id, amount, balance_type, reason, admin_id, created_at
      ) VALUES (
        ${userId}, ${amount}, ${balanceType}, ${reason.trim()}, 'admin', now()
      )
      RETURNING id, created_at
    `

    // 2. Load game state and append history entry
    const [gsRow] = await db`SELECT state FROM game_states WHERE user_id = ${userId} LIMIT 1`
    const state = parseGameState(gsRow?.state)

    const now = Date.now()
    const historyEntry = {
      id: `ADJ_${adjustment.id}`,
      at: now,
      coins: amount,
      kind: amount > 0 ? "admin_credit" : "admin_debit",
      balanceType,
      reason: reason.trim(),
    }

    const updatedHistory = [historyEntry, ...(Array.isArray(state.history) ? state.history : [])]

    // 3. Recalculate authoritative ledger balance
    const summary = await getUserWalletSummary(userId)

    const updatedState = {
      ...state,
      coins: summary.availableBalance,
      history: updatedHistory,
    }

    await db`
      INSERT INTO game_states (user_id, state, updated_at)
      VALUES (${userId}, ${JSON.stringify(updatedState)}::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE
      SET state = ${JSON.stringify(updatedState)}::jsonb, updated_at = now()
    `

    console.log(`[AdminAdjustment] Adjusted user ${userId} by ₹${amount} (${balanceType}). Reason: ${reason}`)

    return NextResponse.json({
      success: true,
      adjustmentId: adjustment.id,
      userId,
      amount,
      balanceType,
      newAvailableBalance: summary.availableBalance,
      mainAvailableBalance: summary.mainAvailableBalance,
      referralAvailableBalance: summary.referralAvailableBalance,
      message: `Successfully adjusted ₹${amount} (${balanceType}) for ${user.name}`,
    })
  } catch (err: unknown) {
    console.error("[Admin Wallet Adjust Error]:", err)
    const msg = err instanceof Error ? err.message : "Failed to adjust wallet"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

