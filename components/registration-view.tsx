"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  GiftIcon,
  LockIcon,
  PhoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
  ZapIcon,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

// Official PhonePe SVG Badge
export function PhonePeLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="160" height="48" rx="24" fill="#5F259F" />
      {/* Icon circle */}
      <circle cx="26" cy="24" r="15" fill="#FFFFFF" />
      <path
        d="M26 14C20.477 14 16 18.477 16 24C16 29.523 20.477 34 26 34C31.523 34 36 29.523 36 24C36 18.477 31.523 14 26 14Z"
        fill="#5F259F"
      />
      {/* Stylized Devanagari "पे" glyph */}
      <path
        d="M23 18H29C30.657 18 32 19.343 32 21C32 22.657 30.657 24 29 24H25.5V30H23V18ZM25.5 22H28.8C29.463 22 30 21.463 30 20.8C30 20.137 29.463 19.6 28.8 19.6H25.5V22Z"
        fill="#FFFFFF"
      />
      <text x="50" y="30" fill="#FFFFFF" fontSize="18" fontWeight="800" fontFamily="sans-serif" letterSpacing="-0.5">
        PhonePe
      </text>
    </svg>
  )
}

// Official Paytm SVG Badge
export function PaytmLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="140" height="48" rx="24" fill="#FFFFFF" stroke="#002970" strokeWidth="1.5" />
      {/* Paytm text styling */}
      <text x="18" y="32" fill="#002970" fontSize="22" fontWeight="900" fontFamily="sans-serif">
        pay
      </text>
      <text x="62" y="32" fill="#00B9F5" fontSize="22" fontWeight="900" fontFamily="sans-serif">
        tm
      </text>
    </svg>
  )
}

interface RegistrationViewProps {
  initialInviteCode?: string
  onSwitchToLogin?: () => void
  isInlineInLogin?: boolean
}

export function RegistrationView({
  initialInviteCode = "",
  onSwitchToLogin,
  isInlineInLogin = false,
}: RegistrationViewProps) {
  const router = useRouter()
  const { signup } = useAuth()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [pass, setPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [inviteCode, setInviteCode] = useState(initialInviteCode)
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialInviteCode) {
      setInviteCode(initialInviteCode)
    } else {
      try {
        const stored = sessionStorage.getItem("paisax_invite_code")
        if (stored) setInviteCode(stored)
      } catch {}
    }
  }, [initialInviteCode])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const cleanPhone = phone.replace(/\D/g, "")
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number")
      return
    }

    if (pass.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (pass !== confirmPass) {
      setError("Passwords do not match! Please check again.")
      return
    }

    setLoading(true)

    const finalName = name.trim() || `User_${cleanPhone.slice(-4)}`
    const err = await signup(finalName, cleanPhone, pass, inviteCode.trim())

    if (err) {
      setError(err)
      setLoading(false)
    } else {
      sessionStorage.setItem("solar_just_registered", "true")
      router.replace("/")
    }
  }

  return (
    <div className="w-full max-w-[420px] mx-auto text-slate-900 font-sans">
      
      {/* ── TOP HERO BANNER: ₹200 FREE WELCOME BONUS ────────────────── */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-[#1c1206] via-[#2d1c08] to-[#120a03] p-5 pt-6 text-white shadow-2xl border border-amber-500/40 text-center">
        
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-12 -left-12 size-44 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 size-48 rounded-full bg-yellow-400/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-56 rounded-full bg-amber-600/10 blur-2xl pointer-events-none" />

        {/* Floating Top Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-amber-500/30 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/50 shadow-inner">
          <SparklesIcon className="size-3.5 text-yellow-300 animate-pulse" />
          <span>Exclusive New User Gift</span>
        </div>

        {/* Big Highlighted ₹200 Header */}
        <div className="mt-3">
          <div className="inline-block relative">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 drop-shadow-[0_4px_16px_rgba(251,191,36,0.45)]">
              ₹200 FREE
            </h1>
            <span className="absolute -top-1 -right-7 rotate-12 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
              100%
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase drop-shadow-sm mt-0.5">
            WELCOME BONUS
          </p>
        </div>

        {/* Hindi Tagline */}
        <p className="mt-1.5 text-xs sm:text-sm font-bold text-amber-100/90 leading-snug">
          Register करें और पाएं <span className="text-yellow-300 font-black underline underline-offset-2">₹200 तक का Welcome Bonus</span>
        </p>

        {/* ── 4-DAY BONUS SCHEDULE BREAKDOWN ───────────────────────── */}
        <div className="mt-4 grid grid-cols-4 gap-1.5 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-amber-500/30 text-center">
          <div className="rounded-xl bg-amber-500/15 py-1.5 px-1 border border-amber-400/30">
            <span className="text-[10px] text-amber-200 font-semibold block">Day 1</span>
            <span className="text-xs font-black text-yellow-300">₹50</span>
          </div>
          <div className="rounded-xl bg-amber-500/15 py-1.5 px-1 border border-amber-400/30">
            <span className="text-[10px] text-amber-200 font-semibold block">Day 2</span>
            <span className="text-xs font-black text-yellow-300">₹50</span>
          </div>
          <div className="rounded-xl bg-amber-500/15 py-1.5 px-1 border border-amber-400/30">
            <span className="text-[10px] text-amber-200 font-semibold block">Day 3</span>
            <span className="text-xs font-black text-yellow-300">₹50</span>
          </div>
          <div className="rounded-xl bg-amber-500/15 py-1.5 px-1 border border-amber-400/30">
            <span className="text-[10px] text-amber-200 font-semibold block">Day 4</span>
            <span className="text-xs font-black text-yellow-300">₹50</span>
          </div>
        </div>

        {/* Total Bonus Result Banner */}
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-amber-200">
          <ZapIcon className="size-3.5 text-yellow-300" />
          <span>Total = ₹200 Direct Wallet Reward (Har Din ₹50)</span>
        </div>

        {/* ── PHONEPE & PAYTM BRAND BADGES (Verified Payout Partners) ── */}
        <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-col items-center justify-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <ShieldCheckIcon className="size-3 text-emerald-400" />
            <span>Supported Instant Payout Channels</span>
          </span>

          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <div className="shadow-sm hover:scale-105 transition-transform">
              <PhonePeLogo className="h-6 w-auto" />
            </div>
            <div className="shadow-sm hover:scale-105 transition-transform">
              <PaytmLogo className="h-6 w-auto" />
            </div>
            <div className="flex items-center gap-1 rounded-full bg-slate-900/90 border border-slate-700 px-2.5 py-1 text-[11px] font-black text-slate-200">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span>Bank IMPS</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── REGISTRATION FORM CARD ──────────────────────────────────── */}
      <div className="mt-4 rounded-[28px] bg-white p-5 sm:p-6 shadow-xl border border-amber-200/90">
        
        <div className="text-center mb-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Create Free Investor Account
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Takes only 30 seconds to start earning daily returns
          </p>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 p-3 text-xs text-red-600 font-bold border border-red-200 flex items-center gap-2">
            <span className="size-2 rounded-full bg-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-3">
          
          {/* Name Field (Optional) */}
          <div>
            <label className="text-[11px] font-black text-slate-700 block mb-1">
              Full Name <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="flex items-center rounded-2xl border border-slate-200 px-3.5 py-2.5 bg-slate-50/70 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/10 transition-all">
              <UserIcon className="size-4 text-amber-600 shrink-0 mr-2.5" />
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent text-xs font-bold text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Mobile Number (+91) */}
          <div>
            <label className="text-[11px] font-black text-slate-700 block mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center rounded-2xl border border-slate-200 px-3.5 py-2.5 bg-slate-50/70 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/10 transition-all">
              <PhoneIcon className="size-4 text-amber-600 shrink-0" />
              <span className="px-2 text-xs font-extrabold text-slate-900 border-r border-slate-300 ml-1.5 mr-2">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="flex-1 bg-transparent text-xs font-bold text-slate-900 outline-none placeholder:text-slate-400 font-mono"
                required
              />
            </div>
          </div>

          {/* Set Password */}
          <div>
            <label className="text-[11px] font-black text-slate-700 block mb-1">
              Login Password <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center rounded-2xl border border-slate-200 px-3.5 py-2.5 bg-slate-50/70 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/10 transition-all">
              <LockIcon className="size-4 text-amber-600 shrink-0 mr-2.5" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Set password (min. 6 characters)"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="flex-1 bg-transparent text-xs font-bold text-slate-900 outline-none placeholder:text-slate-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="p-1 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
              >
                {showPass ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-[11px] font-black text-slate-700 block mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center rounded-2xl border border-slate-200 px-3.5 py-2.5 bg-slate-50/70 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/10 transition-all">
              <LockIcon className="size-4 text-amber-600 shrink-0 mr-2.5" />
              <input
                type={showConfirmPass ? "text" : "password"}
                placeholder="Re-enter password to confirm"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="flex-1 bg-transparent text-xs font-bold text-slate-900 outline-none placeholder:text-slate-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="p-1 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
              >
                {showConfirmPass ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </div>

          {/* Invite Code (Optional) */}
          <div>
            <label className="text-[11px] font-black text-slate-700 block mb-1">
              Referral / Invite Code <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="flex items-center rounded-2xl border border-slate-200 px-3.5 py-2.5 bg-slate-50/70 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/10 transition-all">
              <GiftIcon className="size-4 text-amber-600 shrink-0 mr-2.5" />
              <input
                type="text"
                placeholder="Invite code (if any)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="flex-1 bg-transparent text-xs font-mono font-bold text-slate-900 outline-none placeholder:text-slate-400 uppercase"
              />
            </div>
          </div>

          {/* ── CLEAR BONUS & WITHDRAWAL NOTICE (Mandatory Disclosure) ── */}
          <div className="mt-1 rounded-2xl bg-amber-50/80 p-3 border border-amber-300/80 text-[11px] text-amber-950 flex items-start gap-2">
            <span className="text-base leading-none mt-0.5">🎁</span>
            <div className="leading-relaxed">
              <strong className="font-black text-amber-950">Welcome Bonus Rule:</strong> ₹200 Welcome Bonus har din ₹50 karke 4 din me collect hoga. Withdrawal ki suvidha prapt karne ke liye pehle koi bhi uplabdh plan active karein.
            </div>
          </div>

          {/* Primary Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-gradient-to-r from-[#eab308] via-[#f59e0b] to-[#d97706] py-3.5 px-6 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 active:scale-98 transition-all hover:opacity-95 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{loading ? "Creating Account…" : "Register & Claim ₹200 Bonus"}</span>
            <ArrowRightIcon className="size-4" strokeWidth={3} />
          </button>

          {/* Switch to Login Link */}
          <div className="mt-2 text-center text-xs font-bold text-slate-600">
            Already have an account?{" "}
            {onSwitchToLogin ? (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-amber-700 hover:text-amber-800 underline underline-offset-2 cursor-pointer font-black"
              >
                Login here
              </button>
            ) : (
              <Link
                href="/login"
                className="text-amber-700 hover:text-amber-800 underline underline-offset-2 cursor-pointer font-black"
              >
                Login here
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Trust Badges Footer */}
      <div className="mt-4 flex items-center justify-center gap-4 text-[11px] font-bold text-amber-200/80 text-center">
        <span className="flex items-center gap-1">
          <ShieldCheckIcon className="size-3.5 text-emerald-400" />
          <span>256-Bit SSL Protection</span>
        </span>
        <span>•</span>
        <span>Verified Solar Platform</span>
      </div>
    </div>
  )
}
