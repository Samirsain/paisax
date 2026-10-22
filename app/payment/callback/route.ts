import { type NextRequest, NextResponse } from "next/server"

/**
 * GET /payment/callback
 *
 * This is the return URL where AeroPay redirects the user after payment.
 * It does NOT credit the wallet — that only happens via the server-to-server webhook.
 *
 * This page simply redirects to the payment status page which polls for completion.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get("order_id")
  const status = searchParams.get("status")

  const base = process.env.NEXT_PUBLIC_APP_URL ?? req.headers.get("origin") ?? "http://localhost:3000"

  if (!orderId) {
    return NextResponse.redirect(new URL("/?payment=failed", base))
  }

  // If test mode passed SUCCESS, redirect to success
  if (status === "SUCCESS") {
    return NextResponse.redirect(
      new URL(`/payment/success?orderId=${orderId}`, base)
    )
  }

  // For real payments, redirect to the status polling page
  // The success page will poll /api/orders/status until webhook confirms
  return NextResponse.redirect(
    new URL(`/payment/success?orderId=${orderId}`, base)
  )
}
