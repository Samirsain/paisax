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
import {
  PhonePeLogo,
  PaytmLogo,
  GooglePayLogo,
  VisaLogo,
  SupportedPaymentBadges,
  WelcomeBonusBanner,
} from "@/components/welcome-bonus-banner"

// Re-export logos and badges for easy backwards-compatibility
export { PhonePeLogo, PaytmLogo, GooglePayLogo, VisaLogo, SupportedPaymentBadges, WelcomeBonusBanner }

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
      <WelcomeBonusBanner variant="hero" />

      {/* ── REGISTRATION FORM CARD ──────────────────────────────────── */}
      <div className="mt-3 rounded-[24px] bg-white p-4 sm:p-5 shadow-xl border border-amber-200/90">
        
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

