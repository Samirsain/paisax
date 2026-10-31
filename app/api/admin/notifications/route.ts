import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

const ONESIGNAL_APP_ID = "255a95b3-0f4f-44be-b713-ee57303374a1"

// GET: Fetch list of broadcasted notifications
export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get("paisax_admin_session")?.value

    if (adminSession !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const items = await db`
      SELECT id, title, message, url, target, sent_by, created_at
      FROM broadcast_notifications
      ORDER BY created_at DESC
      LIMIT 100
    `.catch((err) => {
      console.error("[Notifications Query Error]:", err)
      return []
    })

    return NextResponse.json({
      notifications: items.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        url: item.url || "",
        target: item.target,
        sentBy: item.sent_by,
        createdAt: item.created_at,
      })),
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to fetch notifications"
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

// POST: Create and broadcast notification
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get("paisax_admin_session")?.value

    if (adminSession !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, message, url, target = "ALL", oneSignalApiKey } = await req.json().catch(() => ({}))

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
    }

    const cleanTitle = title.trim()
    const cleanMessage = message.trim()
    const cleanUrl = url ? url.trim() : null

    // 1. Store in Database
    const inserted = await db`
      INSERT INTO broadcast_notifications (title, message, url, target, sent_by)
      VALUES (${cleanTitle}, ${cleanMessage}, ${cleanUrl}, ${target}, 'ADMIN')
      RETURNING id, title, message, url, target, created_at
    `
    const record = inserted[0]

    // 2. Dispatch via OneSignal REST API if API Key is available
    const apiKey = oneSignalApiKey?.trim() || process.env.ONESIGNAL_REST_API_KEY
    let oneSignalResult = null

    if (apiKey) {
      try {
        const payload: Record<string, unknown> = {
          app_id: ONESIGNAL_APP_ID,
          headings: { en: cleanTitle },
          contents: { en: cleanMessage },
        }

        if (cleanUrl) {
          payload.url = cleanUrl
        }

        if (target === "PAID") {
          // Target paid users via tags if set
          payload.filters = [{ field: "tag", key: "has_paid_plan", relation: "=", value: "true" }]
        } else {
          payload.included_segments = ["Subscribed Users"]
        }

        const osRes = await fetch("https://onesignal.com/api/v1/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${apiKey}`,
          },
          body: JSON.stringify(payload),
        })

        const osJson = await osRes.json()
        oneSignalResult = {
          success: osRes.ok,
          recipients: osJson.recipients || 0,
          id: osJson.id,
        }
      } catch (osErr) {
        console.warn("[OneSignal Broadcast Error]:", osErr)
        oneSignalResult = { success: false, error: "OneSignal API call failed" }
      }
    }

    return NextResponse.json({
      success: true,
      notification: {
        id: record.id,
        title: record.title,
        message: record.message,
        url: record.url,
        target: record.target,
        createdAt: record.created_at,
      },
      oneSignal: oneSignalResult,
      message: "Notification broadcasted successfully!",
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to broadcast notification"
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

// DELETE: Remove a broadcast notification
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get("paisax_admin_session")?.value

    if (adminSession !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await req.json().catch(() => ({}))

    if (!id) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    await db`
      DELETE FROM broadcast_notifications WHERE id = ${id}
    `

    return NextResponse.json({ success: true, message: "Notification deleted" })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to delete notification"
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
