import { db } from "@/lib/db"
import { parseGameState } from "@/lib/order-credit"

export interface UserWalletSummary {
  userId: string
  availableBalance: number
  totalEarned: number
  commTotal: number
  giftTotal: number
  rechTotal: number
  gameEarned: number
  withdrawnTotal: number
  pendingWithdrawn: number
  approvedWithdrawn: number
  rejectedWithdrawn: number
  state: Record<string, any>
}

/**
 * Calculates authoritative wallet ledger balance for a single user.
 * 
 * Rules:
 * - Credits:
 *   1. Referral commissions with status = 'PAID'
 *   2. Gift card redemptions
 *   3. Wallet recharge deposits (orders with plan_id = 'recharge' AND status = 'SUCCESS')
 *   4. Daily solar claims, check-ins, welcomes, and invites from game_states history
 * - Deductions:
 *   All non-rejected withdrawals (status != 'REJECTED'):
 *   - 'PENDING' withdrawals reserve/deduct the funds immediately.
 *   - 'APPROVED' / 'PAID' withdrawals permanently deduct the funds.
 *   - 'REJECTED' withdrawals are excluded from deductions (automatically restoring the funds).
 */
export async function getUserWalletSummary(userId: string): Promise<UserWalletSummary> {
  // 1. Referral Commissions (paid)
  const [commRow] = await db`
    SELECT COALESCE(SUM(commission_amount), 0) as total
    FROM referral_commissions
    WHERE recipient_id = ${userId} AND status = 'PAID'
  `.catch(() => [{ total: 0 }])

  // 2. Gift Card Redemptions
  const [giftRow] = await db`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM gift_card_redemptions
    WHERE user_id = ${userId}
  `.catch(() => [{ total: 0 }])

  // 3. Recharge Orders (SUCCESS)
  const [rechRow] = await db`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM orders
    WHERE user_id = ${userId} AND plan_id = 'recharge' AND status = 'SUCCESS'
  `.catch(() => [{ total: 0 }])

  // 4. Withdrawals breakdown
  const withRows = await db`
    SELECT status, COALESCE(SUM(amount), 0) as total
    FROM withdrawals
    WHERE user_id = ${userId}
    GROUP BY status
  `.catch(() => [])

  let pendingWithdrawn = 0
  let approvedWithdrawn = 0
  let rejectedWithdrawn = 0

  for (const w of withRows) {
    const amt = Number(w.total) || 0
    if (w.status === "PENDING") {
      pendingWithdrawn += amt
    } else if (w.status === "APPROVED" || w.status === "PAID") {
      approvedWithdrawn += amt
    } else if (w.status === "REJECTED") {
      rejectedWithdrawn += amt
    }
  }

  // Active deductions = all withdrawals that are not rejected
  const withdrawnTotal = pendingWithdrawn + approvedWithdrawn

  // 5. Game state
  const [gsRow] = await db`
    SELECT state FROM game_states WHERE user_id = ${userId} LIMIT 1
  `.catch(() => [undefined])

  const state = parseGameState(gsRow?.state)

  let gameEarned = 0
  if (Array.isArray(state.history)) {
    for (const h of state.history) {
      if (!h) continue
      const c = Number(h.coins) || 0
      // Legitimate gameplay earnings (claim, checkin, welcome, invite). Exclude orders or refund/comm duplicates
      if (
        (h.kind === "claim" || h.kind === "checkin" || h.kind === "welcome" || h.kind === "invite") &&
        c > 0 &&
        !String(h.id || "").startsWith("REF_") &&
        !String(h.id || "").startsWith("ORD_")
      ) {
        gameEarned += c
      }
    }
  }

  const commTotal = Number(commRow?.total) || 0
  const giftTotal = Number(giftRow?.total) || 0
  const rechTotal = Number(rechRow?.total) || 0

  const totalEarned = commTotal + giftTotal + rechTotal + gameEarned
  const availableBalance = Math.max(0, totalEarned - withdrawnTotal)

  return {
    userId,
    availableBalance,
    totalEarned,
    commTotal,
    giftTotal,
    rechTotal,
    gameEarned,
    withdrawnTotal,
    pendingWithdrawn,
    approvedWithdrawn,
    rejectedWithdrawn,
    state,
  }
}

export interface AllUsersWalletSummary {
  userSummaryMap: Map<string, UserWalletSummary>
  totalWalletBalance: number
  totalPendingWithdrawals: number
  totalApprovedWithdrawals: number
}

/**
 * Bulk calculates authoritative wallet ledger balance for ALL users in high-performance aggregated queries.
 * Used by the Admin Panel to display accurate user balances and overall total system wallet balance.
 *
 * Queries run SEQUENTIALLY to stay within the connection pool limit (max: 3).
 * On Vercel serverless with Neon PostgreSQL, parallel queries exhaust the pool and cause timeouts.
 */
export async function getAllUsersWalletSummary(): Promise<AllUsersWalletSummary> {
  // Sequential queries to avoid connection pool exhaustion (pool max: 3)
  const users = await db`SELECT id FROM users`.catch(() => [])
  const gameStates = await db`SELECT user_id, state FROM game_states`.catch(() => [])
  const comms = await db`SELECT recipient_id, COALESCE(SUM(commission_amount), 0) as total FROM referral_commissions WHERE status = 'PAID' GROUP BY recipient_id`.catch(() => [])
  const gifts = await db`SELECT user_id, COALESCE(SUM(amount), 0) as total FROM gift_card_redemptions GROUP BY user_id`.catch(() => [])
  const rechs = await db`SELECT user_id, COALESCE(SUM(amount), 0) as total FROM orders WHERE plan_id = 'recharge' AND status = 'SUCCESS' GROUP BY user_id`.catch(() => [])
  const withs = await db`SELECT user_id, status, COALESCE(SUM(amount), 0) as total FROM withdrawals GROUP BY user_id, status`.catch(() => [])

  const gsMap = new Map<string, Record<string, any>>()
  for (const g of gameStates) {
    gsMap.set(g.user_id, parseGameState(g.state))
  }

  const commMap = new Map<string, number>()
  for (const c of comms) commMap.set(c.recipient_id, Number(c.total) || 0)

  const giftMap = new Map<string, number>()
  for (const g of gifts) giftMap.set(g.user_id, Number(g.total) || 0)

  const rechMap = new Map<string, number>()
  for (const r of rechs) rechMap.set(r.user_id, Number(r.total) || 0)

  const withPendingMap = new Map<string, number>()
  const withApprovedMap = new Map<string, number>()
  const withRejectedMap = new Map<string, number>()

  for (const w of withs) {
    const amt = Number(w.total) || 0
    if (w.status === "PENDING") {
      withPendingMap.set(w.user_id, (withPendingMap.get(w.user_id) || 0) + amt)
    } else if (w.status === "APPROVED" || w.status === "PAID") {
      withApprovedMap.set(w.user_id, (withApprovedMap.get(w.user_id) || 0) + amt)
    } else if (w.status === "REJECTED") {
      withRejectedMap.set(w.user_id, (withRejectedMap.get(w.user_id) || 0) + amt)
    }
  }

  const userSummaryMap = new Map<string, UserWalletSummary>()
  let totalWalletBalance = 0
  let totalPendingWithdrawals = 0
  let totalApprovedWithdrawals = 0

  for (const u of users) {
    const uid = u.id
    const state = gsMap.get(uid) || {}
    const commTotal = commMap.get(uid) || 0
    const giftTotal = giftMap.get(uid) || 0
    const rechTotal = rechMap.get(uid) || 0
    const pendingWithdrawn = withPendingMap.get(uid) || 0
    const approvedWithdrawn = withApprovedMap.get(uid) || 0
    const rejectedWithdrawn = withRejectedMap.get(uid) || 0
    const withdrawnTotal = pendingWithdrawn + approvedWithdrawn

    totalPendingWithdrawals += pendingWithdrawn
    totalApprovedWithdrawals += approvedWithdrawn

    let gameEarned = 0
    if (Array.isArray(state.history)) {
      for (const h of state.history) {
        if (!h) continue
        const c = Number(h.coins) || 0
        if (
          (h.kind === "claim" || h.kind === "checkin" || h.kind === "welcome" || h.kind === "invite") &&
          c > 0 &&
          !String(h.id || "").startsWith("REF_") &&
          !String(h.id || "").startsWith("ORD_")
        ) {
          gameEarned += c
        }
      }
    }

    const totalEarned = commTotal + giftTotal + rechTotal + gameEarned
    const availableBalance = Math.max(0, totalEarned - withdrawnTotal)

    totalWalletBalance += availableBalance

    userSummaryMap.set(uid, {
      userId: uid,
      availableBalance,
      totalEarned,
      commTotal,
      giftTotal,
      rechTotal,
      gameEarned,
      withdrawnTotal,
      pendingWithdrawn,
      approvedWithdrawn,
      rejectedWithdrawn,
      state,
    })
  }

  return {
    userSummaryMap,
    totalWalletBalance,
    totalPendingWithdrawals,
    totalApprovedWithdrawals,
  }
}
