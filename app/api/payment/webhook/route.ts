import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * AeroPay server-to-server webhook (Pay-in Notify URL).
 * AeroPay POSTs here after every payment — success or failure.
 * This is separate from the redirect callback.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, string>
  try {
    const ct = req.headers.get("content-type") ?? ""
    if (ct.includes("application/json")) {
      body = await req.json()
    } else {
      const text = await req.text()
      body = Object.fromEntries(new URLSearchParams(text))
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const orderId = body.order_id ?? body.txnid ?? body.merchant_order_id
  const status  = (body.status ?? body.txnStatus ?? "").toUpperCase()
  const txnId   = body.txn_id ?? body.mihpayid ?? body.transaction_id ?? ""

  if (!orderId) return NextResponse.json({ ok: false, msg: "missing order_id" }, { status: 400 })

  if (status === "SUCCESS") {
    await db`UPDATE orders SET status='SUCCESS', txn_id=${txnId}, updated_at=now() WHERE id=${orderId} AND status='PENDING'`
    // Credit plan to user's game state
    const [order] = await db`SELECT user_id, plan_id FROM orders WHERE id=${orderId} LIMIT 1`
    if (order) {
      await db`
        UPDATE game_states
        SET state = jsonb_set(COALESCE(state,'{}'), '{pendingPlan}', ${JSON.stringify(order.plan_id)}::jsonb),
            updated_at = now()
        WHERE user_id = ${order.user_id}
      `
    }
  } else if (status === "FAILED" || status === "FAILURE") {
    await db`UPDATE orders SET status='FAILED', txn_id=${txnId}, updated_at=now() WHERE id=${orderId}`
  }

  // AeroPay expects a plain 200 OK
  return new NextResponse("OK", { status: 200 })
}

// Some gateways send GET for verification
export async function GET() {
  return new NextResponse("OK", { status: 200 })
}
