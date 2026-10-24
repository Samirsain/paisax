import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { AeropayService } from "@/lib/aeropay"
import { getPlan, type PlanId } from "@/lib/game"
import { DEPOSIT_MIN, DEPOSIT_MAX, getReturnUrl, getCallbackUrl } from "@/lib/gateway-config"
import crypto from "crypto"

/**
 * POST /api/payment/create-order
 *
 * Creates a deposit order, saves it to DB, then calls AeroPay payIn.
 * Returns { paymentUrl, orderId } on success.
 *
 * Flow:
 * 1. Auth check via paisax_uid cookie
 * 2. Validate plan exists and amount is within limits
 * 3. Save order to DB as 'PENDING'
 * 4. Call AeroPay createPaymentSession
 * 5. Update order with payUrl
 * 6. Return paymentUrl to frontend for redirect
 */
export async function POST(req: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────────
  const cookieStore = await cookies()
  const uid = cookieStore.get("paisax_uid")?.value
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const planId = body.planId
  const directAmount = parseInt(body.amount, 10)

  let orderAmount = 0
  let targetPlanId = ""

  if (planId) {
    let plan: ReturnType<typeof getPlan>
    try {
      plan = getPlan(planId as PlanId)
    } catch {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }
    orderAmount = plan.cost
    targetPlanId = plan.id
  } else if (!isNaN(directAmount) && directAmount > 0) {
    orderAmount = directAmount
    targetPlanId = "recharge"
  } else {
    return NextResponse.json({ error: "Missing planId or recharge amount" }, { status: 400 })
  }

  // ── Amount limit check ────────────────────────────────────────────────
  if (orderAmount < DEPOSIT_MIN || orderAmount > DEPOSIT_MAX) {
    return NextResponse.json(
      { error: `Amount must be between ₹${DEPOSIT_MIN} and ₹${DEPOSIT_MAX}` },
      { status: 400 }
    )
  }

  // ── Load user ─────────────────────────────────────────────────────────
  const [user] = await db`SELECT name, phone FROM users WHERE id = ${uid} LIMIT 1`
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // ── Create unique order ID: ORD_<timestamp>_<5 random chars> ──────────
  const orderId = `ORD_${Date.now()}_${crypto.randomBytes(3).toString("hex").slice(0, 5).toUpperCase()}`

  // ── Save order to DB before calling gateway ───────────────────────────
  await db`
    INSERT INTO orders (id, user_id, plan_id, amount, status, created_at)
    VALUES (${orderId}, ${uid}, ${targetPlanId}, ${orderAmount}, 'PENDING', now())
    ON CONFLICT DO NOTHING
  `.catch(async () => {
    // Create orders table on first use
    await db`
      CREATE TABLE IF NOT EXISTS orders (
        id          TEXT PRIMARY KEY,
        user_id     UUID NOT NULL REFERENCES users(id),
        plan_id     TEXT NOT NULL,
        amount      INT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'PENDING',
        txn_id      TEXT,
        pay_url     TEXT,
        webhook_payload JSONB,
        webhook_received_at TIMESTAMPTZ,
        credited_to_wallet BOOLEAN DEFAULT false,
        created_at  TIMESTAMPTZ DEFAULT now(),
        updated_at  TIMESTAMPTZ DEFAULT now()
      )
    `
    await db`
      INSERT INTO orders (id, user_id, plan_id, amount, status, created_at)
      VALUES (${orderId}, ${uid}, ${targetPlanId}, ${orderAmount}, 'PENDING', now())
    `
  })

  // ── Test mode bypass ──────────────────────────────────────────────────
  if (process.env.PAYMENT_TEST_MODE === "true") {
    const callbackUrl = getReturnUrl(orderId) + "&status=SUCCESS"
    return NextResponse.json({ paymentUrl: callbackUrl, orderId, testMode: true })
  }

  // ── Call AeroPay pay-in ───────────────────────────────────────────────
  try {
    const result = await AeropayService.createPaymentSession({
      orderNo: orderId,
      amount: orderAmount.toFixed(2),
      notifyUrl: getCallbackUrl(),
      returnUrl: getReturnUrl(orderId),
    })

    // Update order with payment URL
    await db`
      UPDATE orders SET pay_url = ${result.payUrl}, updated_at = now()
      WHERE id = ${orderId}
    `.catch(() => {})

    console.log("[CreateOrder] Success:", { orderId, payUrl: result.payUrl.slice(0, 60) + "…" })

    return NextResponse.json({ paymentUrl: result.payUrl, orderId })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Payment gateway error"
    console.error("[CreateOrder] Failed:", msg)

    // Mark order as failed
    await db`UPDATE orders SET status = 'FAILED', updated_at = now() WHERE id = ${orderId}`.catch(() => {})

    const userMsg =
      msg.includes("No Permission") || msg.includes("401")
        ? "Payment gateway is being configured. Please try again shortly."
        : msg.includes("timeout") || msg.includes("abort")
          ? "Payment gateway timed out. Please try again."
          : "Payment gateway error. Please try again."

    return NextResponse.json({ error: userMsg }, { status: 502 })
  }
}
