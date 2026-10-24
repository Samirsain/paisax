"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function SignupRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const invite = searchParams.get("invite") || searchParams.get("ref") || ""
    const query = invite ? `?tab=register&invite=${encodeURIComponent(invite)}` : "?tab=register"
    router.replace(`/login${query}`)
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-[#0B0A08] flex items-center justify-center">
      <div className="size-8 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupRedirect />
    </Suspense>
  )
}
