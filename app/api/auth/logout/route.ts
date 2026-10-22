import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete("paisax_uid")
  return NextResponse.json({ ok: true })
}
