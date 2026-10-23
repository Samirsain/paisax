import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { WITHDRAW_MIN, WITHDRAW_FEE_PCT, canWithdrawToday } from "@/lib/game"
import crypto from "crypto"

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

    // Check game state for balance and plan ownership
    const [gameStateRow] = await db`SELECT state FROM game_states WHERE user_id = ${uid} LIMIT 1`
    const state = gameStateRow?.state || {}
    const coins = Number(state.coins ?? 0)

    // Check if user has bought at least one paid plan
    const ownedPlans = Array.isArray(state.owned) ? state.owned : []
    const hasPaidPlanInState = ownedPlans.some((o: any) => o?.planId && o.planId !== "free")

    // Also check orders table for any confirmed paid order
    const paidOrders = await db`
      SELECT id FROM orders WHERE user_id = ${uid} AND status = 'SUCCESS' AND plan_id != 'free' LIMIT 1
    `.catch(() => [])

    const hasPaidPlan = hasPaidPlanInState || paidOrders.length > 0

    if (!hasPaidPlan) {
      return NextResponse.json(
        { error: "Withdrawal locked! Pehle koi paid solar plan active karein." },
        { status: 403 }
      )
    }

    if (coins < amount) {
      return NextResponse.json(
        { error: `Withdrawal amount exceeds your available balance (₹${coins})` },
        { status: 400 }
      )
    }

    const fee = Math.round((amount * WITHDRAW_FEE_PCT) / 100)
    const netAmount = Math.max(0, amount - fee)
    const withdrawId = `W_${Date.now()}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`

    // Deduct coins & update game state
    const nextCoins = coins - amount
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

    // Save to withdrawals table
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

    // Update game_states table
    await db`
      UPDATE game_states
      SET state = ${JSON.stringify(updatedState)}::jsonb,
          updated_at = now()
      WHERE user_id = ${uid}
    `

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawId,
        amount,
        fee,
        netAmount,
        status: "PENDING",
      },
      remainingBalance: nextCoins,
    })
  } catch (err) {
    console.error("[Withdrawal Error]:", err)
    const msg = err instanceof Error ? err.message : "Failed to process withdrawal"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
