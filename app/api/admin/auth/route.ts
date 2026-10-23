import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin786"

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json().catch(() => ({}))

    if (!password || password !== ADMIN_PASS) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set("paisax_admin_session", "authenticated", {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("paisax_admin_session")?.value
  const authenticated = token === "authenticated"
  return NextResponse.json({ authenticated })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("paisax_admin_session")
  return NextResponse.json({ success: true })
}
