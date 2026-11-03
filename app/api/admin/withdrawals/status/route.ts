import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { getUserWalletSummary } from "@/lib/wallet-ledger"

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get("paisax_admin_session")?.value

    if (adminSession !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, status, utr, adminNote, refundUser } = await req.json().catch(() => ({}))

    if (!id || !status) {
      return NextResponse.json({ error: "Missing withdrawal id or status" }, { status: 400 })
    }

    const [withdrawal] = await db`SELECT * FROM withdrawals WHERE id = ${id} LIMIT 1`
    if (!withdrawal) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 })
    }

    // 1. Update withdrawal status in withdrawals table
    await db`
      UPDATE withdrawals
      SET status = ${status},
          utr = ${utr || withdrawal.utr},
          admin_note = ${adminNote || withdrawal.admin_note},
          updated_at = now()
      WHERE id = ${id}
    `

    // 2. Recalculate authoritative balance and synchronize game_states
    const summary = await getUserWalletSummary(withdrawal.user_id)
    const state = summary.state || {}

    let updatedHistory = Array.isArray(state.history) ? state.history : []

    // If rejecting, record refund event in history
    if (status === "REJECTED") {
      const refundAmount = Number(withdrawal.amount) || 0
      const now = Date.now()
      const refundEntry = {
        id: `REF_${id}`,
        at: now,
        coins: refundAmount,
        kind: "refund",
        note: `Withdrawal rejected${adminNote ? ": " + adminNote : ""}`,
      }
      updatedHistory = [refundEntry, ...updatedHistory]
    }

    const updatedState = {
      ...state,
      coins: summary.availableBalance,
      history: updatedHistory,
    }

    await db`
      INSERT INTO game_states (user_id, state, updated_at)
      VALUES (${withdrawal.user_id}, ${JSON.stringify(updatedState)}::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE
      SET state = ${JSON.stringify(updatedState)}::jsonb,
          updated_at = now()
    `

    console.log(`[WithdrawalStatus] Withdrawal ${id} updated to ${status}. User ${withdrawal.user_id} balance synchronized to ₹${summary.availableBalance}`)

    return NextResponse.json({ success: true, id, status, availableBalance: summary.availableBalance })
  } catch (err) {
    console.error("[Withdrawal Status Update Error]:", err)
    return NextResponse.json({ error: "Failed to update withdrawal status" }, { status: 500 })
  }
}
