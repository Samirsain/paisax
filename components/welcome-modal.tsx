"use client"

import { useState, useEffect } from "react"
import { XIcon } from "lucide-react"
import Image from "next/image"

interface WelcomeModalProps {
  forceOpen?: boolean
  onClose?: () => void
}

export function WelcomeModal({ forceOpen, onClose }: WelcomeModalProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (forceOpen !== undefined) {
      setOpen(forceOpen)
      return
    }

    // Auto-open if user just signed up or on first visit of session
    const justRegistered = sessionStorage.getItem("solar_just_registered")
    const shownThisSession = sessionStorage.getItem("solar_welcome_shown")

    if (justRegistered || !shownThisSession) {
      setOpen(true)
      sessionStorage.setItem("solar_welcome_shown", "true")
      if (justRegistered) {
        sessionStorage.removeItem("solar_just_registered")
      }
    }
  }, [forceOpen])

  function handleClose() {
    setOpen(false)
    onClose?.()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[340px] rounded-[32px] bg-white px-5 pt-13 pb-5 shadow-2xl border border-amber-200/50 animate-in zoom-in-95 duration-200">
        
        {/* Floating circular Solar logo badge matching user's logo.png */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="relative size-24 rounded-full border-4 border-white bg-[#0f172a] shadow-xl overflow-hidden ring-3 ring-amber-400/50">
            <Image
              src="/dairymilk/logo.png"
              alt="PaisaX Solar"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          aria-label="Close"
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors active:scale-95"
        >
          <XIcon className="size-4" strokeWidth={2.5} />
        </button>

        {/* Title */}
        <div className="text-center mt-1">
          <h2 className="text-[22px] font-black text-[#0f172a] tracking-tight flex items-center justify-center gap-1.5">
            <span>Welcome To PaisaX Solar</span>
          </h2>
          <div className="mx-auto mt-1.5 h-1 w-14 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 shadow-xs" />
        </div>

        {/* Signup Bonus, Min Deposit & Min Withdraw Row */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-amber-50 p-2.5 border border-amber-300 shadow-xs text-center">
            <p className="text-[11px] font-bold text-amber-900">Signup Bonus</p>
            <p className="mt-0.5 text-xl font-black text-[#b45309]">₹0</p>
          </div>
          <div className="rounded-2xl bg-[#fffbeb] p-2.5 border border-amber-200/60 shadow-xs text-center">
            <p className="text-[11px] font-semibold text-amber-900/80">Min deposit</p>
            <p className="mt-0.5 text-xl font-black text-[#b45309]">₹300</p>
          </div>
          <div className="rounded-2xl bg-[#fffbeb] p-2.5 border border-amber-200/60 shadow-xs text-center">
            <p className="text-[11px] font-semibold text-amber-900/80">Min withdraw</p>
            <p className="mt-0.5 text-xl font-black text-[#b45309]">₹180</p>
          </div>
        </div>

        {/* Invite Commission Box */}
        <div className="mt-3.5 rounded-2xl bg-[#fffbeb] p-3.5 border border-amber-200/60">
          <p className="text-center text-xs font-bold text-amber-950 mb-2.5">
            Invite commission
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white py-2 px-1 shadow-xs border border-amber-100">
              <p className="text-[10px] font-semibold text-slate-500">Level 1</p>
              <p className="text-lg font-black text-amber-600">10%</p>
            </div>
            <div className="rounded-xl bg-white py-2 px-1 shadow-xs border border-amber-100">
              <p className="text-[10px] font-semibold text-slate-500">Level 2</p>
              <p className="text-lg font-black text-amber-600">3%</p>
            </div>
            <div className="rounded-xl bg-white py-2 px-1 shadow-xs border border-amber-100">
              <p className="text-[10px] font-semibold text-slate-500">Level 3</p>
              <p className="text-lg font-black text-amber-600">1%</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleClose}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 py-3.5 text-base font-extrabold text-white shadow-lg shadow-amber-500/35 transition-all hover:opacity-95 active:scale-[0.98] cursor-pointer"
        >
          <span>Start Earning Now</span>
        </button>
      </div>
    </div>
  )
}
