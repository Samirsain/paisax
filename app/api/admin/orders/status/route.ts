import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { AeropayService } from "@/lib/aeropay"
import { creditOrderToUser } from "@/lib/order-credit"

/**
 * POST /api/admin/orders/status
 *
 * Admin actions on deposit orders:
 * 1. action: "CHECK_GATEWAY" -> Queries live AeroPay status, if success auto-credits plan
 * 2. action: "MANUAL_APPROVE" -> Manually credits the plan and marks order SUCCESS
 * 3. action: "MARK_FAILED" -> Marks order FAILED
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get("paisax_admin_session")?.value

    if (adminSession !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId, action, utr } = await req.json().catch(() => ({}))

    if (!orderId || !action) {
      return NextResponse.json({ error: "Missing orderId or action" }, { status: 400 })
    }

    const [order] = await db`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (action === "CHECK_GATEWAY") {
      try {
        const queryRes = await AeropayService.queryOrder(orderId)
        if (queryRes.orderState === 1) {
          await creditOrderToUser(orderId, queryRes.tradeNo)
          return NextResponse.json({
            success: true,
            status: "SUCCESS",
            message: `AeroPay confirmed payment! Plan activated with UTR: ${queryRes.tradeNo || "N/A"}`,
            utr: queryRes.tradeNo,
          })
        } else {
          return NextResponse.json({
            success: true,
            status: order.status,
            message: `Gateway status is ${queryRes.orderState === 0 ? "Pending (Not Paid)" : `Failed (Code ${queryRes.orderState})`}`,
          })
        }
      } catch (err: unknown) {
        return NextResponse.json({
          success: false,
          error: `AeroPay query failed: ${err instanceof Error ? err.message : String(err)}`,
        }, { status: 502 })
      }
    }

    if (action === "MANUAL_APPROVE") {
      await creditOrderToUser(orderId, utr || "MANUAL_ADMIN_APPROVAL")
      return NextResponse.json({
        success: true,
        status: "SUCCESS",
        message: "Order approved and plan successfully activated for user!",
      })
    }

    if (action === "MARK_FAILED") {
      await db`
        UPDATE orders
        SET status = 'FAILED',
            updated_at = now()
        WHERE id = ${orderId}
      `
      return NextResponse.json({
        success: true,
        status: "FAILED",
        message: "Order marked as FAILED.",
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err: unknown) {
    console.error("[Admin Order Status Error]:", err)
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 })
  }
}
