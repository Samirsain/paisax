import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const uid = cookieStore.get("paisax_uid")?.value

    if (!uid) {
      return NextResponse.json({ error: "Please log in to view withdrawal history" }, { status: 401 })
    }

    const withdrawals = await db`
      SELECT 
        id,
        amount,
        fee,
        net_amount,
        status,
        utr,
        admin_note,
        bank_name,
        account_name,
        account_number,
        ifsc_code,
        created_at,
        updated_at
      FROM withdrawals
      WHERE user_id = ${uid}
      ORDER BY created_at DESC
    `.catch((err) => {
      console.error("[Withdrawal History Query Error]:", err)
      return []
    })

    const totalCount = withdrawals.length
    const totalAmount = withdrawals.reduce((sum: number, w: any) => sum + (Number(w.amount) || 0), 0)
    const totalReceived = withdrawals
      .filter((w: any) => w.status === "APPROVED" || w.status === "PAID" || w.status === "SUCCESS")
      .reduce((sum: number, w: any) => sum + (Number(w.net_amount) || 0), 0)

    const pendingCount = withdrawals.filter((w: any) => w.status === "PENDING").length
    const processingCount = withdrawals.filter((w: any) => w.status === "PROCESSING").length
    const successCount = withdrawals.filter((w: any) => w.status === "APPROVED" || w.status === "PAID" || w.status === "SUCCESS").length
    const rejectedCount = withdrawals.filter((w: any) => w.status === "REJECTED").length

    return NextResponse.json({
      success: true,
      summary: {
        totalCount,
        totalAmount,
        totalReceived,
        pendingCount,
        processingCount,
        successCount,
        rejectedCount,
      },
      withdrawals: withdrawals.map((w: any, idx: number) => {
        // Derive clean sequential ID like #310 or short alphanumeric
        const cleanNumber = w.id.replace(/^W_/, "").slice(-4) || String(totalCount - idx)
        const maskedAccount = w.account_number && w.account_number.length > 4
          ? `XXX${w.account_number.slice(-4)}`
          : (w.account_number || "Bank A/C")

        return {
          id: w.id,
          displayId: `#${cleanNumber}`,
          amount: Number(w.amount),
          fee: Number(w.fee),
          netAmount: Number(w.net_amount),
          status: w.status,
          utr: w.utr || null,
          adminNote: w.admin_note || null,
          bankName: w.bank_name || "Bank",
          accountName: w.account_name || "",
          accountNumber: w.account_number || "",
          maskedAccount,
          ifsc: w.ifsc_code || "",
          createdAt: w.created_at,
          updatedAt: w.updated_at,
        }
      }),
    })
  } catch (err) {
    console.error("[Get Withdrawal History Error]:", err)
    return NextResponse.json({ error: "Failed to load withdrawal history" }, { status: 500 })
  }
}
