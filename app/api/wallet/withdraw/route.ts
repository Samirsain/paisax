import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { WITHDRAW_MIN, WITHDRAW_FEE_PCT, canWithdrawToday } from "@/lib/game"
import { parseGameState } from "@/lib/order-credit"
import crypto from "crypto"

/**
 * Calculates the user's authoritative withdrawable balance:
 * 1. Referral Commissions (from referral_commissions table)
 * 2. Gift Card Redemptions (from gift_card_redemptions table)
 * 3. Wallet Recharges (from orders table where plan_id = 'recharge' AND status = 'SUCCESS')
 * 4. Daily Claim & Check-in Rewards (from game_states history where kind IN ('claim', 'checkin', 'welcome'))
 * 5. Deducting all non-rejected withdrawals (status != 'REJECTED' in withdrawals table)
 */
export async function calculateAuthoritativeBalance(uid: string) {
  // 1. Referral commissions earned
  const [commRow] = await db`
    SELECT COALESCE(SUM(commission_amount), 0) as total
    FROM referral_commissions
    WHERE recipient_id = ${uid}
  `.catch(() => [{ total: 0 }])

  // 2. Gift card redemptions
  const [giftRow] = await db`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM gift_card_redemptions
    WHERE user_id = ${uid}
  `.catch(() => [{ total: 0 }])

  // 3. Wallet recharge deposits
  const [rechRow] = await db`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM orders
    WHERE user_id = ${uid} AND plan_id = 'recharge' AND status = 'SUCCESS'
  `.catch(() => [{ total: 0 }])

  // 4. Existing non-rejected withdrawals
  const [withRow] = await db`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM withdrawals
    WHERE user_id = ${uid} AND status != 'REJECTED'
  `.catch(() => [{ total: 0 }])

  // 5. Game state
  const [gsRow] = await db`
    SELECT state FROM game_states WHERE user_id = ${uid} LIMIT 1
  `.catch(() => [undefined])

  const state = parseGameState(gsRow?.state)

  let claimTotal = 0
  if (Array.isArray(state.history)) {
    for (const h of state.history) {
      if ((h.kind === "claim" || h.kind === "checkin" || h.kind === "welcome") && Number(h.coins) > 0) {
        claimTotal += Number(h.coins)
      }
    }
  }

  const commTotal = Number(commRow?.total) || 0
  const giftTotal = Number(giftRow?.total) || 0
  const rechTotal = Number(rechRow?.total) || 0
  const withTotal = Number(withRow?.total) || 0

  // Total earned from all eligible sources
  const totalEarned = commTotal + giftTotal + rechTotal + claimTotal
  const stateCoins = Number(state.coins) || 0

  // Effective balance is whichever is higher: computed ledger balance or current state coins
  const calculatedBalance = totalEarned - withTotal
  const availableBalance = Math.max(0, Math.max(calculatedBalance, stateCoins))

  return {
    availableBalance,
    state,
    commTotal,
    giftTotal,
    rechTotal,
    claimTotal,
    withTotal,
  }
}

// GET: Fetch user's saved bank account details and authoritative available balance
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const uid = cookieStore.get("paisax_uid")?.value

    if (!uid) {
      return NextResponse.json({ error: "Please login" }, { status: 401 })
    }

    // First check user's saved bank columns
    const [user] = await db`
      SELECT id, name, phone, bank_account_name, bank_account_number, bank_name, bank_ifsc, bank_updated_at
      FROM users
      WHERE id = ${uid}
      LIMIT 1
    `

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let accountName = user.bank_account_name || ""
    let accountNumber = user.bank_account_number || ""
    let bankName = user.bank_name || ""
    let ifsc = user.bank_ifsc || ""

    // Fallback: If not yet saved on users table, fetch from latest withdrawal
    if (!accountNumber) {
      const [lastWithdrawal] = await db`
        SELECT account_name, account_number, bank_name, ifsc_code
        FROM withdrawals
        WHERE user_id = ${uid}
        ORDER BY created_at DESC
        LIMIT 1
      `.catch(() => [])

      if (lastWithdrawal?.account_number) {
        accountName = lastWithdrawal.account_name || user.name || ""
        accountNumber = lastWithdrawal.account_number
        bankName = lastWithdrawal.bank_name || ""
        ifsc = lastWithdrawal.ifsc_code || ""

        // Sync to users table for future speed
        await db`
          UPDATE users
          SET bank_account_name = ${accountName},
              bank_account_number = ${accountNumber},
              bank_name = ${bankName || null},
              bank_ifsc = ${ifsc},
              bank_updated_at = now()
          WHERE id = ${uid}
        `.catch(() => {})
      }
    }

    const hasSavedBank = Boolean(accountNumber && accountNumber.trim().length >= 6)

    // Calculate authoritative available balance (including referral, rewards, gift cards)
    const { availableBalance, state } = await calculateAuthoritativeBalance(uid)

    // Synchronize game_states if different so entire app remains consistent
    if (Number(state.coins) !== availableBalance) {
      const updatedState = { ...state, coins: availableBalance }
      await db`
        INSERT INTO game_states (user_id, state, updated_at)
        VALUES (${uid}, ${JSON.stringify(updatedState)}::jsonb, now())
        ON CONFLICT (user_id) DO UPDATE
        SET state = ${JSON.stringify(updatedState)}::jsonb,
            updated_at = now()
      `.catch(() => {})
    }

    return NextResponse.json({
      success: true,
      hasSavedBank,
      availableBalance,
      coins: availableBalance,
      bankDetails: hasSavedBank
        ? {
            accountName: accountName || user.name || "",
            accountNumber,
            bankName,
            ifsc,
          }
        : null,
    })
  } catch (err) {
    console.error("[Get Saved Bank Details Error]:", err)
    return NextResponse.json({ error: "Failed to load bank details" }, { status: 500 })
  }
}

// PUT: Save or update bank details without requiring immediate withdrawal
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const uid = cookieStore.get("paisax_uid")?.value

    if (!uid) {
      return NextResponse.json({ error: "Please login" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { accountName, accountNumber, ifsc, bankName } = body

    if (!accountName?.trim()) {
      return NextResponse.json({ error: "Please enter Account Holder Name" }, { status: 400 })
    }
    if (!accountNumber?.trim() || accountNumber.trim().length < 6) {
      return NextResponse.json({ error: "Please enter a valid Bank Account Number" }, { status: 400 })
    }
    if (!ifsc?.trim() || ifsc.trim().length < 4) {
      return NextResponse.json({ error: "Please enter a valid Bank IFSC Code" }, { status: 400 })
    }

    await db`
      UPDATE users
      SET bank_account_name = ${accountName.trim()},
          bank_account_number = ${accountNumber.trim()},
          bank_name = ${bankName?.trim() || null},
          bank_ifsc = ${ifsc.trim().toUpperCase()},
          bank_updated_at = now()
      WHERE id = ${uid}
    `

    return NextResponse.json({
      success: true,
      message: "Bank details saved successfully",
      bankDetails: {
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        bankName: bankName?.trim() || "",
        ifsc: ifsc.trim().toUpperCase(),
      },
    })
  } catch (err) {
    console.error("[Update Bank Details Error]:", err)
    return NextResponse.json({ error: "Failed to update bank details" }, { status: 500 })
  }
}

// POST: Process withdrawal request & auto-save bank details
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const uid = cookieStore.get("paisax_uid")?.value

    if (!uid) {
      return NextResponse.json({ error: "Please login to withdraw" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { amount: rawAmount, accountName, accountNumber, ifsc, bankName } = body

    const amount = parseInt(rawAmount, 10)
    if (isNaN(amount) || amount < WITHDRAW_MIN) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is ₹${WITHDRAW_MIN}` },
        { status: 400 }
      )
    }

    if (!accountName?.trim()) {
      return NextResponse.json({ error: "Please enter Account Holder Name" }, { status: 400 })
    }

    if (!accountNumber?.trim() || accountNumber.trim().length < 6) {
      return NextResponse.json({ error: "Please enter a valid Bank Account Number" }, { status: 400 })
    }

    if (!ifsc?.trim() || ifsc.trim().length < 4) {
      return NextResponse.json({ error: "Please enter a valid Bank IFSC Code" }, { status: 400 })
    }

    // Weekend check
    if (!canWithdrawToday()) {
      return NextResponse.json(
        { error: "Withdrawals are closed on weekends. Banking channels operate Monday to Friday." },
        { status: 400 }
      )
    }

    // Load user
    const [user] = await db`SELECT id, name, phone FROM users WHERE id = ${uid} LIMIT 1`
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Calculate authoritative available balance (all referral earnings, rewards, gift cards are eligible)
    const { availableBalance, state } = await calculateAuthoritativeBalance(uid)

    if (amount > availableBalance) {
      return NextResponse.json(
        { error: `Withdrawal amount exceeds your available balance (₹${availableBalance})` },
        { status: 400 }
      )
    }

    const fee = Math.round((amount * WITHDRAW_FEE_PCT) / 100)
    const netAmount = Math.max(0, amount - fee)
    const withdrawId = `W_${Date.now()}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`

    // Deduct coins & update game state
    const nextCoins = Math.max(0, availableBalance - amount)
    const now = Date.now()
    const historyEntry = {
      id: withdrawId,
      at: now,
      coins: -amount,
      kind: "withdraw",
      amount,
      method: "bank",
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      ifsc: ifsc.trim().toUpperCase(),
      bankName: bankName?.trim() || "",
    }

    const nextHistory = [historyEntry, ...(Array.isArray(state.history) ? state.history : [])]
    const updatedState = {
      ...state,
      coins: nextCoins,
      history: nextHistory,
    }

    // 1. Save to withdrawals table
    await db`
      INSERT INTO withdrawals (
        id, user_id, account_name, account_number, bank_name, ifsc_code,
        amount, fee, net_amount, status, created_at, updated_at
      ) VALUES (
        ${withdrawId}, ${uid}, ${accountName.trim()}, ${accountNumber.trim()},
        ${bankName?.trim() || null}, ${ifsc.trim().toUpperCase()},
        ${amount}, ${fee}, ${netAmount}, 'PENDING', now(), now()
      )
    `

    // 2. Automatically save/update user's saved bank details for future withdrawals
    await db`
      UPDATE users
      SET bank_account_name = ${accountName.trim()},
          bank_account_number = ${accountNumber.trim()},
          bank_name = ${bankName?.trim() || null},
          bank_ifsc = ${ifsc.trim().toUpperCase()},
          bank_updated_at = now()
      WHERE id = ${uid}
    `

    // 3. Update game_states table
    await db`
      INSERT INTO game_states (user_id, state, updated_at)
      VALUES (${uid}, ${JSON.stringify(updatedState)}::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE
      SET state = ${JSON.stringify(updatedState)}::jsonb,
          updated_at = now()
    `

    console.log(`[Withdrawal] Success: user ${uid} requested ₹${amount} (Net: ₹${netAmount}), Remaining balance: ₹${nextCoins}`)

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawId,
        amount,
        fee,
        netAmount,
        status: "PENDING",
        accountNumber: accountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
      },
      savedBank: {
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        bankName: bankName?.trim() || "",
        ifsc: ifsc.trim().toUpperCase(),
      },
      remainingBalance: nextCoins,
    })
  } catch (err) {
    console.error("[Withdrawal Error]:", err)
    const msg = err instanceof Error ? err.message : "Failed to process withdrawal"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
