"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { RegistrationView } from "@/components/registration-view"

function RegisterPageContent() {
  const searchParams = useSearchParams()
  const inviteParam = searchParams.get("invite") || searchParams.get("ref") || ""

  return (
    <div className="relative min-h-screen bg-[#0B0A08] flex flex-col items-center justify-start py-8 px-4 overflow-x-hidden selection:bg-[#D5A33D]/30">
      
      {/* Background radial gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(130%_90%_at_50%_0%,#1B130B_0%,#130D08_45%,#0B0A08_100%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(140deg,rgba(53,35,19,0.35)_0%,rgba(27,19,11,0.18)_40%,transparent_75%)] pointer-events-none" />

      {/* Top Header Logo */}
      <div className="relative z-10 mb-4 flex items-center justify-between w-full max-w-[420px]">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative size-10 rounded-full border-2 border-amber-400 overflow-hidden shadow-md">
            <Image
              src="/dairymilk/logo.png"
              alt="PaisaX"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <span className="text-base font-black text-white tracking-tight block">PaisaX Solar</span>
            <span className="text-[10px] font-bold text-amber-400 block -mt-0.5">Green Energy Rewards</span>
          </div>
        </Link>

        <Link
          href="/login"
          className="rounded-full bg-white/10 hover:bg-white/15 px-3.5 py-1.5 text-xs font-bold text-amber-200 border border-amber-500/30 transition-all"
        >
          Login
        </Link>
      </div>

      {/* Main Registration View */}
      <div className="relative z-10 w-full max-w-[420px]">
        <RegistrationView initialInviteCode={inviteParam} />
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0A08]" />}>
      <RegisterPageContent />
    </Suspense>
  )
}
