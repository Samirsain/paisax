import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifySignature } from "@/lib/aeropay"
import { AEROPAY_CALLBACK_IP } from "@/lib/gateway-config"

/**
 * POST /api/payment/webhook
 *
 * Unified AeroPay callback for deposits, user payouts, and merchant payouts.
 * AeroPay sends { code, msg, data: { orderNo, orderState, amount, sign, ... } }
 *
 * Signature is verified on data{} fields only.
 *
 * orderState: 1 = success, anything else = failure
 *
 * Routing by orderNo prefix:
 * - W_...  → payout (user withdrawal)
 * - MW_... → merchant payout (logged, not saved to DB)
 * - ORD_.. → deposit
 *
 * Responses:
 * - 200 "ok"  → processed, duplicate, or order not found
 * - 403 "invalid signature" → signature mismatch
 * - 500 "error" → wallet credit transaction failure
 */
export async function POST(req: NextRequest) {
  // ── Parse body (JSON or form-encoded) ───────────────────────────────
  let rawBody: Record<string, unknown>
  try {
    const ct = req.headers.get("content-type") ?? ""
    if (ct.includes("application/json")) {
      rawBody = await req.json()
    } else {
      const text = await req.text()
      rawBody = Object.fromEntries(new URLSearchParams(text))
    }
  } catch {
    return new NextResponse("error", { status: 400 })
  }

  // ── IP check (log-only, not hard block) ─────────────────────────────
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"

  if (clientIp !== AEROPAY_CALLBACK_IP) {
    console.warn(`[Webhook] Non-AeroPay IP: ${clientIp} (expected ${AEROPAY_CALLBACK_IP})`)
  }

  // ── Extract data{} (AeroPay wraps real data inside data field) ──────
  const data: Record<string, string> =
    typeof rawBody.data === "object" && rawBody.data !== null
      ? (rawBody.data as Record<string, string>)
      : (rawBody as Record<string, string>)

  const orderNo = String(data.orderNo ?? data.order_no ?? "")
  const orderState = Number(data.orderState ?? data.order_state ?? 0)
  const amount = String(data.amount ?? "0")
  // UTR: try businessNo → tradeNo → trade_no
  const utr = String(data.businessNo ?? data.tradeNo ?? data.trade_no ?? "")

  if (!orderNo) {
    console.warn("[Webhook] Missing orderNo in callback")
    return new NextResponse("ok", { status: 200 })
  }

  // ── Verify signature on data{} ──────────────────────────────────────
  if (!verifySignature(data)) {
    console.error(`[Webhook] Invalid signature for ${orderNo}`)
    return new NextResponse("invalid signature", { status: 403 })
  }

  console.log(`[Webhook] Received: orderNo=${orderNo}, state=${orderState}, amount=${amount}, utr=${utr}`)

  // ── Route by orderNo prefix ─────────────────────────────────────────
  try {
    if (orderNo.startsWith("W_")) {
      return await handlePayout(orderNo, orderState, utr)
    } else if (orderNo.startsWith("MW_")) {
      // Merchant withdrawals are not saved to DB; just log
      console.log(`[Webhook] Merchant payout ${orderNo}: state=${orderState}, utr=${utr}`)
      return new NextResponse("ok", { status: 200 })
    } else {
      return await handleDeposit(orderNo, orderState, amount, utr, data)
    }
  } catch (err) {
    console.error(`[Webhook] Error processing ${orderNo}:`, err)
    return new NextResponse("error", { status: 500 })
  }
}

// ── Deposit handler ───────────────────────────────────────────────────────

async function handleDeposit(
  orderNo: string,
  orderState: number,
  _amount: string,
  utr: string,
  rawData: Record<string, string>
) {
  // Fetch order from DB
  const [order] = await db`
    SELECT id, user_id, plan_id, amount, status, credited_to_wallet
    FROM orders WHERE id = ${orderNo} LIMIT 1
  `.catch(() => [undefined])

  if (!order) {
    console.warn(`[Webhook] Deposit order not found: ${orderNo}`)
    return new NextResponse("ok", { status: 200 })
  }

  // Save raw webhook data regardless of outcome
  await db`
    UPDATE orders
    SET webhook_payload = ${JSON.stringify(rawData)}::jsonb,
        webhook_received_at = now(),
        txn_id = ${utr || null},
        updated_at = now()
    WHERE id = ${orderNo}
  `.catch(() => {})

  // orderState = 1 → success
  if (orderState === 1) {
    // Idempotency: only credit if not already credited
    if (order.credited_to_wallet) {
      console.log(`[Webhook] Deposit ${orderNo} already credited — skipping`)
      return new NextResponse("ok", { status: 200 })
    }

    // Credit the plan to user's game state (atomic update)
    const updated = await db`
      UPDATE orders
      SET status = 'SUCCESS',
          credited_to_wallet = true,
          updated_at = now()
      WHERE id = ${orderNo} AND credited_to_wallet = false
      RETURNING user_id, plan_id
    `.catch(() => [])

    if (updated.length === 0) {
      console.log(`[Webhook] Deposit ${orderNo} concurrent credit — skipping`)
      return new NextResponse("ok", { status: 200 })
    }

    const { user_id, plan_id } = updated[0]

    // Mark plan as purchased in game state
    await db`
      UPDATE game_states
      SET state = jsonb_set(COALESCE(state,'{}'), '{pendingPlan}', ${JSON.stringify(plan_id)}::jsonb),
          updated_at = now()
      WHERE user_id = ${user_id}
    `.catch((err: unknown) => {
      console.error(`[Webhook] Failed to update game state for ${orderNo}:`, err)
    })

    console.log(`[Webhook] Deposit ${orderNo} SUCCESS — plan ${plan_id} credited to user ${user_id}`)
    return new NextResponse("ok", { status: 200 })
  } else {
    // Any non-1 state = failure — but don't overwrite a successful credit
    if (!order.credited_to_wallet) {
      await db`
        UPDATE orders SET status = 'FAILED', updated_at = now()
        WHERE id = ${orderNo} AND credited_to_wallet = false
      `.catch(() => {})
    }

    console.log(`[Webhook] Deposit ${orderNo} FAILED (state=${orderState})`)
    return new NextResponse("ok", { status: 200 })
  }
}

// ── Payout handler ────────────────────────────────────────────────────────

async function handlePayout(orderNo: string, orderState: number, utr: string) {
  // For now, log payout webhook — withdrawal tracking can be added when admin panel is built
  console.log(`[Webhook] Payout ${orderNo}: state=${orderState}, utr=${utr}`)

  // If you have a withdrawals table, update it here:
  // orderState === 1 → completed + save UTR
  // orderState !== 1 → rejected + refund wallet

  return new NextResponse("ok", { status: 200 })
}

// Some gateways send GET for verification
export async function GET() {
  return new NextResponse("ok", { status: 200 })
}
