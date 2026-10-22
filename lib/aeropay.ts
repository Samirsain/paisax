/**
 * AeroPay payment gateway client.
 * Docs: https://api.aeropay11.live
 */

const BASE = process.env.AEROPAY_BASE_URL!
const API_KEY = process.env.AEROPAY_API_KEY!
const MERCHANT_ID = process.env.AEROPAY_MERCHANT_ID!

export interface CreateOrderParams {
  orderId: string
  amount: number          // in rupees (INR)
  customerName: string
  customerPhone: string
  customerEmail?: string
  returnUrl: string       // redirect after payment
  description?: string
}

export interface AeroPayOrder {
  paymentUrl: string
  transactionId: string
  orderId: string
}

export interface AeroPayStatus {
  orderId: string
  transactionId: string
  status: "SUCCESS" | "PENDING" | "FAILED"
  amount: number
}

/** Create a payment order and get the hosted payment page URL. */
export async function createOrder(params: CreateOrderParams): Promise<AeroPayOrder> {
  const body = {
    merchant_id: MERCHANT_ID,
    api_key: API_KEY,
    order_id: params.orderId,
    amount: params.amount,
    name: params.customerName,
    mobile: params.customerPhone,
    email: params.customerEmail ?? "",
    redirect_url: params.returnUrl,
    description: params.description ?? "PaisaX Plan",
  }

  const res = await fetch(`${BASE}/api/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok || data.code !== 200) {
    throw new Error(data.msg ?? `AeroPay error: ${res.status}`)
  }

  return {
    paymentUrl: data.data?.payment_url ?? data.data?.url ?? data.data?.redirect,
    transactionId: data.data?.txn_id ?? data.data?.transaction_id ?? params.orderId,
    orderId: params.orderId,
  }
}

/** Verify payment status by order ID. */
export async function verifyPayment(orderId: string): Promise<AeroPayStatus> {
  const res = await fetch(`${BASE}/api/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ merchant_id: MERCHANT_ID, api_key: API_KEY, order_id: orderId }),
  })

  const data = await res.json()

  return {
    orderId,
    transactionId: data.data?.txn_id ?? orderId,
    status: data.data?.status === "SUCCESS" ? "SUCCESS"
      : data.data?.status === "FAILED" ? "FAILED"
      : "PENDING",
    amount: data.data?.amount ?? 0,
  }
}
