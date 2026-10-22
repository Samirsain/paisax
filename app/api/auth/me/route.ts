import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const uid = cookieStore.get("paisax_uid")?.value
  if (!uid) return NextResponse.json({ user: null })

  try {
    const [user] = await db`SELECT id, name, phone, invite_code FROM users WHERE id = ${uid} LIMIT 1`
    if (!user) return NextResponse.json({ user: null })
    return NextResponse.json({ user: { id: user.id, name: user.name, phone: user.phone, inviteCode: user.invite_code } })
  } catch {
    return NextResponse.json({ user: null })
  }
}
