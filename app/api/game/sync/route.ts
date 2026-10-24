import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

/**
 * GET /api/game/sync
 *
 * Synchronizes client state with the database:
 * 1. Returns confirmed paid orders so client never loses a purchased plan.
 * 2. Returns user profile details and any server-saved state.
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

    // 2. Fetch all successful orders for this user
    const orders = await db`
      SELECT id, plan_id, amount, created_at, credited_to_wallet
      FROM orders
      WHERE user_id = ${uid} AND status = 'SUCCESS'
      ORDER BY created_at ASC
    `.catch(() => [])

    // 3. Fetch server backup state
    const [gameStateRow] = await db`
      SELECT state FROM game_states WHERE user_id = ${uid} LIMIT 1
    `.catch(() => [undefined])

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
      serverState: gameStateRow?.state ?? null,
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
      SELECT id, plan_id FROM orders WHERE user_id = ${uid} AND status = 'SUCCESS'
    `.catch(() => [])

    const confirmedOrderIds = new Set(confirmedOrders.map((o: any) => o.id))

    // 2. Sanitize owned plans: A paid plan CANNOT exist without a confirmed order in DB!
    const rawOwned = Array.isArray(state.owned) ? state.owned : []
    const sanitizedOwned = rawOwned.filter((o: any) => {
      if (!o || typeof o !== "object") return false
      // Free trial plan is always allowed
      if (o.planId === "free") return true
      // Any other plan must be backed by a confirmed order in DB
      return confirmedOrderIds.has(o.id)
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
