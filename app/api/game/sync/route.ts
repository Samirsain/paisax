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

    // Ensure all confirmed plan purchases exist in serverState.owned
    if (orders.length > 0) {
      if (!Array.isArray(serverState.owned)) serverState.owned = []
      if (!Array.isArray(serverState.history)) serverState.history = []

      let stateModified = false
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

      if (stateModified) {
        await db`
          INSERT INTO game_states (user_id, state, updated_at)
          VALUES (${uid}, ${JSON.stringify(serverState)}::jsonb, now())
          ON CONFLICT (user_id) DO UPDATE
          SET state = ${JSON.stringify(serverState)}::jsonb,
              updated_at = now()
        `.catch(() => {})
      }
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

    // 1. Security Check: Fetch all confirmed orders for this user
    const confirmedOrders = await db`
      SELECT id, plan_id FROM orders WHERE user_id = ${uid} AND (status = 'SUCCESS' OR credited_to_wallet = true)
    `.catch(() => [])

    const confirmedOrderIds = new Set(confirmedOrders.map((o: any) => o.id))
    const confirmedPlanIds = new Set(confirmedOrders.map((o: any) => o.plan_id))

    // 2. Sanitize owned plans: A paid plan CANNOT exist without a confirmed order in DB!
    const rawOwned = Array.isArray(state.owned) ? state.owned : []
    const sanitizedOwned = rawOwned.filter((o: any) => {
      if (!o || typeof o !== "object") return false
      // Free trial plan is always allowed
      if (o.planId === "free") return true
      // Match by order ID or confirmed plan ID
      return confirmedOrderIds.has(o.id) || confirmedPlanIds.has(o.planId)
    })

    const sanitizedState = {
      ...state,
      owned: sanitizedOwned,
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
