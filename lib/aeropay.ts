/**
 * AeroPay payment gateway client.
 * API base: https://api.aeropay11.live
 *
 * All requests are JSON POST with MD5 signature.
 * Response: { code: 0, msg: "success", data: { ... } }
 */

import crypto from "crypto"

// ── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.AEROPAY_BASE_URL ?? "https://api.aeropay11.live"
const MERCHANT_ID = process.env.AEROPAY_MERCHANT_ID ?? ""
const API_KEY = process.env.AEROPAY_API_KEY ?? ""
const TIMEOUT_MS = parseInt(process.env.AEROPAY_TIMEOUT_MS ?? "20000", 10)

if (!MERCHANT_ID) console.warn("[AeroPay] AEROPAY_MERCHANT_ID is not set — API calls will fail")
if (!API_KEY) console.warn("[AeroPay] AEROPAY_API_KEY is not set — API calls will fail")

// ── MD5 helper ──────────────────────────────────────────────────────────────

function md5(input: string): string {
  return crypto.createHash("md5").update(input, "utf8").digest("hex").toLowerCase()
}

// ── Signature ───────────────────────────────────────────────────────────────

/**
 * Build MD5 signature for outgoing requests and incoming webhooks.
 * 1. Take all params, remove `sign` and empty values.
 * 2. Sort keys alphabetically.
 * 3. Join as k1=v1&k2=v2&…
 * 4. Append API_KEY directly (no separator).
 * 5. MD5 hex lowercase.
 */
export function buildSignature(params: Record<string, string | number | undefined>): string {
  const filtered: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    if (k === "sign" || v === undefined || v === null || v === "") continue
    filtered[k] = String(v)
  }
  const sorted = Object.keys(filtered).sort()
  const source = sorted.map((k) => `${k}=${filtered[k]}`).join("&")
  return md5(source + API_KEY)
}

/**
 * Verify an incoming webhook signature.
 * Only the fields inside `data{}` are signed.
 */
export function verifySignature(data: Record<string, string | number | undefined>): boolean {
  const expected = buildSignature(data)
  return expected === String(data.sign ?? "").toLowerCase()
}

// ── HTTP helper ─────────────────────────────────────────────────────────────

async function post<T = Record<string, unknown>>(
  path: string,
  body: Record<string, string | number>
): Promise<{ code: number; msg: string; data: T }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    const json = await res.json()
    return json as { code: number; msg: string; data: T }
  } finally {
    clearTimeout(timer)
  }
}

// ── AeropayService ──────────────────────────────────────────────────────────

export const AeropayService = {
  /**
   * Create a deposit (pay-in) order.
   * POST /api/payIn
   *
   * @returns Payment URL on success, throws on error/timeout.
   */
  async createPaymentSession(params: {
    orderNo: string
    amount: string          // e.g. "500.00"
    notifyUrl?: string
    returnUrl?: string
  }): Promise<{ payUrl: string; tradeNo?: string }> {
    const body: Record<string, string | number> = {
      merchNo: MERCHANT_ID,
      orderNo: params.orderNo,
      amount: params.amount,
      currency: "INR",
    }
    if (params.notifyUrl) body.notifyUrl = params.notifyUrl
    if (params.returnUrl) body.returnUrl = params.returnUrl
    body.sign = buildSignature(body)

    console.log("[AeroPay] payIn request:", { orderNo: params.orderNo, amount: params.amount })

    const res = await post<Record<string, string>>(
      "/api/payIn",
      body
    )

    if (res.code !== 0) {
      throw new Error(`AeroPay payIn failed: ${res.msg ?? "unknown error"} (code ${res.code})`)
    }

    // Payment URL can be in various fields
    const payUrl =
      res.data?.code_url ??
      res.data?.codeUrl ??
      res.data?.pay_url ??
      res.data?.payUrl ??
      res.data?.url ??
      ""

    if (!payUrl) {
      throw new Error("AeroPay payIn: no payment URL in response")
    }

    return {
      payUrl,
      tradeNo: res.data?.tradeNo ?? res.data?.trade_no ?? undefined,
    }
  },

  /**
   * Create a payout order (user withdrawal or merchant withdraw).
   * POST /api/payOut
   */
  async createPayoutOrder(params: {
    orderNo: string
    amount: string          // e.g. "500.00"
    acctName: string        // holder name — English letters and spaces only
    acctNo: string          // bank account number or UPI ID
    acctCode?: string       // IFSC code (empty for UPI)
    mobile?: string
    notifyUrl: string
  }): Promise<{ tradeNo?: string }> {
    // Sanitise holder name: keep only English letters and spaces
    const cleanName = params.acctName.replace(/[^a-zA-Z ]/g, "").trim() || "Customer"

    const body: Record<string, string | number> = {
      merchNo: MERCHANT_ID,
      orderNo: params.orderNo,
      amount: params.amount,
      currency: "INR",
      acctName: cleanName,
      acctNo: params.acctNo,
      notifyUrl: params.notifyUrl,
    }
    if (params.acctCode) body.acctCode = params.acctCode
    if (params.mobile) body.mobile = params.mobile
    body.sign = buildSignature(body)

    console.log("[AeroPay] payOut request:", {
      orderNo: params.orderNo,
      amount: params.amount,
      acctNo: "***" + params.acctNo.slice(-4),
    })

    const res = await post<Record<string, string>>(
      "/api/payOut",
      body
    )

    if (res.code !== 0) {
      throw new Error(`AeroPay payOut failed: ${res.msg ?? "unknown error"} (code ${res.code})`)
    }

    return {
      tradeNo: res.data?.tradeNo ?? res.data?.trade_no ?? undefined,
    }
  },

  /**
   * Query merchant balance.
   * POST /api/balance
   */
  async getBalance(): Promise<{ balance: string; frozen?: string }> {
    const body: Record<string, string | number> = {
      merchNo: MERCHANT_ID,
    }
    body.sign = buildSignature(body)

    const res = await post<Record<string, string>>("/api/balance", body)
    if (res.code !== 0) {
      throw new Error(`AeroPay balance query failed: ${res.msg}`)
    }

    return {
      balance: res.data?.balance ?? "0",
      frozen: res.data?.frozen ?? "0",
    }
  },

  /**
   * Query deposit order status.
   * POST /api/payIn/query
   */
  async queryOrder(orderNo: string): Promise<{
    orderState: number
    amount: string
    tradeNo?: string
  }> {
    const body: Record<string, string | number> = {
      merchNo: MERCHANT_ID,
      orderNo,
    }
    body.sign = buildSignature(body)

    const res = await post<Record<string, string | number>>("/api/payIn/query", body)
    if (res.code !== 0) {
      throw new Error(`AeroPay query failed: ${res.msg}`)
    }

    return {
      orderState: Number(res.data?.orderState ?? 0),
      amount: String(res.data?.amount ?? "0"),
      tradeNo: String(res.data?.tradeNo ?? res.data?.trade_no ?? ""),
    }
  },

  /**
   * Query payout order status.
   * POST /api/payOut/query
   */
  async queryPayoutOrder(orderNo: string): Promise<{
    orderState: number
    amount: string
    tradeNo?: string
  }> {
    const body: Record<string, string | number> = {
      merchNo: MERCHANT_ID,
      orderNo,
    }
    body.sign = buildSignature(body)

    const res = await post<Record<string, string | number>>("/api/payOut/query", body)
    if (res.code !== 0) {
      throw new Error(`AeroPay payout query failed: ${res.msg}`)
    }

    return {
      orderState: Number(res.data?.orderState ?? 0),
      amount: String(res.data?.amount ?? "0"),
      tradeNo: String(res.data?.tradeNo ?? res.data?.trade_no ?? ""),
    }
  },

  /** Verify incoming webhook signature (convenience wrapper). */
  verifySignature,
}

export default AeropayService
