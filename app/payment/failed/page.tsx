"use client"

import { useRouter } from "next/navigation"
import { XCircleIcon } from "lucide-react"

export default function PaymentFailedPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="flex size-20 items-center justify-center rounded-full" style={{ background: "#ff544920" }}>
        <XCircleIcon className="size-10" style={{ color: "#ff5449" }} />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Payment Failed</h1>
        <p className="mt-2 max-w-xs text-sm text-white/60">
          Your payment could not be processed. No amount has been deducted from your account.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => router.push("/plans")}
          className="rounded-full px-8 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg,#6063ee,#8083ff)", boxShadow: "0 6px 20px #6063ee30" }}
        >
          Try Again
        </button>
        <button
          onClick={() => router.push("/")}
          className="rounded-full px-8 py-3 text-sm font-bold text-white/70 ring-1 ring-white/20 transition-all active:scale-95 hover:bg-white/10"
        >
          Go to Home
        </button>
      </div>
    </div>
  )
}
