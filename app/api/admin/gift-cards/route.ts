import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import crypto from "crypto"

function generateUniqueCode(prefix = "SOLAR"): string {
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase()
  const rand2 = crypto.randomBytes(2).toString("hex").toUpperCase()
  return `${prefix}-${rand}-${rand2}`
}

async function isAdminAuthenticated(req: NextRequest): Promise<boolean> {
  const reqCookie = req.cookies.get("paisax_admin_session")?.value
  if (reqCookie === "authenticated") return true
  try {
    const cookieStore = await cookies()
    const storeCookie = cookieStore.get("paisax_admin_session")?.value
    return storeCookie === "authenticated"
  } catch {
    return false
  }
}

// GET: List all gift cards and recent redemptions
export async function GET(req: NextRequest) {
  try {
    const auth = await isAdminAuthenticated(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cards = await db`
      SELECT 
        id, code, amount, max_uses, used_count, is_active, created_by, note, created_at, expires_at
      FROM gift_cards
      ORDER BY created_at DESC
    `.catch((err) => {
      console.error("[Admin GiftCards Query Error]:", err)
      return []
    })

    const redemptions = await db`
      SELECT 
        r.id, r.card_id, r.code, r.amount, r.redeemed_at,
        u.name as user_name, u.phone as user_phone
      FROM gift_card_redemptions r
      JOIN users u ON u.id = r.user_id
      ORDER BY r.redeemed_at DESC
      LIMIT 100
    `.catch(() => [])

    const totalIssued = cards.reduce((sum: number, c: any) => sum + (Number(c.amount) * Number(c.used_count || 1)), 0)
    const totalRedeemed = redemptions.reduce((sum: number, r: any) => sum + Number(r.amount), 0)

    const mappedCards = cards.map((c: any) => ({
      id: c.id,
      code: c.code,
      amount: Number(c.amount),
      maxUses: Number(c.max_uses),
      usedCount: Number(c.used_count || 0),
      isActive: Boolean(c.is_active),
      note: c.note || "",
      createdAt: c.created_at,
      expiresAt: c.expires_at,
      isFullyRedeemed: Number(c.used_count || 0) >= Number(c.max_uses || 1),
    }))

    const mappedRedemptions = redemptions.map((r: any) => ({
      id: r.id,
      cardId: r.card_id,
      code: r.code,
      amount: Number(r.amount),
      userName: r.user_name || "User",
      userPhone: r.user_phone ? `${r.user_phone.slice(0, 3)}****${r.user_phone.slice(-3)}` : "",
      redeemedAt: r.redeemed_at,
    }))

    return NextResponse.json({
      success: true,
      stats: {
        totalCards: cards.length,
        totalRedemptions: redemptions.length,
        totalIssued,
        totalRedeemed,
      },
      cards: mappedCards,
      giftCards: mappedCards,
      recentRedemptions: mappedRedemptions,
      redemptions: mappedRedemptions,
    })
  } catch (err: unknown) {
    console.error("[Admin GiftCards GET Error]:", err)
    return NextResponse.json({ error: "Failed to load gift cards" }, { status: 500 })
  }
}

// POST: Create a new gift card with money and unique code
export async function POST(req: NextRequest) {
  try {
    const auth = await isAdminAuthenticated(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const rawAmount = body.amount
    const rawCode = typeof body.code === "string" ? body.code.trim() : ""
    const maxUses = Math.max(1, parseInt(body.maxUses, 10) || 1)
    const expiresInDays = Math.max(1, parseInt(body.expiresInDays, 10) || 30)
    const note = body.note?.trim() || null

    const amount = parseInt(rawAmount, 10)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Please enter a valid gift card amount (₹)" }, { status: 400 })
    }

    // Clean and validate code
    const code = rawCode
      ? rawCode.toUpperCase().replace(/[^A-Z0-9_-]/g, "")
      : generateUniqueCode()

    if (!code || code.length < 3) {
      return NextResponse.json({ error: "Gift card code must be at least 3 characters long" }, { status: 400 })
    }

    // Check if code already exists
    const [existing] = await db`SELECT id FROM gift_cards WHERE UPPER(code) = ${code} LIMIT 1`
    if (existing) {
      return NextResponse.json({
        error: `Gift card code '${code}' already exists. Please choose a different code or leave empty for auto-generation.`
      }, { status: 400 })
    }

    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

    const [newCard] = await db`
      INSERT INTO gift_cards (
        code, amount, max_uses, used_count, is_active, created_by, note, created_at, expires_at
      ) VALUES (
        ${code}, ${amount}, ${maxUses}, 0, true, 'admin', ${note}, now(), ${expiresAt}
      )
      RETURNING id, code, amount, max_uses, used_count, is_active, note, created_at, expires_at
    `

    console.log(`[Admin] Generated new Gift Card: ${code} for ₹${amount} (Max uses: ${maxUses}, Expires in: ${expiresInDays} days)`)

    const cardData = {
      id: newCard.id,
      code: newCard.code,
      amount: Number(newCard.amount),
      maxUses: Number(newCard.max_uses),
      usedCount: 0,
      isActive: true,
      note: newCard.note,
      createdAt: newCard.created_at,
      expiresAt: newCard.expires_at,
      isFullyRedeemed: false,
    }

    return NextResponse.json({
      success: true,
      card: cardData,
      giftCard: cardData,
    })
  } catch (err: unknown) {
    console.error("[Admin GiftCards POST Error]:", err)
    const msg = err instanceof Error ? err.message : "Failed to create gift card"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE: Deactivate or remove a gift card
export async function DELETE(req: NextRequest) {
  try {
    const auth = await isAdminAuthenticated(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await req.json().catch(() => ({}))
    if (!id) {
      return NextResponse.json({ error: "Missing gift card ID" }, { status: 400 })
    }

    await db`DELETE FROM gift_cards WHERE id = ${id}`

    return NextResponse.json({ success: true, message: "Gift card deleted successfully" })
  } catch (err: unknown) {
    console.error("[Admin GiftCards DELETE Error]:", err)
    return NextResponse.json({ error: "Failed to delete gift card" }, { status: 500 })
  }
}
