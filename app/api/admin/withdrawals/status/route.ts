import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

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

    // Update withdrawal
    await db`
      UPDATE withdrawals
      SET status = ${status},
          utr = ${utr || withdrawal.utr},
          admin_note = ${adminNote || withdrawal.admin_note},
          updated_at = now()
      WHERE id = ${id}
    `

    // If rejecting and refund is enabled, refund coins to user's wallet
    if (status === "REJECTED" && refundUser) {
      const refundAmount = Number(withdrawal.amount) || 0
      const [gameState] = await db`SELECT state FROM game_states WHERE user_id = ${withdrawal.user_id} LIMIT 1`
      const state = gameState?.state || {}
      const currentCoins = Number(state.coins || 0)
      const newCoins = currentCoins + refundAmount
      const now = Date.now()

      const refundEntry = {
        id: `REF_${id}`,
        at: now,
        coins: refundAmount,
        kind: "welcome",
        note: `Refund for rejected withdrawal ${id}`,
      }

      const updatedHistory = [refundEntry, ...(Array.isArray(state.history) ? state.history : [])]
      const updatedState = {
        ...state,
        coins: newCoins,
        history: updatedHistory,
      }

      await db`
        UPDATE game_states
        SET state = ${JSON.stringify(updatedState)}::jsonb,
            updated_at = now()
        WHERE user_id = ${withdrawal.user_id}
      `
    }

    return NextResponse.json({ success: true, id, status })
  } catch (err) {
    console.error("[Withdrawal Status Update Error]:", err)
    return NextResponse.json({ error: "Failed to update withdrawal status" }, { status: 500 })
  }
}
