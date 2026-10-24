"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import Image from "next/image"
import { ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, PhoneIcon, UserIcon, GiftIcon, SunMediumIcon } from "lucide-react"
import { useAuth } from "@/lib/auth"

// Very fine gold dust particles concentrated specifically along the lower energy trails
const TRAIL_GOLD_DUST = [
  // Clustered along primary energy ribbon (vertical 65% - 77%)
  { top: "66%", left: "18%", size: "2px", opacity: 0.65, delay: "0s", duration: "4.2s" },
  { top: "68%", left: "26%", size: "2.5px", opacity: 0.8, delay: "1.1s", duration: "5.5s" },
  { top: "71%", left: "35%", size: "1.5px", opacity: 0.6, delay: "2.3s", duration: "4.8s" },
  { top: "73%", left: "45%", size: "2px", opacity: 0.75, delay: "0.7s", duration: "5.2s" },
  { top: "72%", left: "54%", size: "2.5px", opacity: 0.85, delay: "1.8s", duration: "6s" },
  { top: "70%", left: "63%", size: "1.5px", opacity: 0.55, delay: "2.9s", duration: "4.5s" },
  { top: "73%", left: "73%", size: "2.5px", opacity: 0.7, delay: "0.4s", duration: "5.8s" },
  { top: "77%", left: "82%", size: "2px", opacity: 0.65, delay: "1.5s", duration: "4.9s" },
  { top: "80%", left: "89%", size: "1.5px", opacity: 0.5, delay: "3.2s", duration: "5.1s" },

  // Clustered along secondary harmonic ribbon (vertical 78% - 89%)
  { top: "79%", left: "15%", size: "1.5px", opacity: 0.5, delay: "0.9s", duration: "4.6s" },
  { top: "82%", left: "24%", size: "2.5px", opacity: 0.7, delay: "2.1s", duration: "5.4s" },
  { top: "80%", left: "37%", size: "2px", opacity: 0.6, delay: "1.4s", duration: "4.7s" },
  { top: "81%", left: "49%", size: "2.5px", opacity: 0.75, delay: "2.7s", duration: "5.9s" },
  { top: "84%", left: "66%", size: "2px", opacity: 0.65, delay: "0.6s", duration: "4.4s" },
  { top: "86%", left: "78%", size: "1.5px", opacity: 0.55, delay: "1.9s", duration: "5.3s" },
  { top: "89%", left: "86%", size: "2px", opacity: 0.6, delay: "3.1s", duration: "4.9s" },

  // Ambient specks near lower bronze illumination (vertical 89% - 94%)
  { top: "90%", left: "33%", size: "1.5px", opacity: 0.45, delay: "1.3s", duration: "5s" },
  { top: "92%", left: "57%", size: "2px", opacity: 0.5, delay: "2.5s", duration: "6.2s" },
]

function AuthForm() {

  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login"
  const inviteParam = searchParams.get("invite") || searchParams.get("ref") || ""

  const { user, ready, login, signup } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState<"login" | "register">(initialTab)
  const [phone, setPhone] = useState("")
  const [pass, setPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [name, setName] = useState("")
  const [inviteCode, setInviteCode] = useState(inviteParam)
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Remember referral code in session storage if user visits via invite link
  useEffect(() => {
    if (inviteParam) {
      setInviteCode(inviteParam)
      try {
        sessionStorage.setItem("paisax_invite_code", inviteParam)
      } catch {}
    } else {
      try {
        const stored = sessionStorage.getItem("paisax_invite_code")
        if (stored) setInviteCode(stored)
      } catch {}
    }
  }, [inviteParam])

  const isPreview = searchParams.get("preview") === "true"

  useEffect(() => {
    if (ready && user && !isPreview) router.replace("/")
  }, [ready, user, router, isPreview])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const cleanPhone = phone.replace(/\D/g, "")
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number")
      setLoading(false)
      return
    }

    const err = await login(cleanPhone, pass)
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      router.replace("/")
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const cleanPhone = phone.replace(/\D/g, "")
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number")
      setLoading(false)
      return
    }

    if (pass.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    if (confirmPass && pass !== confirmPass) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    const finalName = name.trim() || `Solar_${cleanPhone.slice(-4)}`
    const err = await signup(finalName, cleanPhone, pass, inviteCode.trim())
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      // Trigger Welcome Modal right after signup
      sessionStorage.setItem("solar_just_registered", "true")
      router.replace("/")
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0B0A08] flex flex-col items-center justify-start pb-14 overflow-x-hidden font-sans selection:bg-[#D5A33D]/30">
      
      {/* Layer 1: Base rich gradient transitioning between Obsidian black, deep espresso, and warm bronze */}
      <div className="fixed inset-0 bg-[radial-gradient(130%_90%_at_50%_0%,#1B130B_0%,#130D08_45%,#0B0A08_100%)] pointer-events-none" />

      {/* Layer 2: Directional warm espresso/bronze ambient wash for dimensional depth */}
      <div className="fixed inset-0 bg-[linear-gradient(140deg,rgba(53,35,19,0.35)_0%,rgba(27,19,11,0.18)_40%,transparent_75%)] pointer-events-none" />

      {/* Layer 3: Large, soft golden atmospheric glow behind the login card extending diagonally toward bottom-right */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: "14%",
          right: "-8%",
          width: "740px",
          maxWidth: "115vw",
          height: "820px",
          background: "radial-gradient(ellipse 65% 55% at 55% 45%, rgba(213,163,61,0.18) 0%, rgba(158,112,37,0.12) 32%, rgba(53,35,19,0.22) 60%, transparent 80%)",
          transform: "rotate(15deg)",
          filter: "blur(40px)",
        }}
      />

      {/* Layer 4: Secondary soft amber bloom centered beneath the login card */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: "24%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "480px",
          maxWidth: "92vw",
          height: "560px",
          background: "radial-gradient(circle at 50% 50%, rgba(255,181,46,0.08) 0%, rgba(213,163,61,0.06) 40%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      {/* Layer 5: Elegant flowing metallic-gold energy ribbons / abstract light trails in lower background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          className="w-full h-full opacity-90"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Metallic Gold Gradient (Primary Ribbon) */}
            <linearGradient id="goldRibbonPrimary" x1="0%" y1="20%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#1B130B" stopOpacity="0" />
              <stop offset="15%" stopColor="#352313" stopOpacity="0.3" />
              <stop offset="35%" stopColor="#9E7025" stopOpacity="0.75" />
              <stop offset="52%" stopColor="#FFB52E" stopOpacity="0.95" />
              <stop offset="68%" stopColor="#D5A33D" stopOpacity="0.85" />
              <stop offset="85%" stopColor="#9E7025" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0B0A08" stopOpacity="0" />
            </linearGradient>

            {/* Metallic Gold Gradient (Secondary Harmonic Ribbon) */}
            <linearGradient id="goldRibbonSecondary" x1="0%" y1="80%" x2="100%" y2="20%">
              <stop offset="0%" stopColor="#0B0A08" stopOpacity="0" />
              <stop offset="25%" stopColor="#9E7025" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#D5A33D" stopOpacity="0.75" />
              <stop offset="70%" stopColor="#FFB52E" stopOpacity="0.85" />
              <stop offset="88%" stopColor="#352313" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0B0A08" stopOpacity="0" />
            </linearGradient>

            {/* Volumetric Ribbon Glow Filter */}
            <filter id="ribbonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Deep Soft Aura Filter */}
            <filter id="softAura" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="22" />
            </filter>
          </defs>

          {/* Ribbon 1 - Deep Volumetric Glow Sheath */}
          <path
            d="M -50 690 C 220 630, 420 760, 620 720 C 800 680, 920 790, 1060 830"
            fill="none"
            stroke="url(#goldRibbonPrimary)"
            strokeWidth="38"
            strokeLinecap="round"
            filter="url(#softAura)"
            opacity="0.35"
          />

          {/* Ribbon 1 - Metallic Body */}
          <path
            d="M -50 690 C 220 630, 420 760, 620 720 C 800 680, 920 790, 1060 830"
            fill="none"
            stroke="url(#goldRibbonPrimary)"
            strokeWidth="10"
            strokeLinecap="round"
            filter="url(#ribbonGlow)"
            opacity="0.65"
          />

          {/* Ribbon 1 - Core Luminous Filament */}
          <path
            d="M -50 690 C 220 630, 420 760, 620 720 C 800 680, 920 790, 1060 830"
            fill="none"
            stroke="#FFB52E"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Ribbon 2 - Secondary Harmonic Trail Glow */}
          <path
            d="M -40 790 C 220 850, 460 780, 680 830 C 850 870, 940 940, 1050 960"
            fill="none"
            stroke="url(#goldRibbonSecondary)"
            strokeWidth="16"
            strokeLinecap="round"
            filter="url(#softAura)"
            opacity="0.3"
          />

          {/* Ribbon 2 - Luminous Thread */}
          <path
            d="M -40 790 C 220 850, 460 780, 680 830 C 850 870, 940 940, 1050 960"
            fill="none"
            stroke="url(#goldRibbonSecondary)"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#ribbonGlow)"
            opacity="0.85"
          />

          {/* Ribbon 3 - Upper Subtle Energy Whispers */}
          <path
            d="M 60 640 C 260 670, 440 620, 640 660 C 800 690, 900 740, 1020 760"
            fill="none"
            stroke="url(#goldRibbonPrimary)"
            strokeWidth="1.2"
            strokeDasharray="180 30 120 40"
            strokeLinecap="round"
            opacity="0.45"
          />

          {/* Ribbon 4 - Lower Subtle Grounding Arc */}
          <path
            d="M 40 920 C 320 880, 580 940, 760 910 C 900 890, 980 970, 1050 990"
            fill="none"
            stroke="url(#goldRibbonSecondary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* Layer 6: Very fine gold dust particles concentrated specifically around the light trails */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {TRAIL_GOLD_DUST.map((speck, idx) => (
          <span
            key={idx}
            className="absolute rounded-full bg-[#FFB52E] motion-safe:animate-pulse"
            style={{
              top: speck.top,
              left: speck.left,
              width: speck.size,
              height: speck.size,
              opacity: speck.opacity,
              animationDelay: speck.delay,
              animationDuration: speck.duration,
              boxShadow: "0 0 5px 1px rgba(255, 181, 46, 0.7)",
            }}
          />
        ))}
      </div>

      {/* Layer 7: Subtle bronze illumination near the bottom edge */}
      <div
        className="fixed bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 85% 100% at 50% 100%, rgba(53,35,19,0.75) 0%, rgba(158,112,37,0.18) 35%, rgba(27,19,11,0.3) 65%, transparent 100%)",
        }}
      />
      <div
        className="fixed bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 10%, rgba(213,163,61,0.3) 50%, transparent 90%)",
        }}
      />

      {/* Layer 8: Gentle dark vignette around viewport edges */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_48%,rgba(11,10,8,0.55)_75%,rgba(11,10,8,0.96)_100%)] pointer-events-none z-0" />

      {/* Top Banner illustration with bannerr.png (PaisaX Solar Banner) */}
      <div className="relative w-full max-w-md h-56 sm:h-64 overflow-hidden z-10">
        <Image
          src="/dairymilk/bannerr.png"
          alt="PaisaX Solar Banner"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0A08]/30 to-[#0B0A08]" />
      </div>

      {/* Main Form Container */}
      <div className="relative -mt-16 w-full max-w-[360px] px-4 z-10">
        
        {/* Floating circular Solar logo badge matching logo.png */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">
          <div className="relative size-24 rounded-full border-4 border-white bg-[#0f172a] shadow-[0_12px_30px_rgba(0,0,0,0.85),0_0_25px_rgba(213,163,61,0.3)] overflow-hidden ring-2 ring-[#D5A33D]/70">
            <Image
              src="/dairymilk/logo.png"
              alt="PaisaX Solar"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="relative rounded-[32px] bg-white px-6 pt-14 pb-7 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.92),0_0_40px_rgba(213,163,61,0.12)] border border-[#D5A33D]/20">
          
          {/* Tabs: Login / Register with golden underline indicator */}
          <div className="flex items-center justify-around border-b border-amber-100 pb-3 mb-6">
            <button
              type="button"
              onClick={() => { setTab("login"); setError("") }}
              className="relative px-4 pb-2 transition-colors cursor-pointer"
            >
              <span className={`text-lg font-extrabold ${tab === "login" ? "text-amber-800" : "text-slate-400"}`}>
                Login
              </span>
              {tab === "login" && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3.5px] w-16 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full">
                  <span className="absolute -right-1 -top-[2px] size-2 rounded-full bg-amber-600" />
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setTab("register"); setError("") }}
              className="relative px-4 pb-2 transition-colors cursor-pointer"
            >
              <span className={`text-lg font-extrabold ${tab === "register" ? "text-amber-800" : "text-slate-400"}`}>
                Register
              </span>
              {tab === "register" && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3.5px] w-16 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full">
                  <span className="absolute -right-1 -top-[2px] size-2 rounded-full bg-amber-600" />
                </div>
              )}
            </button>
          </div>

          {/* Error notice */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
              {error}
            </div>
          )}

          {tab === "login" ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              
              {/* Phone input */}
              <div className="flex items-center rounded-full border border-amber-200/80 px-3.5 py-1.5 bg-[#fffdfa] focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/10 transition-all">
                <span className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0">
                  <PhoneIcon className="size-4.5" />
                </span>
                <span className="px-2.5 text-sm font-bold text-slate-800 border-r border-amber-200">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Mobile number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 bg-transparent px-3 py-2 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Password input */}
              <div className="flex items-center rounded-full border border-amber-200/80 px-3.5 py-1.5 bg-[#fffdfa] focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/10 transition-all">
                <span className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0">
                  <LockIcon className="size-4.5" />
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="px-2 text-slate-400 hover:text-amber-600 transition-colors"
                >
                  {showPass ? <EyeOffIcon className="size-4.5" /> : <EyeIcon className="size-4.5" />}
                </button>
              </div>

              {/* Login Now CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-between rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 py-3 pl-6 pr-3 text-base font-extrabold text-white shadow-xl shadow-amber-500/30 transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
              >
                <span>{loading ? "Signing in…" : "Login Now"}</span>
                <span className="flex size-8.5 items-center justify-center rounded-full bg-white text-amber-700 shadow-sm">
                  <ArrowRightIcon className="size-4.5" strokeWidth={2.5} />
                </span>
              </button>

              {/* Don't have an account link */}
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-700">
                <span className="tracking-tighter">▪▪</span>
                <button
                  type="button"
                  onClick={() => { setTab("register"); setError("") }}
                  className="hover:underline cursor-pointer font-bold"
                >
                  Don't have an account? <span className="underline">Register</span>
                </button>
                <span className="tracking-tighter">▪▪</span>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
              
              {/* Name */}
              <div className="flex items-center rounded-full border border-amber-200/80 px-3.5 py-1.5 bg-[#fffdfa] focus-within:border-amber-500 transition-all">
                <span className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0">
                  <UserIcon className="size-4.5" />
                </span>
                <input
                  type="text"
                  placeholder="Your Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Phone */}
              <div className="flex items-center rounded-full border border-amber-200/80 px-3.5 py-1.5 bg-[#fffdfa] focus-within:border-amber-500 transition-all">
                <span className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0">
                  <PhoneIcon className="size-4.5" />
                </span>
                <span className="px-2.5 text-sm font-bold text-slate-800 border-r border-amber-200">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Mobile number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 bg-transparent px-3 py-2 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Password */}
              <div className="flex items-center rounded-full border border-amber-200/80 px-3.5 py-1.5 bg-[#fffdfa] focus-within:border-amber-500 transition-all">
                <span className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0">
                  <LockIcon className="size-4.5" />
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Set Password (min 6 chars)"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="px-2 text-slate-400 hover:text-amber-600"
                >
                  {showPass ? <EyeOffIcon className="size-4.5" /> : <EyeIcon className="size-4.5" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="flex items-center rounded-full border border-amber-200/80 px-3.5 py-1.5 bg-[#fffdfa] focus-within:border-amber-500 transition-all">
                <span className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0">
                  <LockIcon className="size-4.5" />
                </span>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Invite Code */}
              <div className="flex items-center rounded-full border border-amber-200/80 px-3.5 py-1.5 bg-[#fffdfa] focus-within:border-amber-500 transition-all">
                <span className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0">
                  <GiftIcon className="size-4.5" />
                </span>
                <input
                  type="text"
                  placeholder="Invite Code (optional)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-transparent px-3 py-2 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 uppercase"
                />
              </div>

              {/* Register Now CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-between rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 py-3 pl-6 pr-3 text-base font-extrabold text-white shadow-xl shadow-amber-500/30 transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
              >
                <span>{loading ? "Creating account…" : "Register Now"}</span>
                <span className="flex size-8.5 items-center justify-center rounded-full bg-white text-amber-700 shadow-sm">
                  <ArrowRightIcon className="size-4.5" strokeWidth={2.5} />
                </span>
              </button>

              {/* Already have an account link */}
              <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-700">
                <span className="tracking-tighter">▪▪</span>
                <button
                  type="button"
                  onClick={() => { setTab("login"); setError("") }}
                  className="hover:underline cursor-pointer font-bold"
                >
                  Already have an account? <span className="underline">Login</span>
                </button>
                <span className="tracking-tighter">▪▪</span>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0A08]" />}>
      <AuthForm />
    </Suspense>
  )
}
