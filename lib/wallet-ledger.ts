import { db } from "@/lib/db"
import { parseGameState } from "@/lib/order-credit"

export interface UserWalletSummary {
  userId: string
  // Main wallet
  mainAvailableBalance: number
  mainTotalEarned: number
  rechTotal: number
  giftTotal: number
  gameEarned: number
  walletPlanPurchasesTotal: number
  mainWithdrawnTotal: number
  mainPendingWithdrawn: number
  mainApprovedWithdrawn: number
  mainRejectedWithdrawn: number

  // Referral wallet
  referralAvailableBalance: number
  referralTotalEarned: number
  commTotal: number
  referralWithdrawnTotal: number
  referralPendingWithdrawn: number
  referralApprovedWithdrawn: number
  referralRejectedWithdrawn: number

  // Combined totals
  availableBalance: number
  totalEarned: number
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
 * - Main Wallet:
 *   Credits:
 *     1. Wallet recharge deposits (orders with plan_id = 'recharge' AND status = 'SUCCESS')
 *     2. Gift card redemptions
 *     3. Daily solar claims, check-ins, welcomes from game_states history
 *     4. Positive admin adjustments (balance_type = 'main')
 *   Debits:
 *     1. Non-rejected main withdrawals (balance_type = 'main' AND status != 'REJECTED')
 *     2. Plan purchases paid using wallet balance (orders with status = 'SUCCESS' AND txn_id = 'WALLET_BALANCE')
 *     3. Negative admin adjustments (balance_type = 'main')
 * 
 * - Referral Wallet:
 *   Credits:
 *     1. Referral commissions with status = 'PAID'
 *     2. Positive admin adjustments (balance_type = 'referral')
 *   Debits:
 *     1. Non-rejected referral withdrawals (balance_type = 'referral' AND status != 'REJECTED')
 *     2. Negative admin adjustments (balance_type = 'referral')
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

  // 4. Plan Purchases paid via Wallet Balance (Debits)
  const [walletBuysRow] = await db`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM orders
    WHERE user_id = ${userId} 
      AND plan_id != 'recharge' 
      AND status = 'SUCCESS' 
      AND txn_id = 'WALLET_BALANCE'
  `.catch(() => [{ total: 0 }])

  // 5. Withdrawals breakdown grouped by balance_type and status
  const withRows = await db`
    SELECT balance_type, status, COALESCE(SUM(amount), 0) as total
    FROM withdrawals
    WHERE user_id = ${userId}
    GROUP BY balance_type, status
  `.catch(() => [])

  let mainPendingWithdrawn = 0
  let mainApprovedWithdrawn = 0
  let mainRejectedWithdrawn = 0

  let refPendingWithdrawn = 0
  let refApprovedWithdrawn = 0
  let refRejectedWithdrawn = 0

  for (const w of withRows) {
    const amt = Number(w.total) || 0
    const bType = w.balance_type === "referral" ? "referral" : "main"
    if (bType === "referral") {
      if (w.status === "PENDING") refPendingWithdrawn += amt
      else if (w.status === "APPROVED" || w.status === "PAID") refApprovedWithdrawn += amt
      else if (w.status === "REJECTED") refRejectedWithdrawn += amt
    } else {
      if (w.status === "PENDING") mainPendingWithdrawn += amt
      else if (w.status === "APPROVED" || w.status === "PAID") mainApprovedWithdrawn += amt
      else if (w.status === "REJECTED") mainRejectedWithdrawn += amt
    }
  }

  const mainWithdrawnTotal = mainPendingWithdrawn + mainApprovedWithdrawn
  const refWithdrawnTotal = refPendingWithdrawn + refApprovedWithdrawn

  // 6. Admin Adjustments
  const adjRows = await db`
    SELECT balance_type, COALESCE(SUM(amount), 0) as total
    FROM wallet_adjustments
    WHERE user_id = ${userId}
    GROUP BY balance_type
  `.catch(() => [])

  let mainAdminAdj = 0
  let refAdminAdj = 0
  for (const a of adjRows) {
    const amt = Number(a.total) || 0
    if (a.balance_type === "referral") refAdminAdj += amt
    else mainAdminAdj += amt
  }

  // 7. Game state (daily claims, welcomes, check-ins)
  const [gsRow] = await db`
    SELECT state FROM game_states WHERE user_id = ${userId} LIMIT 1
  `.catch(() => [undefined])

  const state = parseGameState(gsRow?.state)

  let gameEarned = 0
  let historyWalletBuys = 0

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

      // If state history has wallet plan buys not captured in DB orders table
      if (h.kind === "buy" && c < 0 && !String(h.id || "").startsWith("ORD_")) {
        historyWalletBuys += Math.abs(c)
      }
    }
  }

  const commTotal = (Number(commRow?.total) || 0) + refAdminAdj
  const giftTotal = Number(giftRow?.total) || 0
  const rechTotal = Number(rechRow?.total) || 0
  const walletPlanPurchasesTotal = (Number(walletBuysRow?.total) || 0) + historyWalletBuys

  // Main Wallet balances
  const mainTotalEarned = rechTotal + giftTotal + gameEarned + mainAdminAdj
  const mainAvailableBalance = Math.max(0, mainTotalEarned - mainWithdrawnTotal - walletPlanPurchasesTotal)

  // Referral Wallet balances
  const referralTotalEarned = commTotal
  const referralAvailableBalance = Math.max(0, referralTotalEarned - refWithdrawnTotal)

  // Overall Combined balances
  const availableBalance = mainAvailableBalance + referralAvailableBalance
  const totalEarned = mainTotalEarned + referralTotalEarned
  const withdrawnTotal = mainWithdrawnTotal + refWithdrawnTotal
  const pendingWithdrawn = mainPendingWithdrawn + refPendingWithdrawn
  const approvedWithdrawn = mainApprovedWithdrawn + refApprovedWithdrawn
  const rejectedWithdrawn = mainRejectedWithdrawn + refRejectedWithdrawn

  return {
    userId,
    // Main wallet
    mainAvailableBalance,
    mainTotalEarned,
    rechTotal,
    giftTotal,
    gameEarned,
    walletPlanPurchasesTotal,
    mainWithdrawnTotal,
    mainPendingWithdrawn,
    mainApprovedWithdrawn,
    mainRejectedWithdrawn,

    // Referral wallet
    referralAvailableBalance,
    referralTotalEarned,
    commTotal,
    referralWithdrawnTotal: refWithdrawnTotal,
    referralPendingWithdrawn: refPendingWithdrawn,
    referralApprovedWithdrawn: refApprovedWithdrawn,
    referralRejectedWithdrawn: refRejectedWithdrawn,

    // Combined totals
    availableBalance,
    totalEarned,
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
  totalMainBalance: number
  totalReferralBalance: number
  totalPendingWithdrawals: number
  totalApprovedWithdrawals: number
}

/**
 * Bulk calculates authoritative wallet ledger balance for ALL users in high-performance aggregated queries.
 * Used by the Admin Panel to display accurate user balances and overall total system wallet balance.
 */
export async function getAllUsersWalletSummary(): Promise<AllUsersWalletSummary> {
  // Sequential queries to avoid connection pool exhaustion
  const users = await db`SELECT id FROM users`.catch(() => [])
  const gameStates = await db`SELECT user_id, state FROM game_states`.catch(() => [])
  const comms = await db`SELECT recipient_id, COALESCE(SUM(commission_amount), 0) as total FROM referral_commissions WHERE status = 'PAID' GROUP BY recipient_id`.catch(() => [])
  const gifts = await db`SELECT user_id, COALESCE(SUM(amount), 0) as total FROM gift_card_redemptions GROUP BY user_id`.catch(() => [])
  const rechs = await db`SELECT user_id, COALESCE(SUM(amount), 0) as total FROM orders WHERE plan_id = 'recharge' AND status = 'SUCCESS' GROUP BY user_id`.catch(() => [])
  const walletBuys = await db`SELECT user_id, COALESCE(SUM(amount), 0) as total FROM orders WHERE plan_id != 'recharge' AND status = 'SUCCESS' AND txn_id = 'WALLET_BALANCE' GROUP BY user_id`.catch(() => [])
  const withs = await db`SELECT user_id, balance_type, status, COALESCE(SUM(amount), 0) as total FROM withdrawals GROUP BY user_id, balance_type, status`.catch(() => [])
  const adjs = await db`SELECT user_id, balance_type, COALESCE(SUM(amount), 0) as total FROM wallet_adjustments GROUP BY user_id, balance_type`.catch(() => [])

  const gsMap = new Map<string, Record<string, any>>()
  for (const g of gameStates) gsMap.set(g.user_id, parseGameState(g.state))

  const commMap = new Map<string, number>()
  for (const c of comms) commMap.set(c.recipient_id, Number(c.total) || 0)

  const giftMap = new Map<string, number>()
  for (const g of gifts) giftMap.set(g.user_id, Number(g.total) || 0)

  const rechMap = new Map<string, number>()
  for (const r of rechs) rechMap.set(r.user_id, Number(r.total) || 0)

  const walletBuysMap = new Map<string, number>()
  for (const b of walletBuys) walletBuysMap.set(b.user_id, Number(b.total) || 0)

  const mainPendingMap = new Map<string, number>()
  const mainApprovedMap = new Map<string, number>()
  const mainRejectedMap = new Map<string, number>()

  const refPendingMap = new Map<string, number>()
  const refApprovedMap = new Map<string, number>()
  const refRejectedMap = new Map<string, number>()

  for (const w of withs) {
    const amt = Number(w.total) || 0
    const bType = w.balance_type === "referral" ? "referral" : "main"
    if (bType === "referral") {
      if (w.status === "PENDING") refPendingMap.set(w.user_id, (refPendingMap.get(w.user_id) || 0) + amt)
      else if (w.status === "APPROVED" || w.status === "PAID") refApprovedMap.set(w.user_id, (refApprovedMap.get(w.user_id) || 0) + amt)
      else if (w.status === "REJECTED") refRejectedMap.set(w.user_id, (refRejectedMap.get(w.user_id) || 0) + amt)
    } else {
      if (w.status === "PENDING") mainPendingMap.set(w.user_id, (mainPendingMap.get(w.user_id) || 0) + amt)
      else if (w.status === "APPROVED" || w.status === "PAID") mainApprovedMap.set(w.user_id, (mainApprovedMap.get(w.user_id) || 0) + amt)
      else if (w.status === "REJECTED") mainRejectedMap.set(w.user_id, (mainRejectedMap.get(w.user_id) || 0) + amt)
    }
  }

  const mainAdjMap = new Map<string, number>()
  const refAdjMap = new Map<string, number>()
  for (const a of adjs) {
    const amt = Number(a.total) || 0
    if (a.balance_type === "referral") refAdjMap.set(a.user_id, (refAdjMap.get(a.user_id) || 0) + amt)
    else mainAdjMap.set(a.user_id, (mainAdjMap.get(a.user_id) || 0) + amt)
  }

  const userSummaryMap = new Map<string, UserWalletSummary>()
  let totalWalletBalance = 0
  let totalMainBalance = 0
  let totalReferralBalance = 0
  let totalPendingWithdrawals = 0
  let totalApprovedWithdrawals = 0

  for (const u of users) {
    const uid = u.id
    const state = gsMap.get(uid) || {}
    const commTotal = (commMap.get(uid) || 0) + (refAdjMap.get(uid) || 0)
    const giftTotal = giftMap.get(uid) || 0
    const rechTotal = rechMap.get(uid) || 0
    const walletBuysTotal = walletBuysMap.get(uid) || 0
    const mainAdminAdj = mainAdjMap.get(uid) || 0

    const mainPendingWithdrawn = mainPendingMap.get(uid) || 0
    const mainApprovedWithdrawn = mainApprovedMap.get(uid) || 0
    const mainRejectedWithdrawn = mainRejectedMap.get(uid) || 0
    const mainWithdrawnTotal = mainPendingWithdrawn + mainApprovedWithdrawn

    const refPendingWithdrawn = refPendingMap.get(uid) || 0
    const refApprovedWithdrawn = refApprovedMap.get(uid) || 0
    const refRejectedWithdrawn = refRejectedMap.get(uid) || 0
    const refWithdrawnTotal = refPendingWithdrawn + refApprovedWithdrawn

    let gameEarned = 0
    let historyWalletBuys = 0

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

        if (h.kind === "buy" && c < 0 && !String(h.id || "").startsWith("ORD_")) {
          historyWalletBuys += Math.abs(c)
        }
      }
    }

    const totalPlanBuys = walletBuysTotal + historyWalletBuys
    const mainTotalEarned = rechTotal + giftTotal + gameEarned + mainAdminAdj
    const mainAvailableBalance = Math.max(0, mainTotalEarned - mainWithdrawnTotal - totalPlanBuys)

    const referralTotalEarned = commTotal
    const referralAvailableBalance = Math.max(0, referralTotalEarned - refWithdrawnTotal)

    const availableBalance = mainAvailableBalance + referralAvailableBalance
    const totalEarned = mainTotalEarned + referralTotalEarned
    const withdrawnTotal = mainWithdrawnTotal + refWithdrawnTotal
    const pendingWithdrawn = mainPendingWithdrawn + refPendingWithdrawn
    const approvedWithdrawn = mainApprovedWithdrawn + refApprovedWithdrawn
    const rejectedWithdrawn = mainRejectedWithdrawn + refRejectedWithdrawn

    totalWalletBalance += availableBalance
    totalMainBalance += mainAvailableBalance
    totalReferralBalance += referralAvailableBalance
    totalPendingWithdrawals += pendingWithdrawn
    totalApprovedWithdrawals += approvedWithdrawn

    userSummaryMap.set(uid, {
      userId: uid,
      mainAvailableBalance,
      mainTotalEarned,
      rechTotal,
      giftTotal,
      gameEarned,
      walletPlanPurchasesTotal: totalPlanBuys,
      mainWithdrawnTotal,
      mainPendingWithdrawn,
      mainApprovedWithdrawn,
      mainRejectedWithdrawn,

      referralAvailableBalance,
      referralTotalEarned,
      commTotal,
      referralWithdrawnTotal: refWithdrawnTotal,
      referralPendingWithdrawn: refPendingWithdrawn,
      referralApprovedWithdrawn: refApprovedWithdrawn,
      referralRejectedWithdrawn: refRejectedWithdrawn,

      availableBalance,
      totalEarned,
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
    totalMainBalance,
    totalReferralBalance,
    totalPendingWithdrawals,
    totalApprovedWithdrawals,
  }
}
