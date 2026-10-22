"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/login?tab=register")
  }, [router])

  return (
    <div className="min-h-screen bg-[#320161] flex items-center justify-center">
      <div className="size-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  )
}
