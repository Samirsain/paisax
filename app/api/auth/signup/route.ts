import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { parseGameState } from "@/lib/order-credit"
import crypto from "crypto"

function hashPass(pass: string) {
  return crypto.createHash("sha256").update(pass + "paisax_salt").digest("hex")
}

function genInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST(req: NextRequest) {
  const { name, phone, password, inviteCode: rawInviteCode } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: "Enter your name" }, { status: 400 })
  if (!/^[6-9]\d{9}$/.test(phone)) return NextResponse.json({ error: "Enter a valid 10-digit mobile number" }, { status: 400 })
  if (!password || password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })

  try {
    const existing = await db`SELECT id FROM users WHERE phone = ${phone} LIMIT 1`
    if (existing.length > 0) return NextResponse.json({ error: "This number is already registered. Please log in." }, { status: 409 })

    // Find parent upline if referral code was provided
    let invitedBy: string | null = null
    if (rawInviteCode && typeof rawInviteCode === "string" && rawInviteCode.trim()) {
      const cleanInvite = rawInviteCode.trim().toUpperCase()
      const [inviter] = await db`
        SELECT id, name, invite_code FROM users
        WHERE UPPER(invite_code) = ${cleanInvite}
        LIMIT 1
      `
      if (inviter) {
        invitedBy = inviter.id
        console.log(`[Signup] User ${phone} registered under inviter ${inviter.name} (${inviter.id})`)
      }
    }

    let inviteCode = genInviteCode()
    // Ensure uniqueness
    while ((await db`SELECT id FROM users WHERE invite_code = ${inviteCode} LIMIT 1`).length > 0) {
      inviteCode = genInviteCode()
    }

    const [user] = await db`
      INSERT INTO users (name, phone, pass_hash, invite_code, invited_by)
      VALUES (${name.trim()}, ${phone}, ${hashPass(password)}, ${inviteCode}, ${invitedBy})
      RETURNING id, name, phone, invite_code, invited_by
    `

    // Seed empty game state
    await db`
      INSERT INTO game_states (user_id, state) VALUES (${user.id}, '{}'::jsonb)
      ON CONFLICT (user_id) DO NOTHING
    `

    // If invited by someone, increment their direct invite count
    if (invitedBy) {
      try {
        const [inviterGs] = await db`
          SELECT state FROM game_states WHERE user_id = ${invitedBy} LIMIT 1
        `
        const inviterState = parseGameState(inviterGs?.state)
        inviterState.invites = (Number(inviterState.invites) || 0) + 1

        await db`
          UPDATE game_states
          SET state = ${JSON.stringify(inviterState)}::jsonb,
              updated_at = now()
          WHERE user_id = ${invitedBy}
        `
      } catch (e) {
        console.error("Failed to update inviter invites count:", e)
      }
    }

    const cookieStore = await cookies()
    cookieStore.set("paisax_uid", user.id, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      inviteCode: user.invite_code,
      invitedBy: user.invited_by,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("signup error:", msg)
    return NextResponse.json({ error: "Server error", detail: msg }, { status: 500 })
  }
}
