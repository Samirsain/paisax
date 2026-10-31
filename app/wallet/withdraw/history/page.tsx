"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function WithdrawHistoryRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/wallet#history")
  }, [router])

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8 text-center text-xs text-slate-500 font-semibold">
      Redirecting to Wallet Transaction Records…
    </div>
  )
}
