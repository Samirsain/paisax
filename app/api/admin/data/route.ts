import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { getPlan, type PlanId } from "@/lib/game"

export async function GET(req: NextRequest) {
  try {
    let adminSession = req.cookies.get("paisax_admin_session")?.value
    if (!adminSession) {
      try {
        const cookieStore = await cookies()
        adminSession = cookieStore.get("paisax_admin_session")?.value
      } catch {
        // ignore prerender context
      }
    }

    if (adminSession !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Fetch all users with their game state & parent inviter
    const usersRows = await db`
      SELECT 
        u.id,
        u.name,
        u.phone,
        u.invite_code,
        u.invited_by,
        u.created_at,
        u.bank_account_name,
        u.bank_account_number,
        u.bank_name,
        u.bank_ifsc,
        u.bank_updated_at,
        inv.name as inviter_name,
        inv.phone as inviter_phone,
        COALESCE(g.state, '{}'::jsonb) as state
      FROM users u
      LEFT JOIN users inv ON (inv.id::text = u.invited_by OR UPPER(inv.invite_code) = UPPER(u.invited_by))
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

    // 4. Fetch all referral commissions
    const commissionsRows = await db`
      SELECT 
        rc.id,
        rc.order_id,
        rc.payer_id,
        rc.recipient_id,
        rc.level,
        rc.percent,
        rc.order_amount,
        rc.commission_amount,
        rc.status,
        rc.created_at,
        payer.name as payer_name,
        payer.phone as payer_phone,
        recip.name as recipient_name,
        recip.phone as recipient_phone
      FROM referral_commissions rc
      JOIN users payer ON payer.id = rc.payer_id
      JOIN users recip ON recip.id = rc.recipient_id
      ORDER BY rc.created_at DESC
    `.catch((err) => {
      console.error("Failed to query referral commissions:", err)
      return []
    })

    // Precompute commission earned per recipient
    const commissionsByRecipient = new Map<string, number>()
    commissionsRows.forEach((c: any) => {
      commissionsByRecipient.set(
        c.recipient_id,
        (commissionsByRecipient.get(c.recipient_id) || 0) + (Number(c.commission_amount) || 0)
      )
    })

    // Precompute direct invites count per user
    const directInvitesCountMap = new Map<string, number>()
    usersRows.forEach((u: any) => {
      if (u.invited_by) {
        directInvitesCountMap.set(
          u.invited_by,
          (directInvitesCountMap.get(u.invited_by) || 0) + 1
        )
      }
    })

    // Parse and enrich users
    const users = usersRows.map((u: any) => {
      let state = u.state || {}
      if (typeof state === "string") {
        try {
          state = JSON.parse(state)
        } catch {
          state = {}
        }
      }
      const owned = Array.isArray(state.owned) ? state.owned : []
      const paidOwned = owned.filter((o: any) => o?.planId && o.planId !== "free")
      const userOrders = ordersRows.filter((o: any) => o.user_id === u.id)
      const successfulOrders = userOrders.filter((o: any) => o.status === "SUCCESS")
      const totalDepositsAmount = successfulOrders.reduce((sum: number, o: any) => sum + (Number(o.amount) || 0), 0)

      const hasPaid = paidOwned.length > 0 || successfulOrders.length > 0

      const enrichedOwnedPlans = owned.map((o: any) => {
        const p = getPlan(o.planId as PlanId)
        return {
          id: o.id || `${o.planId}_${o.boughtAt}`,
          planId: o.planId,
          planName: p?.name || o.planId,
          cost: p?.cost || 0,
          perDay: p?.perDay || 0,
          days: p?.days || 0,
          totalReturn: (p?.perDay || 0) * (p?.days || 0),
          claimed: o.claimed ?? 0,
          boughtAt: o.boughtAt,
        }
      })

      const directInvites = directInvitesCountMap.get(u.id) || directInvitesCountMap.get(u.invite_code) || 0
      const totalCommissionEarned = commissionsByRecipient.get(u.id) || 0

      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        inviteCode: u.invite_code,
        invitedBy: u.invited_by || null,
        inviterName: u.inviter_name || null,
        inviterPhone: u.inviter_phone || null,
        directInvitesCount: directInvites,
        totalCommissionEarned,
        createdAt: u.created_at,
        coins: Number(state.coins ?? 0),
        lifetime: Number(state.lifetime ?? 0),
        hasPaidPlan: hasPaid,
        paidPlansCount: paidOwned.length || successfulOrders.length,
        totalDepositsAmount,
        successfulOrdersCount: successfulOrders.length,
        totalOrdersCount: userOrders.length,
        ownedPlans: enrichedOwnedPlans,
        bankAccountName: u.bank_account_name || null,
        bankAccountNumber: u.bank_account_number || null,
        bankName: u.bank_name || null,
        bankIfsc: u.bank_ifsc || null,
        bankUpdatedAt: u.bank_updated_at || null,
        successfulOrders: successfulOrders.map((o: any) => ({
          id: o.id,
          planId: o.plan_id,
          planName: getPlan(o.plan_id as PlanId)?.name || o.plan_id,
          amount: Number(o.amount) || 0,
          txnId: o.txn_id,
          createdAt: o.created_at,
        })),
      }
    })

    // Users with paid plans (either from successful orders or owned paid plans)
    const paidUsersMap = new Map<string, any>()

    for (const u of users) {
      if (u.hasPaidPlan) {
        // Collect all paid plans from ownedPlans
        const paidPlans = u.ownedPlans.filter((p: any) => p.planId !== "free")

        // If user has successful orders not already in ownedPlans, add them
        const existingIds = new Set(paidPlans.map((p: any) => p.id))
        for (const so of u.successfulOrders) {
          if (!existingIds.has(so.id) && so.planId !== "free" && so.planId !== "recharge") {
            const p = getPlan(so.planId as PlanId)
            paidPlans.push({
              id: so.id,
              planId: so.planId,
              planName: p?.name || so.planId,
              cost: so.amount || p?.cost || 0,
              perDay: p?.perDay || 0,
              days: p?.days || 0,
              totalReturn: (p?.perDay || 0) * (p?.days || 0),
              claimed: 0,
              boughtAt: new Date(so.createdAt).getTime(),
            })
          }
        }

        paidUsersMap.set(u.id, {
          userId: u.id,
          name: u.name,
          phone: u.phone,
          inviteCode: u.inviteCode,
          invitedBy: u.invitedBy,
          inviterName: u.inviterName,
          inviterPhone: u.inviterPhone,
          directInvitesCount: u.directInvitesCount,
          totalCommissionEarned: u.totalCommissionEarned,
          createdAt: u.createdAt,
          coins: u.coins,
          totalDeposits: u.totalDepositsAmount,
          depositCount: u.successfulOrdersCount,
          bankAccountName: u.bankAccountName,
          bankAccountNumber: u.bankAccountNumber,
          bankName: u.bankName,
          bankIfsc: u.bankIfsc,
          ownedPlans: paidPlans,
          successfulOrders: u.successfulOrders,
        })
      }
    }

    const paidUsersList = Array.from(paidUsersMap.values())

    // Overall KPI Stats
    const totalUsers = users.length
    const paidUsersCount = paidUsersList.length
    const successfulOrdersList = ordersRows.filter((o: any) => o.status === "SUCCESS")
    const totalDeposits = successfulOrdersList.reduce((sum: number, o: any) => sum + (Number(o.amount) || 0), 0)
    const totalDepositsCount = successfulOrdersList.length

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

    const totalCommissionsPaid = commissionsRows.reduce(
      (sum: number, c: any) => sum + (Number(c.commission_amount) || 0),
      0
    )

    return NextResponse.json({
      stats: {
        totalUsers,
        paidUsersCount,
        totalDeposits,
        totalDepositsCount,
        totalOrdersCount: ordersRows.length,
        pendingWithdrawalsCount: pendingWithdrawals.length,
        pendingWithdrawalsAmount,
        approvedWithdrawalsCount: approvedWithdrawals.length,
        approvedWithdrawalsAmount,
        totalWithdrawalsCount: withdrawalsRows.length,
        totalCommissionsPaid,
        totalCommissionsCount: commissionsRows.length,
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
        amount: Number(o.amount) || 0,
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
        amount: Number(w.amount) || 0,
        fee: Number(w.fee) || 0,
        netAmount: Number(w.net_amount) || 0,
        status: w.status,
        utr: w.utr,
        adminNote: w.admin_note,
        createdAt: w.created_at,
        updatedAt: w.updated_at,
      })),
      commissions: commissionsRows.map((c: any) => ({
        id: c.id,
        orderId: c.order_id,
        payerId: c.payer_id,
        payerName: c.payer_name,
        payerPhone: c.payer_phone,
        recipientId: c.recipient_id,
        recipientName: c.recipient_name,
        recipientPhone: c.recipient_phone,
        level: Number(c.level),
        percent: Number(c.percent),
        orderAmount: Number(c.order_amount),
        commissionAmount: Number(c.commission_amount),
        status: c.status,
        createdAt: c.created_at,
      })),
    })
  } catch (err) {
    console.error("[Admin Data API Error]:", err)
    return NextResponse.json({ error: "Failed to load admin data" }, { status: 500 })
  }
}
