import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Public client endpoint: Get latest notifications for real-time delivery
export async function GET() {
  try {
    const items = await db`
      SELECT id, title, message, url, target, created_at
      FROM broadcast_notifications
      WHERE created_at > (now() - interval '2 hours')
      ORDER BY created_at DESC
      LIMIT 10
    `.catch(() => [])

    return NextResponse.json({
      notifications: items.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        url: item.url || "",
        target: item.target,
        createdAt: item.created_at,
      })),
    })
  } catch {
    return NextResponse.json({ notifications: [] })
  }
}
