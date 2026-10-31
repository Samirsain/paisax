import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

/**
 * GET /api/wallet/transactions
 * Returns all real, database-backed transactions for the logged in user:
 * - Deposit orders (SUCCESS, PENDING, FAILED)
 * - Withdrawals (PENDING, APPROVED/PAID, REJECTED)
 * - Referral commissions
 * - Gift card redemptions
 */

export async function GET() {
  try {
    const cookieStore = await cookies()
    const uid = cookieStore.get("paisax_uid")?.value

    if (!uid) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // 1. Fetch real deposit orders from database
    const orders = await db`
      SELECT id, plan_id, amount, status, txn_id, created_at
      FROM orders
      WHERE user_id = ${uid}
      ORDER BY created_at DESC
      LIMIT 100
    `.catch(() => [])

    // 2. Fetch real withdrawal records from database
    const withdrawals = await db`
      SELECT id, amount, fee, net_amount, status, utr, admin_note, account_number, bank_name, created_at
      FROM withdrawals
      WHERE user_id = ${uid}
      ORDER BY created_at DESC
      LIMIT 100
    `.catch(() => [])

    // 3. Fetch referral commissions
    const commissions = await db`
      SELECT rc.id, rc.order_id, rc.level, rc.commission_amount, rc.created_at,
             u.name as payer_name, u.phone as payer_phone
      FROM referral_commissions rc
      JOIN users u ON u.id = rc.payer_id
      WHERE rc.recipient_id = ${uid}
      ORDER BY rc.created_at DESC
      LIMIT 100
    `.catch(() => [])

    // 4. Fetch gift card redemptions
    const giftCards = await db`
      SELECT id, code, amount, redeemed_at
      FROM gift_card_redemptions
      WHERE user_id = ${uid}
      ORDER BY redeemed_at DESC
      LIMIT 100
    `.catch(() => [])

    // Normalize all records into a unified list
    const list: Array<{
      id: string
      type: "deposit" | "withdrawal" | "commission" | "giftcard"
      title: string
      amount: number
      netAmount?: number
      status: "SUCCESS" | "PENDING" | "FAILED" | "REJECTED" | "APPROVED" | "PAID"
      date: string
      timestamp: number
      reference?: string
      note?: string
      meta?: any
    }> = []

    // Map orders
    for (const o of orders) {
      const isRecharge = o.plan_id === "recharge"
      const status = (o.status || "PENDING").toUpperCase() as any
      list.push({
        id: o.id,
        type: "deposit",
        title: isRecharge ? "Wallet Recharge (UPI)" : `Plan Purchase · ${o.plan_id}`,
        amount: Number(o.amount) || 0,
        status: status === "SUCCESS" ? "SUCCESS" : status === "FAILED" ? "FAILED" : "PENDING",
        date: o.created_at,
        timestamp: new Date(o.created_at).getTime(),
        reference: o.txn_id || o.id,
      })
    }

    // Map withdrawals
    for (const w of withdrawals) {
      const rawStatus = (w.status || "PENDING").toUpperCase()
      const normalizedStatus =
        rawStatus === "PAID" || rawStatus === "APPROVED"
          ? "SUCCESS"
          : rawStatus === "REJECTED"
          ? "FAILED"
          : "PENDING"

      list.push({
        id: w.id,
        type: "withdrawal",
        title: "Bank Payout Withdrawal",
        amount: Number(w.amount) || 0,
        netAmount: Number(w.net_amount) || 0,
        status: normalizedStatus as any,
        date: w.created_at,
        timestamp: new Date(w.created_at).getTime(),
        reference: w.utr || w.id,
        note: w.admin_note || (normalizedStatus === "FAILED" ? "Refunded to wallet" : undefined),
        meta: {
          accountNumber: w.account_number ? `****${w.account_number.slice(-4)}` : undefined,
          bankName: w.bank_name,
          fee: w.fee,
        },
      })
    }

    // Map commissions
    for (const c of commissions) {
      list.push({
        id: c.id,
        type: "commission",
        title: `Referral Commission (Tier ${c.level})`,
        amount: Number(c.commission_amount) || 0,
        status: "SUCCESS",
        date: c.created_at,
        timestamp: new Date(c.created_at).getTime(),
        reference: c.order_id,
        note: `From ${c.payer_name || "Team Member"}`,
      })
    }

    // Map gift cards
    for (const g of giftCards) {
      list.push({
        id: g.id,
        type: "giftcard",
        title: `Gift Card Redeemed`,
        amount: Number(g.amount) || 0,
        status: "SUCCESS",
        date: g.redeemed_at,
        timestamp: new Date(g.redeemed_at).getTime(),
        reference: g.code,
      })
    }

    // Sort combined list descending by timestamp
    list.sort((a, b) => b.timestamp - a.timestamp)

    return NextResponse.json({
      transactions: list,
      counts: {
        total: list.length,
        deposits: orders.length,
        withdrawals: withdrawals.length,
        commissions: commissions.length,
        giftCards: giftCards.length,
      },
    })
  } catch (err) {
    console.error("[Transactions GET Error]:", err)
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 })
  }
}
