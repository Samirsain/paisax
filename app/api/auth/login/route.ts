import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import crypto from "crypto"

function hashPass(pass: string) {
  return crypto.createHash("sha256").update(pass + "paisax_salt").digest("hex")
}

export async function POST(req: NextRequest) {
  const { phone, password } = await req.json()

  try {
    const [user] = await db`SELECT id, name, phone, invite_code FROM users WHERE phone = ${phone} LIMIT 1`
    if (!user) return NextResponse.json({ error: "No account found with this number" }, { status: 401 })

    const [row] = await db`SELECT pass_hash FROM users WHERE id = ${user.id}`
    if (row.pass_hash !== hashPass(password)) return NextResponse.json({ error: "Incorrect password" }, { status: 401 })

    const cookieStore = await cookies()
    cookieStore.set("paisax_uid", user.id, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" })

    return NextResponse.json({ id: user.id, name: user.name, phone: user.phone, inviteCode: user.invite_code })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("login error:", msg)
    return NextResponse.json({ error: "Server error", detail: msg }, { status: 500 })
  }
}
