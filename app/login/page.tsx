"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import Image from "next/image"
import { ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, PhoneIcon, UserIcon, GiftIcon, SunMediumIcon } from "lucide-react"
import { useAuth } from "@/lib/auth"

function AuthForm() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login"
  const inviteParam = searchParams.get("invite") || ""

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

  useEffect(() => {
    if (ready && user) router.replace("/")
  }, [ready, user, router])

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
    const err = await signup(finalName, cleanPhone, pass)
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
    <div className="relative min-h-screen bg-[#080d1a] flex flex-col items-center justify-start pb-10 overflow-x-hidden font-sans">
      
      {/* Top Banner illustration with bannerr.png (PaisaX Solar Banner) */}
      <div className="relative w-full max-w-md h-56 sm:h-64 overflow-hidden">
        <Image
          src="/dairymilk/bannerr.png"
          alt="PaisaX Solar Banner"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#080d1a]" />
      </div>

      {/* Main Form Container */}
      <div className="relative -mt-16 w-full max-w-[360px] px-4 z-10">
        
        {/* Floating circular Solar logo badge matching logo.png */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">
          <div className="relative size-24 rounded-full border-4 border-white bg-[#0f172a] shadow-2xl overflow-hidden ring-3 ring-amber-400/60">
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
        <div className="relative rounded-[32px] bg-white px-6 pt-14 pb-7 shadow-2xl border border-amber-100">
          
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
    <Suspense fallback={<div className="min-h-screen bg-[#080d1a]" />}>
      <AuthForm />
    </Suspense>
  )
}
