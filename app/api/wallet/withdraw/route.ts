import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { WITHDRAW_MIN, WITHDRAW_FEE_PCT, canWithdrawToday } from "@/lib/game"
import { getUserWalletSummary } from "@/lib/wallet-ledger"
import crypto from "crypto"

// GET: Fetch user's saved bank account details and authoritative balances
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

    // Authoritative ledger summary (separate Main Wallet vs Referral Earnings)
    const summary = await getUserWalletSummary(uid)

    // Synchronize game_states if different so entire app remains consistent
    if (Number(summary.state.coins) !== summary.availableBalance) {
      const updatedState = { ...summary.state, coins: summary.availableBalance }
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
      // Main wallet
      mainAvailableBalance: summary.mainAvailableBalance,
      mainTotalEarned: summary.mainTotalEarned,
      mainPendingWithdrawn: summary.mainPendingWithdrawn,
      mainApprovedWithdrawn: summary.mainApprovedWithdrawn,

      // Referral wallet
      referralAvailableBalance: summary.referralAvailableBalance,
      referralTotalEarned: summary.referralTotalEarned,
      referralPendingWithdrawn: summary.referralPendingWithdrawn,
      referralApprovedWithdrawn: summary.referralApprovedWithdrawn,

      // Combined
      availableBalance: summary.availableBalance,
      coins: summary.availableBalance,

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
    const {
      amount: rawAmount,
      accountName,
      accountNumber,
      ifsc,
      bankName,
      balanceType = "main", // "main" | "referral"
    } = body

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

    // Authoritative balance check based on chosen balanceType
    const summary = await getUserWalletSummary(uid)
    const availableForType =
      balanceType === "referral"
        ? summary.referralAvailableBalance
        : summary.mainAvailableBalance

    if (amount > availableForType) {
      const walletLabel = balanceType === "referral" ? "Referral Earnings" : "Main Wallet"
      return NextResponse.json(
        {
          error: `Withdrawal amount (₹${amount}) exceeds your available ${walletLabel} balance (₹${availableForType})`,
          availableBalance: availableForType,
          balanceType,
        },
        { status: 400 }
      )
    }

    const fee = Math.round((amount * WITHDRAW_FEE_PCT) / 100)
    const netAmount = Math.max(0, amount - fee)
    const withdrawId = `W_${Date.now()}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`

    // Deduct coins & update game state
    const nextTotalCoins = Math.max(0, summary.availableBalance - amount)
    const now = Date.now()
    const historyEntry = {
      id: withdrawId,
      at: now,
      coins: -amount,
      kind: "withdraw",
      amount,
      method: "bank",
      balanceType,
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      ifsc: ifsc.trim().toUpperCase(),
      bankName: bankName?.trim() || "",
    }

    const state = summary.state || {}
    const nextHistory = [historyEntry, ...(Array.isArray(state.history) ? state.history : [])]
    const updatedState = {
      ...state,
      coins: nextTotalCoins,
      history: nextHistory,
    }

    // 1. Save to withdrawals table with balance_type
    await db`
      INSERT INTO withdrawals (
        id, user_id, account_name, account_number, bank_name, ifsc_code,
        amount, fee, net_amount, status, balance_type, created_at, updated_at
      ) VALUES (
        ${withdrawId}, ${uid}, ${accountName.trim()}, ${accountNumber.trim()},
        ${bankName?.trim() || null}, ${ifsc.trim().toUpperCase()},
        ${amount}, ${fee}, ${netAmount}, 'PENDING', ${balanceType}, now(), now()
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

    console.log(
      `[Withdrawal] Success: user ${uid} requested ₹${amount} (${balanceType} balance). Remaining total balance: ₹${nextTotalCoins}`
    )

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawId,
        amount,
        fee,
        netAmount,
        status: "PENDING",
        balanceType,
        accountNumber: accountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
      },
      savedBank: {
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        bankName: bankName?.trim() || "",
        ifsc: ifsc.trim().toUpperCase(),
      },
      remainingBalance: nextTotalCoins,
      remainingTypeBalance: Math.max(0, availableForType - amount),
    })
  } catch (err) {
    console.error("[Withdrawal Error]:", err)
    const msg = err instanceof Error ? err.message : "Failed to process withdrawal"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
