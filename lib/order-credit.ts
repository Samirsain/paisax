import { db } from "@/lib/db"

/**
 * Safely parses game state from DB which may be a JSON string or JSONB object.
 */
export function parseGameState(rawState: unknown): Record<string, any> {
  if (!rawState) return {}
  if (typeof rawState === "string") {
    try {
      return JSON.parse(rawState)
    } catch {
      return {}
    }
  }
  if (typeof rawState === "object") {
    return rawState as Record<string, any>
  }
  return {}
}

/**
 * 3-Level Referral Commission Distribution
 * Level 1: 10%
 * Level 2: 3%
 * Level 3: 1.5%
 * Maximum 3 levels. Fully idempotent and secure against duplicate distributions.
 */
export async function distributeReferralCommissions(orderId: string, payerId: string, orderAmount: number) {
  if (!orderAmount || orderAmount <= 0) return

  // 1. Fetch payer details
  const [payer] = await db`
    SELECT id, name, phone, invited_by FROM users WHERE id = ${payerId} LIMIT 1
  `.catch(() => [])

  if (!payer || !payer.invited_by) return

  const rates: { level: number; percent: number }[] = [
    { level: 1, percent: 10 },
    { level: 2, percent: 3 },
    { level: 3, percent: 1.5 },
  ]

  let currentUplineIdentifier: string | null = payer.invited_by

  for (const { level, percent } of rates) {
    if (!currentUplineIdentifier) break

    // Find upline user by ID or invite code
    const [upline] = await db`
      SELECT id, name, phone, invited_by FROM users
      WHERE id::text = ${currentUplineIdentifier} OR UPPER(invite_code) = UPPER(${currentUplineIdentifier})
      LIMIT 1
    `.catch(() => [])

    if (!upline) break

    // Prevent self-referral loop
    if (upline.id === payerId) break

    // Calculate commission amount
    const commissionAmount = Math.round(((orderAmount * percent) / 100) * 100) / 100

    if (commissionAmount > 0) {
      // Check if commission for this order, recipient, and level already exists
      const existing = await db`
        SELECT id FROM referral_commissions
        WHERE order_id = ${orderId} AND recipient_id = ${upline.id} AND level = ${level}
        LIMIT 1
      `.catch(() => [])

      if (existing.length === 0) {
        // Record commission in referral_commissions table
        await db`
          INSERT INTO referral_commissions (
            order_id, payer_id, recipient_id, level, percent, order_amount, commission_amount, status, created_at
          ) VALUES (
            ${orderId}, ${payerId}, ${upline.id}, ${level}, ${percent}, ${orderAmount}, ${commissionAmount}, 'PAID', now()
          )
          ON CONFLICT (order_id, recipient_id, level) DO NOTHING
        `.catch((err) => {
          console.error(`[ReferralCommission] Insert error for order ${orderId}, level ${level}:`, err)
        })

        // Credit upline's game_states
        try {
          const [gsRow] = await db`
            SELECT state FROM game_states WHERE user_id = ${upline.id} LIMIT 1
          `
          let uplineState = parseGameState(gsRow?.state)
          if (!Array.isArray(uplineState.history)) uplineState.history = []

          const now = Date.now()
          uplineState.coins = (Number(uplineState.coins) || 0) + commissionAmount
          uplineState.lifetime = (Number(uplineState.lifetime) || 0) + commissionAmount

          const maskedPhone = payer.phone ? `${payer.phone.slice(0, 3)}****${payer.phone.slice(-3)}` : ""
          const historyEntry = {
            id: `COMM_${orderId}_L${level}`,
            at: now,
            coins: commissionAmount,
            kind: "commission",
            level,
            percent,
            orderId,
            orderAmount,
            payerName: payer.name || "Team Member",
            payerPhone: maskedPhone,
          }

          uplineState.history = [historyEntry, ...uplineState.history]

          await db`
            INSERT INTO game_states (user_id, state, updated_at)
            VALUES (${upline.id}, ${JSON.stringify(uplineState)}::jsonb, now())
            ON CONFLICT (user_id) DO UPDATE
            SET state = ${JSON.stringify(uplineState)}::jsonb,
                updated_at = now()
          `

          console.log(`[ReferralCommission] Credited Level ${level} (${percent}%) = ₹${commissionAmount} to ${upline.name} (${upline.id}) from order ${orderId} by ${payer.name}`)
        } catch (creditErr) {
          console.error(`[ReferralCommission] Error crediting upline ${upline.id}:`, creditErr)
        }
      }
    }

    // Move to next upline level
    currentUplineIdentifier = upline.invited_by || null
  }
}

/**
 * Credits a confirmed order (plan purchase or recharge) to user's game state and marks order SUCCESS.
 * Idempotent: safe to call multiple times for the same orderId.
 */
export async function creditOrderToUser(orderId: string, utr?: string) {
  const [order] = await db`
    SELECT id, user_id, plan_id, amount, status, credited_to_wallet
    FROM orders
    WHERE id = ${orderId}
    LIMIT 1
  `

  if (!order) {
    throw new Error(`Order ${orderId} not found`)
  }

  // 1. Mark order as SUCCESS in DB
  await db`
    UPDATE orders
    SET status = 'SUCCESS',
        credited_to_wallet = true,
        txn_id = COALESCE(${utr || null}, txn_id),
        updated_at = now()
    WHERE id = ${orderId}
  `

  // 2. Load and parse user game state
  const [gsRow] = await db`
    SELECT state FROM game_states WHERE user_id = ${order.user_id} LIMIT 1
  `

  let state = parseGameState(gsRow?.state)
  if (!Array.isArray(state.owned)) state.owned = []
  if (!Array.isArray(state.history)) state.history = []

  const now = Date.now()

  // 3. Credit plan or recharge
  if (order.plan_id === "recharge") {
    const alreadyHistory = state.history.some((h: any) => h.id === orderId)
    if (!alreadyHistory) {
      state.coins = (Number(state.coins) || 0) + Number(order.amount)
      state.lifetime = (Number(state.lifetime) || 0) + Number(order.amount)
      state.history = [
        {
          id: orderId,
          at: now,
          coins: Number(order.amount),
          kind: "welcome",
        },
        ...state.history,
      ]
    }
  } else {
    // Plan activation
    const alreadyOwned = state.owned.some((o: any) => o.id === orderId)
    if (!alreadyOwned) {
      const newOwned = {
        id: orderId,
        planId: order.plan_id,
        claimed: 0,
        boughtAt: now,
        lastClaimAt: null,
      }
      state.owned = [newOwned, ...state.owned]

      const newHistory = {
        id: `BUY_${orderId}`,
        at: now,
        coins: 0,
        kind: "buy",
        planId: order.plan_id,
      }
      state.history = [newHistory, ...state.history]
    }
  }

  // 4. Save updated game state to DB
  await db`
    INSERT INTO game_states (user_id, state, updated_at)
    VALUES (${order.user_id}, ${JSON.stringify(state)}::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE
    SET state = ${JSON.stringify(state)}::jsonb,
        updated_at = now()
  `

  console.log(`[OrderCredit] Order ${orderId} credited: plan ${order.plan_id} for user ${order.user_id}`)

  // 5. Distribute 3-Level Referral Commissions if eligible paid order
  if (order.plan_id !== "free" && Number(order.amount) > 0) {
    try {
      await distributeReferralCommissions(orderId, order.user_id, Number(order.amount))
    } catch (commErr) {
      console.error(`[OrderCredit] Failed to distribute referral commissions for order ${orderId}:`, commErr)
    }
  }

  return { success: true, userId: order.user_id, planId: order.plan_id }
}
