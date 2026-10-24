import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

function maskPhone(phone: string | null | undefined): string {
  if (!phone || phone.length < 10) return "User"
  return `${phone.slice(0, 3)}****${phone.slice(-3)}`
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const uid = cookieStore.get("paisax_uid")?.value

    if (!uid) {
      return NextResponse.json({ error: "Please log in" }, { status: 401 })
    }

    // 1. Fetch current user
    const [user] = await db`
      SELECT id, name, phone, invite_code FROM users WHERE id = ${uid} LIMIT 1
    `
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const inviteCode = user.invite_code

    // 2. Query Level 1 users (directly invited by user ID or invite code)
    const level1Users = await db`
      SELECT id, name, phone, created_at
      FROM users
      WHERE invited_by = ${uid} OR UPPER(invited_by) = UPPER(${inviteCode})
      ORDER BY created_at DESC
    `.catch(() => [])

    const l1Ids = level1Users.map((u: any) => u.id)
    const l1InviteCodes = level1Users.map((u: any) => u.invite_code).filter(Boolean)

    // 3. Query Level 2 users (invited by Level 1 members)
    let level2Users: any[] = []
    if (l1Ids.length > 0) {
      level2Users = await db`
        SELECT id, name, phone, created_at
        FROM users
        WHERE invited_by IN ${db(l1Ids)}
           OR UPPER(invited_by) IN ${db(l1InviteCodes.length > 0 ? l1InviteCodes : ['__NONE__'])}
        ORDER BY created_at DESC
      `.catch(() => [])
    }

    const l2Ids = level2Users.map((u: any) => u.id)
    const l2InviteCodes = level2Users.map((u: any) => u.invite_code).filter(Boolean)

    // 4. Query Level 3 users (invited by Level 2 members)
    let level3Users: any[] = []
    if (l2Ids.length > 0) {
      level3Users = await db`
        SELECT id, name, phone, created_at
        FROM users
        WHERE invited_by IN ${db(l2Ids)}
           OR UPPER(invited_by) IN ${db(l2InviteCodes.length > 0 ? l2InviteCodes : ['__NONE__'])}
        ORDER BY created_at DESC
      `.catch(() => [])
    }

    // All team user IDs across 3 levels
    const allTeamIds = [...l1Ids, ...l2Ids, ...level3Users.map((u: any) => u.id)]

    // 5. Query all successful orders by team members to compute active status & deposits
    let teamOrders: any[] = []
    if (allTeamIds.length > 0) {
      teamOrders = await db`
        SELECT user_id, amount
        FROM orders
        WHERE user_id IN ${db(allTeamIds)} AND status = 'SUCCESS' AND plan_id != 'free'
      `.catch(() => [])
    }

    // Map user_id -> total deposits
    const depositsMap = new Map<string, number>()
    for (const o of teamOrders) {
      depositsMap.set(o.user_id, (depositsMap.get(o.user_id) || 0) + (Number(o.amount) || 0))
    }

    // 6. Query commissions earned by current user grouped by level
    const commissionsRows = await db`
      SELECT 
        level,
        COALESCE(SUM(commission_amount), 0) as total_amount,
        COUNT(id) as count
      FROM referral_commissions
      WHERE recipient_id = ${uid}
      GROUP BY level
    `.catch(() => [])

    const commByLevel = new Map<number, number>()
    commissionsRows.forEach((r: any) => {
      commByLevel.set(Number(r.level), Number(r.total_amount) || 0)
    })

    // 7. Recent commission logs for this user
    const recentCommissions = await db`
      SELECT 
        rc.id,
        rc.level,
        rc.percent,
        rc.order_amount,
        rc.commission_amount,
        rc.created_at,
        u.name as payer_name,
        u.phone as payer_phone
      FROM referral_commissions rc
      JOIN users u ON u.id = rc.payer_id
      WHERE rc.recipient_id = ${uid}
      ORDER BY rc.created_at DESC
      LIMIT 25
    `.catch(() => [])

    // Enrich users for each level
    const enrichUsers = (usersList: any[]) =>
      usersList.map((u) => {
        const deposited = depositsMap.get(u.id) || 0
        return {
          id: u.id,
          name: u.name,
          phone: maskPhone(u.phone),
          createdAt: u.created_at,
          deposited,
          isActive: deposited > 0,
        }
      })

    const enrichedL1 = enrichUsers(level1Users)
    const enrichedL2 = enrichUsers(level2Users)
    const enrichedL3 = enrichUsers(level3Users)

    const l1Recharge = enrichedL1.reduce((sum, u) => sum + u.deposited, 0)
    const l2Recharge = enrichedL2.reduce((sum, u) => sum + u.deposited, 0)
    const l3Recharge = enrichedL3.reduce((sum, u) => sum + u.deposited, 0)

    const totalTeamRecharge = l1Recharge + l2Recharge + l3Recharge
    const totalTeamMembers = enrichedL1.length + enrichedL2.length + enrichedL3.length
    const totalActiveMembers =
      enrichedL1.filter((u) => u.isActive).length +
      enrichedL2.filter((u) => u.isActive).length +
      enrichedL3.filter((u) => u.isActive).length

    const l1Comm = commByLevel.get(1) || 0
    const l2Comm = commByLevel.get(2) || 0
    const l3Comm = commByLevel.get(3) || 0
    const totalCommission = l1Comm + l2Comm + l3Comm

    return NextResponse.json({
      inviteCode,
      totalTeamMembers,
      totalActiveMembers,
      totalTeamRecharge,
      totalCommission,
      paidCommission: totalCommission,
      pendingCommission: 0,
      levels: [
        {
          level: 1,
          name: "Level 1 – Direct Referrals",
          commissionRate: "10%",
          percent: 10,
          membersCount: enrichedL1.length,
          activeCount: enrichedL1.filter((u) => u.isActive).length,
          rechargeAmount: l1Recharge,
          commissionEarned: l1Comm,
          members: enrichedL1,
        },
        {
          level: 2,
          name: "Level 2 – Indirect Referrals",
          commissionRate: "3%",
          percent: 3,
          membersCount: enrichedL2.length,
          activeCount: enrichedL2.filter((u) => u.isActive).length,
          rechargeAmount: l2Recharge,
          commissionEarned: l2Comm,
          members: enrichedL2,
        },
        {
          level: 3,
          name: "Level 3 – 3rd-Level Referrals",
          commissionRate: "1.5%",
          percent: 1.5,
          membersCount: enrichedL3.length,
          activeCount: enrichedL3.filter((u) => u.isActive).length,
          rechargeAmount: l3Recharge,
          commissionEarned: l3Comm,
          members: enrichedL3,
        },
      ],
      recentCommissions: recentCommissions.map((c: any) => ({
        id: c.id,
        level: Number(c.level),
        percent: Number(c.percent),
        orderAmount: Number(c.order_amount),
        commissionAmount: Number(c.commission_amount),
        createdAt: c.created_at,
        payerName: c.payer_name,
        payerPhone: maskPhone(c.payer_phone),
      })),
    })
  } catch (err) {
    console.error("[Referral Team API Error]:", err)
    return NextResponse.json({ error: "Failed to load referral data" }, { status: 500 })
  }
}
