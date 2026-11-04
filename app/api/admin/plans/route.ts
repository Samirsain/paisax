import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { getPlan, PLANS, type PlanId, type Owned } from "@/lib/game"
import { parseGameState } from "@/lib/order-credit"
import crypto from "crypto"

/**
 * Admin Plan Management API
 * 
 * POST: Manually activate a plan for any user
 * Body: { userId: string, planId: PlanId }
 * 
 * PATCH: Toggle plan status (activate / deactivate / remove)
 * Body: { userId: string, planInstanceId: string, action: "deactivate" | "activate" | "delete" }
 */

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get("paisax_admin_session")?.value

    if (adminSession !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { userId, planId } = body

    if (!userId || !planId) {
      return NextResponse.json({ error: "userId and planId are required" }, { status: 400 })
    }

    // Verify user exists
    const [user] = await db`SELECT id, name, phone FROM users WHERE id = ${userId} LIMIT 1`
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const planConfig = getPlan(planId as PlanId)
    if (!planConfig) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 })
    }

    // Fetch existing game state
    const [gsRow] = await db`SELECT state FROM game_states WHERE user_id = ${userId} LIMIT 1`
    const state = parseGameState(gsRow?.state)

    if (!Array.isArray(state.owned)) {
      state.owned = []
    }
    if (!Array.isArray(state.history)) {
      state.history = []
    }

    const now = Date.now()
    const rand = crypto.randomBytes(3).toString("hex").toUpperCase()
    const orderId = `ORD_ADM_${now}_${rand}`

    const newOwnedPlan: Owned = {
      id: orderId,
      planId: planId as PlanId,
      claimed: 0,
      boughtAt: now,
      lastClaimAt: null,
      status: "active",
    }

    // Add to owned plans
    state.owned.push(newOwnedPlan)

    // Add history log
    state.history.unshift({
      id: `BUY_${orderId}`,
      at: now,
      coins: 0,
      kind: "buy",
      planId: planId as PlanId,
    })

    // Save game state
    await db`
      INSERT INTO game_states (user_id, state, updated_at)
      VALUES (${userId}, ${JSON.stringify(state)}::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE
      SET state = ${JSON.stringify(state)}::jsonb,
          updated_at = now()
    `

    // Also record an order in orders table for auditability and persistent recovery
    await db`
      INSERT INTO orders (
        id, user_id, plan_id, amount, status, txn_id, credited_to_wallet, created_at, updated_at
      ) VALUES (
        ${orderId},
        ${userId},
        ${planId},
        ${planConfig.cost},
        'SUCCESS',
        'ADMIN_ACTIVATED',
        true,
        now(),
        now()
      )
    `.catch((err) => {
      console.warn("[Admin Plan] Could not insert orders audit record:", err)
    })

    return NextResponse.json({
      success: true,
      message: `Plan ${planConfig.name} successfully activated for ${user.name || user.phone}!`,
      plan: newOwnedPlan,
    })
  } catch (err: unknown) {
    console.error("[Admin Plan POST Error]:", err)
    const msg = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get("paisax_admin_session")?.value

    if (adminSession !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { userId, planInstanceId, action } = body

    if (!userId || !planInstanceId || !action) {
      return NextResponse.json(
        { error: "userId, planInstanceId, and action ('activate' | 'deactivate' | 'delete') are required" },
        { status: 400 }
      )
    }

    // Fetch existing game state
    const [gsRow] = await db`SELECT state FROM game_states WHERE user_id = ${userId} LIMIT 1`
    if (!gsRow) {
      return NextResponse.json({ error: "User game state not found" }, { status: 404 })
    }

    const state = parseGameState(gsRow.state)
    const owned: Owned[] = Array.isArray(state.owned) ? state.owned : []

    // Match by exact id or planId
    const targetIdx = owned.findIndex(
      (o) => o.id === planInstanceId || (o.planId === planInstanceId && !o.id)
    )

    if (targetIdx === -1) {
      return NextResponse.json({ error: "Target plan not found in user's owned plans" }, { status: 404 })
    }

    const target = owned[targetIdx]

    if (action === "deactivate") {
      target.status = "deactivated"
    } else if (action === "activate") {
      target.status = "active"
    } else if (action === "delete") {
      owned.splice(targetIdx, 1)
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'activate', 'deactivate', or 'delete'" }, { status: 400 })
    }

    state.owned = owned

    // Save updated game state
    await db`
      UPDATE game_states
      SET state = ${JSON.stringify(state)}::jsonb,
          updated_at = now()
      WHERE user_id = ${userId}
    `

    const actionText =
      action === "deactivate"
        ? "deactivated"
        : action === "activate"
        ? "activated"
        : "removed"

    return NextResponse.json({
      success: true,
      message: `Plan ${target.planId} has been successfully ${actionText}.`,
      owned: state.owned,
    })
  } catch (err: unknown) {
    console.error("[Admin Plan PATCH Error]:", err)
    const msg = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

