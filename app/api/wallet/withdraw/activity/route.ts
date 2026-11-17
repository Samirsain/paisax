import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

function maskName(raw: string): string {
  const trimmed = (raw || "").trim()
  if (!trimmed) return "Investor"
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    if (trimmed.length <= 3) return trimmed + "***"
    return trimmed.slice(0, 3) + "***"
  }
  return `${parts[0]} ${parts[parts.length - 1].slice(0, 1)}.`
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
}

export async function GET(req: NextRequest) {
  try {
    // Fetch up to 500 actual withdrawal records from the database
    const rows = await db`
      SELECT 
        w.id,
        w.account_name,
        w.amount,
        w.net_amount,
        w.status,
        w.created_at,
        u.name as user_name
      FROM withdrawals w
      LEFT JOIN users u ON u.id = w.user_id
      WHERE w.status IN ('APPROVED', 'PAID', 'PENDING')
      ORDER BY w.created_at DESC
      LIMIT 500
    `.catch((err) => {
      console.warn("[Withdrawal Activity API] Query error:", err)
      return []
    })

    const realList = rows.map((r: any, idx: number) => {
      const createdAt = new Date(r.created_at)
      return {
        id: r.id || `W_${idx}`,
        name: maskName(r.user_name || r.account_name),
        amount: Number(r.net_amount) || Number(r.amount) || 0,
        status: r.status === "APPROVED" || r.status === "PAID" ? "Transferred" : "Processing",
        time: timeAgo(createdAt),
        method: "Bank IMPS",
        isDemo: false,
      }
    })

    // If real records are fewer than 10, provide sample records clearly marked with isDemo: true
    if (realList.length < 10) {
      const demoSeed = [
        { name: "Rajesh S.", amount: 18450, time: "2m ago", id: "W_DEMO_9101" },
        { name: "Priya P.", amount: 8900, time: "5m ago", id: "W_DEMO_9102" },
        { name: "Vikram C.", amount: 24600, time: "8m ago", id: "W_DEMO_9103" },
        { name: "Ananya I.", amount: 12000, time: "14m ago", id: "W_DEMO_9104" },
        { name: "Amit V.", amount: 36800, time: "19m ago", id: "W_DEMO_9105" },
        { name: "Deepak Y.", amount: 6500, time: "25m ago", id: "W_DEMO_9106" },
        { name: "Sunita D.", amount: 15200, time: "33m ago", id: "W_DEMO_9107" },
        { name: "Manoj T.", amount: 48000, time: "42m ago", id: "W_DEMO_9108" },
        { name: "Pooja C.", amount: 9800, time: "51m ago", id: "W_DEMO_9109" },
        { name: "Suresh R.", amount: 28500, time: "1h ago", id: "W_DEMO_9110" },
      ].map((d) => ({
        id: d.id,
        name: d.name,
        amount: d.amount,
        status: "Transferred",
        time: d.time,
        method: "Bank IMPS",
        isDemo: true,
      }))

      return NextResponse.json({
        success: true,
        count: realList.length + demoSeed.length,
        realCount: realList.length,
        items: [...realList, ...demoSeed],
      })
    }

    return NextResponse.json({
      success: true,
      count: realList.length,
      realCount: realList.length,
      items: realList,
    })
  } catch (err) {
    console.error("[Withdrawal Activity API Error]:", err)
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
  }
}
