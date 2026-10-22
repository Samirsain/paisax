"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { CheckCircle2Icon, ClockIcon, Loader2Icon, XCircleIcon } from "lucide-react"

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get("orderId")
  const [status, setStatus] = useState<"polling" | "success" | "failed" | "timeout">("polling")
  const [pollCount, setPollCount] = useState(0)

  const MAX_POLLS = 15

  useEffect(() => {
    if (!orderId || status !== "polling") return

    const interval = setInterval(async () => {
      setPollCount((c) => {
        if (c >= MAX_POLLS) {
          setStatus("timeout")
          clearInterval(interval)
          return c
        }
        return c + 1
      })

      try {
        const res = await fetch(`/api/orders/status?orderId=${orderId}`)
        const data = await res.json()

        if (data.status === "SUCCESS" || data.credited) {
          setStatus("success")
          clearInterval(interval)
        } else if (data.status === "FAILED") {
          setStatus("failed")
          clearInterval(interval)
        }
      } catch {
        // Keep polling on network errors
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [orderId, status])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      {status === "polling" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex size-20 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg,#6063ee20,#8083ff20)" }}>
            <Loader2Icon className="size-10 animate-spin" style={{ color: "#8083ff" }} />
          </div>
          <h1 className="text-2xl font-bold text-white">Processing Payment…</h1>
          <p className="max-w-xs text-sm text-white/60">
            Waiting for payment confirmation. This usually takes a few seconds.
          </p>
          <div className="flex items-center gap-2 rounded-full px-4 py-2 text-xs" style={{ background: "#ffffff10" }}>
            <ClockIcon className="size-3.5 text-white/40" />
            <span className="text-white/50">Checking… ({pollCount}/{MAX_POLLS})</span>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-20 items-center justify-center rounded-full" style={{ background: "#4edea320" }}>
            <CheckCircle2Icon className="size-10" style={{ color: "#4edea3" }} />
          </div>
          <h1 className="text-2xl font-bold text-white">Payment Successful!</h1>
          <p className="max-w-xs text-sm text-white/60">
            Your plan has been activated. Start earning daily rewards now!
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-2 rounded-full px-8 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg,#006c49,#4edea3)", boxShadow: "0 6px 20px #4edea330" }}
          >
            Go to Home
          </button>
        </div>
      )}

      {status === "failed" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-20 items-center justify-center rounded-full" style={{ background: "#ff544920" }}>
            <XCircleIcon className="size-10" style={{ color: "#ff5449" }} />
          </div>
          <h1 className="text-2xl font-bold text-white">Payment Failed</h1>
          <p className="max-w-xs text-sm text-white/60">
            Your payment could not be processed. No amount has been deducted.
          </p>
          <button
            onClick={() => router.push("/plans")}
            className="mt-2 rounded-full px-8 py-3 text-sm font-bold text-white ring-1 ring-white/20 transition-all active:scale-95 hover:bg-white/10"
          >
            Try Again
          </button>
        </div>
      )}

      {status === "timeout" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-20 items-center justify-center rounded-full" style={{ background: "#ffb95f20" }}>
            <ClockIcon className="size-10" style={{ color: "#ffb95f" }} />
          </div>
          <h1 className="text-2xl font-bold text-white">Still Processing</h1>
          <p className="max-w-xs text-sm text-white/60">
            Your payment is taking longer than usual. It will be credited automatically once confirmed.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-2 rounded-full px-8 py-3 text-sm font-bold text-white ring-1 ring-white/20 transition-all active:scale-95 hover:bg-white/10"
          >
            Go to Home
          </button>
        </div>
      )}
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2Icon className="size-8 animate-spin text-white/40" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
