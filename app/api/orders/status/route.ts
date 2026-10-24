import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { AeropayService } from "@/lib/aeropay"
import { creditOrderToUser } from "@/lib/order-credit"

/**
 * GET /api/orders/status?orderId=ORD_xxx
 *
 * Returns the current status of a payment order.
 * If the order is still PENDING in DB, it actively checks AeroPay gateway.
 * If AeroPay confirms success (orderState=1), it automatically activates the plan
 * and returns SUCCESS immediately.
 */
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId")

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 })
  }

  try {
    const [order] = await db`
      SELECT id, user_id, status, amount, plan_id, credited_to_wallet
      FROM orders
      WHERE id = ${orderId}
      LIMIT 1
    `

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // If order is still PENDING or not credited, verify live with AeroPay gateway
    if (order.status === "PENDING" || !order.credited_to_wallet) {
      try {
        const queryRes = await AeropayService.queryOrder(orderId)
        if (queryRes.orderState === 1) {
          console.log(`[OrdersStatus] Live gateway check SUCCESS for ${orderId}, activating plan...`)
          await creditOrderToUser(orderId, queryRes.tradeNo)
          return NextResponse.json({
            orderId: order.id,
            status: "SUCCESS",
            amount: order.amount,
            planId: order.plan_id,
            credited: true,
          })
        }
      } catch (gatewayErr: unknown) {
        console.warn(`[OrdersStatus] AeroPay query failed for ${orderId}:`, gatewayErr instanceof Error ? gatewayErr.message : gatewayErr)
      }
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      planId: order.plan_id,
      credited: order.credited_to_wallet ?? false,
    })
  } catch (err: unknown) {
    console.error(`[OrdersStatus] Error:`, err)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
}
