/**
 * Gateway configuration constants.
 * All limits, callback IPs, and URL helpers live here.
 */

// ── Deposit limits ──────────────────────────────────────────────────────────
export const DEPOSIT_MIN = 285    // ₹285 (Product A min)
export const DEPOSIT_MAX = 50_000 // ₹50,000

// ── Withdrawal limits ───────────────────────────────────────────────────────
export const PAYOUT_MIN = 180     // ₹180 (Min withdraw as per Dairy Milk rules)
export const PAYOUT_MAX = 50_000  // ₹50,000

// ── AeroPay callback IP (for webhook verification logging) ──────────────────
export const AEROPAY_CALLBACK_IP = "13.232.240.22"

// ── Settlement info ─────────────────────────────────────────────────────────
export const SETTLEMENT_CYCLE = "T+1"

// ── URL helpers ─────────────────────────────────────────────────────────────
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.paisax.in"

/** Webhook URL that AeroPay calls after deposit/payout completion. */
export function getCallbackUrl() {
  return `${APP_URL}/api/payment/webhook`
}

/** Return URL after user completes payment on AeroPay page. */
export function getReturnUrl(orderId: string) {
  return `${APP_URL}/payment/callback?order_id=${orderId}`
}

/** Get the app base URL. */
export function getAppUrl() {
  return APP_URL
}
