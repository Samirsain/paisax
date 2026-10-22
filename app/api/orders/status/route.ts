import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * GET /api/orders/status?orderId=ORD_xxx
 *
 * Returns the current status of a payment order.
 * Used by the success page to poll for webhook confirmation.
 */
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId")

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 })
  }

  try {
    const [order] = await db`
      SELECT id, status, amount, plan_id, credited_to_wallet
      FROM orders
      WHERE id = ${orderId}
      LIMIT 1
    `

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      planId: order.plan_id,
      credited: order.credited_to_wallet ?? false,
    })
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
}
