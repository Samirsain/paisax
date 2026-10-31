import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { AeropayService } from "@/lib/aeropay"
import { creditOrderToUser, parseGameState } from "@/lib/order-credit"

/**
 * GET /api/game/sync
 *
 * Synchronizes client state with the database:
 * 1. Checks any recent PENDING orders against AeroPay live so missed webhooks are auto-credited.
 * 2. Returns confirmed paid orders and safely parsed serverState so client never loses a purchased plan.
 *
 * POST /api/game/sync
 *
 * Backs up client game state with server-side validation:
 * Validates that paid plans in `state.owned` are strictly backed by confirmed orders in DB.
 */

export async function GET() {
  try {
    const cookieStore = await cookies()
    const uid = cookieStore.get("paisax_uid")?.value

    if (!uid) {
      return NextResponse.json({ authenticated: false })
    }

    // 1. Fetch user profile
    const [user] = await db`
      SELECT id, name, phone, invite_code FROM users WHERE id = ${uid} LIMIT 1
    `.catch(() => [undefined])

    if (!user) {
      return NextResponse.json({ authenticated: false })
    }

    // 2. Active Reconcile: Check any recent PENDING orders with AeroPay live
    try {
      const recentPending = await db`
        SELECT id FROM orders
        WHERE user_id = ${uid}
          AND status = 'PENDING'
          AND created_at > now() - interval '24 hours'
        ORDER BY created_at DESC
        LIMIT 3
      `.catch(() => [])

      for (const po of recentPending) {
        try {
          const queryRes = await AeropayService.queryOrder(po.id)
          if (queryRes.orderState === 1) {
            console.log(`[Sync GET] Auto-reconciled order ${po.id} to SUCCESS via live check`)
            await creditOrderToUser(po.id, queryRes.tradeNo)
          }
        } catch {
          // Ignore individual gateway query errors
        }
      }
    } catch (recErr) {
      console.warn("[Sync GET] Auto-reconcile check warning:", recErr)
    }

    // 3. Fetch all successful orders for this user
    const orders = await db`
      SELECT id, plan_id, amount, created_at, credited_to_wallet
      FROM orders
      WHERE user_id = ${uid} AND (status = 'SUCCESS' OR credited_to_wallet = true)
      ORDER BY created_at ASC
    `.catch(() => [])

    // 4. Fetch server backup state
    const [gameStateRow] = await db`
      SELECT state FROM game_states WHERE user_id = ${uid} LIMIT 1
    `.catch(() => [undefined])

    let serverState = parseGameState(gameStateRow?.state)
    if (!Array.isArray(serverState.owned)) serverState.owned = []
    if (!Array.isArray(serverState.history)) serverState.history = []

    let stateModified = false

    // 5. Ensure all confirmed plan purchases exist in serverState.owned
    if (orders.length > 0) {
      for (const order of orders) {
        if (order.plan_id !== "recharge") {
          const alreadyOwned = serverState.owned.some(
            (o: any) => o.id === order.id || (o.planId === order.plan_id && o.boughtAt)
          )
          if (!alreadyOwned) {
            const buyTime = order.created_at ? new Date(order.created_at).getTime() : Date.now()
            serverState.owned.push({
              id: order.id,
              planId: order.plan_id,
              claimed: 0,
              boughtAt: buyTime,
              lastClaimAt: null,
            })
            serverState.history.unshift({
              id: `BUY_${order.id}`,
              at: buyTime,
              coins: 0,
              kind: "buy",
              planId: order.plan_id,
            })
            stateModified = true
          }
        }
      }
    }

    // 6. Active Reconcile: Ensure all referral commissions are in serverState.history and credited to wallet
    try {
      const commissions = await db`
        SELECT rc.id, rc.order_id, rc.level, rc.percent, rc.order_amount, rc.commission_amount, rc.created_at,
               u.name as payer_name, u.phone as payer_phone
        FROM referral_commissions rc
        JOIN users u ON u.id = rc.payer_id
        WHERE rc.recipient_id = ${uid}
        ORDER BY rc.created_at ASC
      `.catch(() => [])

      for (const comm of commissions) {
        const commHistId = `COMM_${comm.order_id}_L${comm.level}`
        const alreadyInHistory = serverState.history.some(
          (h: any) => h.id === commHistId || h.id === comm.id || (h.kind === "commission" && h.orderId === comm.order_id && h.level === comm.level)
        )
        if (!alreadyInHistory) {
          const commAmt = Number(comm.commission_amount) || 0
          serverState.coins = (Number(serverState.coins) || 0) + commAmt
          serverState.lifetime = (Number(serverState.lifetime) || 0) + commAmt
          const payerPhoneMasked = comm.payer_phone ? `${comm.payer_phone.slice(0, 3)}****${comm.payer_phone.slice(-3)}` : ""
          serverState.history.unshift({
            id: commHistId,
            at: comm.created_at ? new Date(comm.created_at).getTime() : Date.now(),
            coins: commAmt,
            kind: "commission",
            level: Number(comm.level),
            percent: Number(comm.percent),
            orderId: comm.order_id,
            orderAmount: Number(comm.order_amount),
            payerName: comm.payer_name || "Team Member",
            payerPhone: payerPhoneMasked,
          })
          stateModified = true
          console.log(`[Sync GET] Reconciled missing referral commission ${commHistId} (₹${commAmt}) for user ${uid}`)
        }
      }
    } catch (commReconcileErr) {
      console.warn("[Sync GET] Referral commission reconcile warning:", commReconcileErr)
    }

    // 7. Active Reconcile: Ensure all gift card redemptions are in serverState.history and credited
    try {
      const redemptions = await db`
        SELECT id, code, amount, redeemed_at
        FROM gift_card_redemptions
        WHERE user_id = ${uid}
        ORDER BY redeemed_at ASC
      `.catch(() => [])

      for (const red of redemptions) {
        const giftHistId = `GIFT_${red.id}`
        const alreadyInHistory = serverState.history.some(
          (h: any) => h.id === giftHistId || (h.kind === "giftcard" && h.code === red.code)
        )
        if (!alreadyInHistory) {
          const redAmt = Number(red.amount) || 0
          serverState.coins = (Number(serverState.coins) || 0) + redAmt
          serverState.lifetime = (Number(serverState.lifetime) || 0) + redAmt
          serverState.history.unshift({
            id: giftHistId,
            at: red.redeemed_at ? new Date(red.redeemed_at).getTime() : Date.now(),
            coins: redAmt,
            kind: "giftcard",
            code: red.code,
            amount: redAmt,
          })
          stateModified = true
          console.log(`[Sync GET] Reconciled gift card redemption ${red.code} (₹${redAmt}) for user ${uid}`)
        }
      }
    } catch (giftReconcileErr) {
      console.warn("[Sync GET] Gift card reconcile warning:", giftReconcileErr)
    }

    if (stateModified) {
      await db`
        INSERT INTO game_states (user_id, state, updated_at)
        VALUES (${uid}, ${JSON.stringify(serverState)}::jsonb, now())
        ON CONFLICT (user_id) DO UPDATE
        SET state = ${JSON.stringify(serverState)}::jsonb,
            updated_at = now()
      `.catch(() => {})
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        inviteCode: user.invite_code,
      },
      confirmedOrders: orders.map((o: any) => ({
        orderId: o.id,
        planId: o.plan_id,
        amount: o.amount,
        createdAt: o.created_at,
      })),
      serverState: Object.keys(serverState).length > 0 ? serverState : null,
    })
  } catch (err) {
    console.error("[Sync GET Error]:", err)
    return NextResponse.json({ error: "Failed to sync" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const uid = cookieStore.get("paisax_uid")?.value

    if (!uid) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 })
    }

    const { state } = await req.json()
    if (!state || typeof state !== "object") {
      return NextResponse.json({ error: "Invalid state" }, { status: 400 })
    }

    // 1. Fetch current server state
    const [gameStateRow] = await db`SELECT state FROM game_states WHERE user_id = ${uid} LIMIT 1`.catch(() => [undefined])
    const currentServerState = parseGameState(gameStateRow?.state)

    // 2. Security Check: Fetch all confirmed orders for this user
    const confirmedOrders = await db`
      SELECT id, plan_id FROM orders WHERE user_id = ${uid} AND (status = 'SUCCESS' OR credited_to_wallet = true)
    `.catch(() => [])

    const confirmedOrderIds = new Set(confirmedOrders.map((o: any) => o.id))
    const confirmedPlanIds = new Set(confirmedOrders.map((o: any) => o.plan_id))

    // 3. Sanitize owned plans: A paid plan CANNOT exist without a confirmed order in DB!
    const rawOwned = Array.isArray(state.owned) ? state.owned : []
    const sanitizedOwned = rawOwned.filter((o: any) => {
      if (!o || typeof o !== "object") return false
      // Free trial plan is always allowed
      if (o.planId === "free") return true
      // Match by order ID or confirmed plan ID
      return confirmedOrderIds.has(o.id) || confirmedPlanIds.has(o.planId)
    })

    // 4. Merge history to ensure server-side commissions, gift cards, and withdrawals are never lost
    const clientHistory = Array.isArray(state.history) ? state.history : []
    const serverHistory = Array.isArray(currentServerState.history) ? currentServerState.history : []
    const clientHistoryIds = new Set(clientHistory.map((h: any) => h?.id))

    const preservedServerEntries = serverHistory.filter(
      (sh: any) =>
        sh &&
        !clientHistoryIds.has(sh.id) &&
        (sh.kind === "commission" || sh.kind === "giftcard" || sh.kind === "withdraw" || sh.id?.startsWith("BUY_"))
    )

    const mergedHistory = [...preservedServerEntries, ...clientHistory]

    // 5. Coins protection: Don't allow client to drop below server coins if server has referral earnings / gift cards
    const serverCoins = Number(currentServerState.coins) || 0
    const serverLifetime = Number(currentServerState.lifetime) || 0
    const clientCoins = Number(state.coins) || 0
    const clientLifetime = Number(state.lifetime) || 0

    const sanitizedState = {
      ...state,
      coins: Math.max(serverCoins, clientCoins),
      lifetime: Math.max(serverLifetime, clientLifetime),
      owned: sanitizedOwned,
      history: mergedHistory,
    }

    // Upsert game_states table with sanitized state
    await db`
      INSERT INTO game_states (user_id, state, updated_at)
      VALUES (${uid}, ${JSON.stringify(sanitizedState)}::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE
      SET state = ${JSON.stringify(sanitizedState)}::jsonb,
          updated_at = now()
    `

    return NextResponse.json({ ok: true, sanitized: true })
  } catch (err) {
    console.error("[Sync POST Error]:", err)
    return NextResponse.json({ error: "Failed to persist state" }, { status: 500 })
  }
}
