"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { Logo } from "@/components/marks"
import { useAuth } from "@/lib/auth"

// Colour tokens — warm beige luxury palette
const C = {
  bg:        "#FAF7F2",   // warm cream
  card:      "#FFFFFF",
  border:    "#E8DDD0",
  ink:       "#2C1A0E",   // deep espresso
  inkMid:    "#6B4C36",   // warm brown
  inkSoft:   "#A08878",   // muted tan
  primary:   "#C9853A",   // warm amber-gold
  primaryDk: "#9E6425",   // deep gold
  primaryLt: "#FFF3E0",   // pale amber
  emerald:   "#2A6B4C",   // deep forest green
  emeraldLt: "#E8F5EE",   // pale mint
  rose:      "#B85C6E",   // dusty rose
  shadow:    "rgba(44,26,14,0.08)",
  // Dark brand hero — the logo is gold/white and only reads on dark
  hero:      "radial-gradient(circle at 50% 38%, rgba(242,179,61,0.22), transparent 50%), radial-gradient(120% 90% at 50% 0%, #3A2610 0%, #120C06 65%)",
}

export default function LoginPage() {
  const { user, ready, login } = useAuth()
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [pass, setPass] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (ready && user) router.replace("/") }, [ready, user, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true)
    const err = await login(phone, pass)
    if (err) { setError(err); setLoading(false) } else { router.replace("/") }
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: C.bg, fontFamily: "var(--font-dm), system-ui, sans-serif" }}>

      {/* Brand hero */}
      <header className="rounded-b-[32px] px-5 pt-10 pb-20 text-center" style={{ background: C.hero }}>
        <Logo className="mx-auto size-36" />
        <h1 className="mt-3" style={{ fontFamily: "var(--font-playfair)", fontSize: "26px", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
          Welcome back
        </h1>
        <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
          Sign in to your PaisaX account
        </p>
      </header>

      <div className="relative -mt-12 flex flex-col flex-1 px-5 pb-10 max-w-sm mx-auto w-full">

        {/* Form card */}
        <div className="rounded-2xl p-6" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: `0 12px 32px ${C.shadow}` }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest" style={{ color: C.inkMid }}>
                Mobile Number
              </label>
              <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1.5px solid ${C.border}`, background: C.bg }}>
                <span className="px-3 py-3 text-sm font-semibold border-r" style={{ color: C.inkSoft, borderColor: C.border }}>+91</span>
                <input id="phone" type="tel" inputMode="numeric" placeholder="10-digit number" maxLength={10}
                  value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError("") }}
                  className="flex-1 px-3 py-3 bg-transparent text-sm outline-none"
                  style={{ color: C.ink }}
                  required />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pass" className="text-xs font-bold uppercase tracking-widest" style={{ color: C.inkMid }}>
                Password
              </label>
              <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1.5px solid ${C.border}`, background: C.bg }}>
                <input id="pass" type={showPass ? "text" : "password"} placeholder="Your password"
                  value={pass} onChange={(e) => { setPass(e.target.value); setError("") }}
                  className="flex-1 px-4 py-3 bg-transparent text-sm outline-none"
                  style={{ color: C.ink }}
                  required />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="px-3 py-3 transition-colors" style={{ color: C.inkSoft }}>
                  {showPass ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
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
                ? <span className="flex items-center justify-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Signing in…</span>
                : "Sign In"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: C.inkSoft }}>
            New to PaisaX?{" "}
            <Link href="/signup" className="font-bold transition-colors hover:underline" style={{ color: C.primary }}>
              Create free account →
            </Link>
          </p>
        </div>

        {/* Earn reminder card */}
        <div className="rounded-2xl p-4 mt-5 flex items-center gap-3"
          style={{ background: C.emeraldLt, border: `1px solid ${C.emerald}22` }}>
          <span className="text-xl">💰</span>
          <div>
            <p className="text-sm font-bold" style={{ color: C.emerald }}>Your daily earnings are waiting</p>
            <p className="text-xs mt-0.5" style={{ color: `${C.emerald}99` }}>Claim coins as soon as you log in</p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            { emoji: "🔒", label: "SSL Secured", sub: "Bank-grade" },
            { emoji: "⚡", label: "Daily Earn", sub: "Claim anytime" },
            { emoji: "✅", label: "Verified", sub: "1,200+ users" },
          ].map(({ emoji, label, sub }) => (
            <div key={label} className="flex flex-col items-center gap-1 rounded-xl p-3 text-center"
              style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <span className="text-lg">{emoji}</span>
              <p className="text-[11px] font-bold" style={{ color: C.ink }}>{label}</p>
              <p className="text-[10px]" style={{ color: C.inkSoft }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[10px]" style={{ color: C.inkSoft }}>
          © 2024 PaisaX · All rights reserved
        </p>
      </div>
    </div>
  )
}
