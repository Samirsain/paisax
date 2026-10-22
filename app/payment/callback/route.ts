import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyPayment } from "@/lib/aeropay"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get("order_id")
  const status = searchParams.get("status") // some gateways pass this

  if (!orderId) return NextResponse.redirect(new URL("/?payment=failed", req.url))

  try {
    // Verify with AeroPay
    const result = await verifyPayment(orderId)
    const success = result.status === "SUCCESS" || status === "SUCCESS"

    if (success) {
      // Update order status in DB
      await db`UPDATE orders SET status = 'SUCCESS', updated_at = now() WHERE id = ${orderId}`

      // Credit the plan to the user's game state
      const [order] = await db`SELECT user_id, plan_id FROM orders WHERE id = ${orderId} LIMIT 1`
      if (order) {
        // Mark plan as purchased — the game store will pick it up
        await db`
          UPDATE game_states
          SET state = jsonb_set(
            COALESCE(state, '{}'),
            '{pendingPlan}',
            ${JSON.stringify(order.plan_id)}::jsonb
          ),
          updated_at = now()
          WHERE user_id = ${order.user_id}
        `
      }

      return NextResponse.redirect(new URL(`/?payment=success&plan=${order?.plan_id ?? ""}`, req.url))
    } else {
      await db`UPDATE orders SET status = 'FAILED', updated_at = now() WHERE id = ${orderId}`
      return NextResponse.redirect(new URL("/?payment=failed", req.url))
    }
  } catch (err) {
    console.error("Payment callback error:", err)
    return NextResponse.redirect(new URL("/?payment=error", req.url))
  }
}
