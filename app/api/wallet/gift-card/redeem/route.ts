import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { parseGameState } from "@/lib/order-credit"

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const uid = cookieStore.get("paisax_uid")?.value

    if (!uid) {
      return NextResponse.json({ error: "Please log in to redeem gift cards" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const rawCode = body.code?.trim()

    if (!rawCode) {
      return NextResponse.json({ error: "Please enter a valid gift card code" }, { status: 400 })
    }

    const code = rawCode.toUpperCase()

    // 1. Fetch gift card
    const [card] = await db`
      SELECT id, code, amount, max_uses, used_count, is_active, expires_at
      FROM gift_cards
      WHERE UPPER(code) = ${code} AND is_active = true
      LIMIT 1
    `

    if (!card) {
      return NextResponse.json({ error: "Invalid or inactive gift card code" }, { status: 404 })
    }

    // Check expiry
    if (card.expires_at && new Date(card.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "This gift card code has expired" }, { status: 400 })
    }

    // Check usage limit
    if (card.used_count >= card.max_uses) {
      return NextResponse.json(
        { error: "This gift card has already reached its maximum redemption limit" },
        { status: 400 }
      )
    }

    // Check if current user already redeemed this card
    const [alreadyRedeemed] = await db`
      SELECT id FROM gift_card_redemptions
      WHERE card_id = ${card.id} AND user_id = ${uid}
      LIMIT 1
    `

    if (alreadyRedeemed) {
      return NextResponse.json(
        { error: "You have already claimed this gift card reward!" },
        { status: 400 }
      )
    }

    // 2. Atomically increment used count
    await db`
      UPDATE gift_cards
      SET used_count = used_count + 1
      WHERE id = ${card.id}
    `

    // 3. Insert redemption record
    const [redemption] = await db`
      INSERT INTO gift_card_redemptions (card_id, user_id, code, amount, redeemed_at)
      VALUES (${card.id}, ${uid}, ${card.code}, ${card.amount}, now())
      RETURNING id, redeemed_at
    `

    // 4. Credit money directly into user's wallet (game_states)
    const [gsRow] = await db`SELECT state FROM game_states WHERE user_id = ${uid} LIMIT 1`
    const state = parseGameState(gsRow?.state)

    const now = Date.now()
    const giftAmount = Number(card.amount) || 0
    const newCoins = (Number(state.coins) || 0) + giftAmount
    const newLifetime = (Number(state.lifetime) || 0) + giftAmount

    const historyEntry = {
      id: `GIFT_${redemption.id}`,
      at: now,
      coins: giftAmount,
      kind: "giftcard",
      code: card.code,
      amount: giftAmount,
    }

    const updatedHistory = [historyEntry, ...(Array.isArray(state.history) ? state.history : [])]

    const updatedState = {
      ...state,
      coins: newCoins,
      lifetime: newLifetime,
      history: updatedHistory,
    }

    await db`
      INSERT INTO game_states (user_id, state, updated_at)
      VALUES (${uid}, ${JSON.stringify(updatedState)}::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE
      SET state = ${JSON.stringify(updatedState)}::jsonb,
          updated_at = now()
    `

    console.log(`[GiftCard] Successfully redeemed code ${card.code} for ₹${giftAmount} to user ${uid}`)

    return NextResponse.json({
      success: true,
      message: `🎉 ₹${giftAmount} successfully added to your wallet!`,
      amount: giftAmount,
      code: card.code,
      newBalance: newCoins,
    })
  } catch (err: unknown) {
    console.error("[Gift Card Redeem Error]:", err)
    const msg = err instanceof Error ? err.message : "Failed to redeem gift card"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
