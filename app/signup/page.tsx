"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CheckCircleIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import { Logo } from "@/components/marks"
import { useAuth } from "@/lib/auth"

const C = {
  bg:        "#FAF7F2",
  card:      "#FFFFFF",
  border:    "#E8DDD0",
  ink:       "#2C1A0E",
  inkMid:    "#6B4C36",
  inkSoft:   "#A08878",
  primary:   "#C9853A",
  primaryDk: "#9E6425",
  primaryLt: "#FFF3E0",
  emerald:   "#2A6B4C",
  emeraldLt: "#E8F5EE",
  shadow:    "rgba(44,26,14,0.08)",
  // Dark brand hero — the logo is gold/white and only reads on dark
  hero:      "radial-gradient(circle at 50% 30%, rgba(242,179,61,0.22), transparent 45%), radial-gradient(120% 90% at 50% 0%, #3A2610 0%, #120C06 65%)",
  gold:      "#F2B33D",
}

const PLANS = [
  { name: "Free", daily: "₹10" },
  { name: "Jio", daily: "₹39" },
  { name: "Airtel", daily: "₹66" },
  { name: "Tesla", daily: "₹133" },
]

const TESTIMONIALS = [
  { name: "Priya Sharma", city: "Mumbai", plan: "Airtel Plan", amount: "1,980", time: "2h ago", avatar: "/avatar/1.png" },
  { name: "Rahul Verma", city: "Delhi", plan: "Jio Plan", amount: "1,170", time: "5h ago", avatar: "/avatar/2.png" },
  { name: "Ananya Singh", city: "Bangalore", plan: "Tata Plan", amount: "2,970", time: "8h ago", avatar: "/avatar/3.png" },
  { name: "Arjun Patel", city: "Surat", plan: "Jio Plan", amount: "780", time: "12h ago", avatar: "/avatar/4.png" },
]

export default function SignupPage() {
  const { user, ready, signup } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [pass, setPass] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (ready && user) router.replace("/") }, [ready, user, router])

  const strength = pass.length === 0 ? 0 : pass.length < 6 ? 1 : pass.length < 10 ? 2 : pass.match(/[A-Z]/) && pass.match(/\d/) ? 4 : 3
  const strengthColor = ["", "#E53935", "#F59E0B", "#2A6B4C", "#2A6B4C"][strength]
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("")
    if (pass !== confirm) { setError("Passwords don't match"); return }
    setLoading(true)
    const err = await signup(name, phone, pass)
    if (err) { setError(err); setLoading(false) } else { router.replace("/") }
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: C.bg, fontFamily: "var(--font-dm), system-ui, sans-serif" }}>

      {/* Brand hero */}
      <header className="rounded-b-[32px] px-5 pt-5 pb-20" style={{ background: C.hero }}>
        <div className="max-w-sm mx-auto text-center">
          <div className="flex justify-end">
            <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
              Step 1 of 2
            </span>
          </div>
          <Logo className="mx-auto size-28" />
          <p className="mt-3 text-[11px] font-bold uppercase tracking-widest" style={{ color: C.gold }}>Instant Earnings Unlocked</p>
          <h2 className="mt-1 text-[24px] font-bold leading-tight" style={{ fontFamily: "var(--font-playfair)", color: "#fff" }}>
            Earn up to <span style={{ color: C.gold }}>₹133/day</span>
          </h2>
          <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Pick a plan after signup. Start earning immediately.</p>

          {/* Plan chips */}
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {PLANS.map(p => (
              <div key={p.name} className="flex flex-col items-center rounded-xl py-2 px-1"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>{p.name}</span>
                <span className="text-[10px] font-bold" style={{ color: C.gold }}>{p.daily}/d</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="relative -mt-12 flex flex-col px-5 pb-12 max-w-sm mx-auto w-full">

        {/* Form */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: `0 12px 32px ${C.shadow}` }}>
          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase" style={{ color: C.inkSoft }}>Create Account</span>
              <span className="text-[10px] font-bold uppercase" style={{ color: C.primary }}>→ Choose Plan</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
              <div className="h-full w-1/2 rounded-full" style={{ background: `linear-gradient(90deg, ${C.primaryDk}, ${C.primary})` }} />
            </div>
          </div>

          <h1 className="text-[17px] font-bold mb-4" style={{ fontFamily: "var(--font-playfair)", color: C.ink }}>Create Your Account</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.inkMid }}>Full Name</label>
              <input id="name" type="text" placeholder="Enter your full name" maxLength={24}
                value={name} onChange={(e) => { setName(e.target.value); setError("") }}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ background: C.bg, border: `1.5px solid ${C.border}`, color: C.ink }}
                onFocus={(e) => e.target.style.borderColor = C.primary}
                onBlur={(e) => e.target.style.borderColor = C.border}
                required />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.inkMid }}>Mobile Number</label>
              <div className="flex rounded-xl overflow-hidden" style={{ border: `1.5px solid ${C.border}`, background: C.bg }}>
                <span className="px-3 py-3 text-sm font-semibold shrink-0" style={{ color: C.inkSoft, borderRight: `1px solid ${C.border}` }}>+91</span>
                <input id="phone" type="tel" inputMode="numeric" placeholder="10-digit number" maxLength={10}
                  value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError("") }}
                  className="flex-1 px-3 py-3 bg-transparent text-sm outline-none"
                  style={{ color: C.ink }} required />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="pass" className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.inkMid }}>Password</label>
                {pass.length > 0 && <span className="text-[10px] font-bold" style={{ color: strengthColor }}>{strengthLabel}</span>}
              </div>
              <div className="flex rounded-xl overflow-hidden" style={{ border: `1.5px solid ${C.border}`, background: C.bg }}>
                <input id="pass" type={showPass ? "text" : "password"} placeholder="Min. 6 characters"
                  value={pass} onChange={(e) => { setPass(e.target.value); setError("") }}
                  className="flex-1 px-4 py-3 bg-transparent text-sm outline-none"
                  style={{ color: C.ink }} required />
                <button type="button" onClick={() => setShowPass(v => !v)} className="px-3" style={{ color: C.inkSoft }}>
                  {showPass ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
              {pass.length > 0 && (
                <div className="grid grid-cols-4 gap-1">
                  {[1,2,3,4].map(n => (
                    <div key={n} className="h-1 rounded-full transition-colors"
                      style={{ background: n <= strength ? strengthColor : C.border }} />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm" className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.inkMid }}>Re-enter Password</label>
              <div className="flex rounded-xl overflow-hidden transition-all"
                style={{ border: `1.5px solid ${confirm && confirm === pass ? C.emerald : C.border}`, background: C.bg }}>
                <input id="confirm" type={showPass ? "text" : "password"} placeholder="Repeat your password"
                  value={confirm} onChange={(e) => { setConfirm(e.target.value); setError("") }}
                  className="flex-1 px-4 py-3 bg-transparent text-sm outline-none"
                  style={{ color: C.ink }} required />
                {confirm && confirm === pass && <CheckCircleIcon className="size-4 mr-3 self-center shrink-0" style={{ color: C.emerald }} />}
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl px-4 py-2.5 text-sm" style={{ background: "#FFF0F0", color: "#C0392B", border: "1px solid #FECACA" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-60 mt-1"
              style={{ background: `linear-gradient(135deg, ${C.primaryDk}, ${C.primary})`, boxShadow: `0 4px 16px ${C.primary}40` }}>
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Creating…</span>
                : "Start Earning Today →"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm" style={{ color: C.inkSoft }}>
            Already have an account?{" "}
            <Link href="/login" className="font-bold hover:underline" style={{ color: C.primary }}>Log in →</Link>
          </p>
        </div>

        {/* Trust grid */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { e: "🔒", l: "SSL Secured", s: "256-bit" },
            { e: "⚡", l: "Daily Pay", s: "Claim coins" },
            { e: "✅", l: "Verified", s: "Real returns" },
          ].map(({ e, l, s }) => (
            <div key={l} className="flex flex-col items-center gap-1 rounded-xl p-2.5 text-center"
              style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <span className="text-base">{e}</span>
              <p className="text-[11px] font-bold" style={{ color: C.ink }}>{l}</p>
              <p className="text-[10px]" style={{ color: C.inkSoft }}>{s}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-center" style={{ color: C.inkSoft }}>
            Recent Withdrawals
          </p>
          <div className="flex flex-col gap-2">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl p-3.5"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <Image src={t.avatar} alt={t.name} width={44} height={44}
                  className="size-11 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold truncate" style={{ color: C.ink }}>{t.name}</p>
                    <span className="text-[10px] shrink-0" style={{ color: C.inkSoft }}>{t.time}</span>
                  </div>
                  <p className="text-xs truncate" style={{ color: C.inkSoft }}>{t.city} · {t.plan}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold" style={{ color: C.emerald }}>+₹{t.amount}</p>
                  <p className="text-[10px]" style={{ color: C.inkSoft }}>withdrawn</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-[10px]" style={{ color: C.inkSoft }}>
          © 2024 PaisaX · All rights reserved
        </p>
      </div>
    </div>
  )
}
