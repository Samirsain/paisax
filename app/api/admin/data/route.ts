import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { getPlan, type PlanId } from "@/lib/game"

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get("paisax_admin_session")?.value

    if (adminSession !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Fetch all users with their game state
    const usersRows = await db`
      SELECT 
        u.id,
        u.name,
        u.phone,
        u.invite_code,
        u.invited_by,
        u.created_at,
        COALESCE(g.state, '{}'::jsonb) as state
      FROM users u
      LEFT JOIN game_states g ON g.user_id = u.id
      ORDER BY u.created_at DESC
    `.catch((err) => {
      console.error("Failed to query users:", err)
      return []
    })

    // 2. Fetch all orders
    const ordersRows = await db`
      SELECT 
        o.id,
        o.user_id,
        o.plan_id,
        o.amount,
        o.status,
        o.txn_id,
        o.credited_to_wallet,
        o.created_at,
        u.name as user_name,
        u.phone as user_phone
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `.catch((err) => {
      console.error("Failed to query orders:", err)
      return []
    })

    // 3. Fetch all withdrawals
    const withdrawalsRows = await db`
      SELECT 
        w.id,
        w.user_id,
        w.account_name,
        w.account_number,
        w.bank_name,
        w.ifsc_code,
        w.amount,
        w.fee,
        w.net_amount,
        w.status,
        w.utr,
        w.admin_note,
        w.created_at,
        w.updated_at,
        u.name as user_name,
        u.phone as user_phone
      FROM withdrawals w
      JOIN users u ON u.id = w.user_id
      ORDER BY w.created_at DESC
    `.catch((err) => {
      console.error("Failed to query withdrawals:", err)
      return []
    })

    // Parse and enrich users
    const users = usersRows.map((u: any) => {
      const state = u.state || {}
      const owned = Array.isArray(state.owned) ? state.owned : []
      const paidOwned = owned.filter((o: any) => o?.planId && o.planId !== "free")
      const userOrders = ordersRows.filter((o: any) => o.user_id === u.id)
      const successfulOrders = userOrders.filter((o: any) => o.status === "SUCCESS")

      const hasPaid = paidOwned.length > 0 || successfulOrders.length > 0

      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        inviteCode: u.invite_code,
        invitedBy: u.invited_by || null,
        createdAt: u.created_at,
        coins: Number(state.coins ?? 0),
        lifetime: Number(state.lifetime ?? 0),
        hasPaidPlan: hasPaid,
        paidPlansCount: paidOwned.length || successfulOrders.length,
        ownedPlans: owned.map((o: any) => ({
          planId: o.planId,
          planName: getPlan(o.planId as PlanId)?.name || o.planId,
          perDay: getPlan(o.planId as PlanId)?.perDay || 0,
          claimed: o.claimed ?? 0,
          boughtAt: o.boughtAt,
        })),
        totalOrdersCount: userOrders.length,
      }
    })

    // Users with paid plans (either from successful orders or owned paid plans)
    const paidUsersMap = new Map<string, any>()

    for (const u of users) {
      if (u.hasPaidPlan) {
        paidUsersMap.set(u.id, {
          userId: u.id,
          name: u.name,
          phone: u.phone,
          inviteCode: u.inviteCode,
          createdAt: u.createdAt,
          coins: u.coins,
          ownedPlans: u.ownedPlans.filter((p: any) => p.planId !== "free"),
        })
      }
    }

    const paidUsersList = Array.from(paidUsersMap.values())

    // Summary calculations
    const totalUsers = users.length
    const paidUsersCount = paidUsersList.length
    const totalDeposits = ordersRows
      .filter((o: any) => o.status === "SUCCESS")
      .reduce((sum: number, o: any) => sum + (Number(o.amount) || 0), 0)

    const pendingWithdrawals = withdrawalsRows.filter((w: any) => w.status === "PENDING")
    const approvedWithdrawals = withdrawalsRows.filter((w: any) => w.status === "APPROVED" || w.status === "PAID")

    const pendingWithdrawalsAmount = pendingWithdrawals.reduce(
      (sum: number, w: any) => sum + (Number(w.net_amount) || Number(w.amount) || 0),
      0
    )

    const approvedWithdrawalsAmount = approvedWithdrawals.reduce(
      (sum: number, w: any) => sum + (Number(w.net_amount) || Number(w.amount) || 0),
      0
    )

    return NextResponse.json({
      stats: {
        totalUsers,
        paidUsersCount,
        totalDeposits,
        totalOrdersCount: ordersRows.length,
        pendingWithdrawalsCount: pendingWithdrawals.length,
        pendingWithdrawalsAmount,
        approvedWithdrawalsCount: approvedWithdrawals.length,
        approvedWithdrawalsAmount,
        totalWithdrawalsCount: withdrawalsRows.length,
      },
      users,
      paidUsers: paidUsersList,
      orders: ordersRows.map((o: any) => ({
        id: o.id,
        userId: o.user_id,
        userName: o.user_name,
        userPhone: o.user_phone,
        planId: o.plan_id,
        planName: getPlan(o.plan_id as PlanId)?.name || o.plan_id,
        amount: o.amount,
        status: o.status,
        txnId: o.txn_id,
        createdAt: o.created_at,
      })),
      withdrawals: withdrawalsRows.map((w: any) => ({
        id: w.id,
        userId: w.user_id,
        userName: w.user_name,
        userPhone: w.user_phone,
        accountName: w.account_name,
        accountNumber: w.account_number,
        bankName: w.bank_name || "Bank Transfer",
        ifscCode: w.ifsc_code,
        amount: w.amount,
        fee: w.fee,
        netAmount: w.net_amount,
        status: w.status,
        utr: w.utr,
        adminNote: w.admin_note,
        createdAt: w.created_at,
        updatedAt: w.updated_at,
      })),
    })
  } catch (err) {
    console.error("[Admin Data API Error]:", err)
    return NextResponse.json({ error: "Failed to load admin data" }, { status: 500 })
  }
}
