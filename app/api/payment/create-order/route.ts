import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { createOrder } from "@/lib/aeropay"
import { getPlan, type PlanId } from "@/lib/game"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  // Auth check
  const cookieStore = await cookies()
  const uid = cookieStore.get("paisax_uid")?.value
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  const { planId } = await req.json()
  if (!planId) return NextResponse.json({ error: "Missing planId" }, { status: 400 })

  let plan: ReturnType<typeof getPlan>
  try {
    plan = getPlan(planId as PlanId)
  } catch {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }

  // Load user
  const [user] = await db`SELECT name, phone FROM users WHERE id = ${uid} LIMIT 1`
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Create unique order ID
  const orderId = `PX-${crypto.randomBytes(6).toString("hex").toUpperCase()}`

  // Save pending order to DB before redirecting
  await db`
    INSERT INTO orders (id, user_id, plan_id, amount, status, created_at)
    VALUES (${orderId}, ${uid}, ${planId}, ${plan.cost}, 'PENDING', now())
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
        created_at  TIMESTAMPTZ DEFAULT now(),
        updated_at  TIMESTAMPTZ DEFAULT now()
      )
    `
    await db`
      INSERT INTO orders (id, user_id, plan_id, amount, status, created_at)
      VALUES (${orderId}, ${uid}, ${planId}, ${plan.cost}, 'PENDING', now())
    `
  })

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.headers.get("origin") ?? "http://localhost:3000"

  // ── Test mode bypass ─────────────────────────────────────────────
  // While AeroPay merchant account is being activated, simulate success
  if (process.env.PAYMENT_TEST_MODE === "true") {
    const callbackUrl = `${origin}/payment/callback?order_id=${orderId}&status=SUCCESS`
    return NextResponse.json({ paymentUrl: callbackUrl, orderId, testMode: true })
  }
  // ────────────────────────────────────────────────────────────────

  try {
    const order = await createOrder({
      orderId,
      amount: plan.cost,
      customerName: user.name,
      customerPhone: user.phone,
      returnUrl: `${origin}/payment/callback?order_id=${orderId}`,
      description: `PaisaX ${plan.name} Plan – ₹${plan.cost}`,
    })

    return NextResponse.json({ paymentUrl: order.paymentUrl, orderId })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Payment gateway error"
    const userMsg = msg.includes("No Permission") || msg.includes("401")
      ? "Payment gateway is being configured. Please try again shortly."
      : msg
    return NextResponse.json({ error: userMsg }, { status: 502 })
  }
}
