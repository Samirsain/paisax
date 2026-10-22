"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { EyeIcon, EyeOffIcon, LockIcon, PhoneIcon, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/marks"
import { useAuth } from "@/lib/auth"

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

  useEffect(() => {
    if (ready && user) router.replace("/")
  }, [ready, user, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (pass !== confirm) {
      setError("Passwords don't match")
      return
    }
    setLoading(true)
    const err = await signup(name, phone, pass)
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      router.replace("/")
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-[#1a1b4b] via-[#2d2f8f] to-[#1a1b4b] px-5 py-12">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 size-80 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="rounded-3xl bg-white/10 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl ring-1 ring-white/20">

          {/* Header */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <Logo className="size-10" />
            </div>
            <div className="text-center">
              <h1 className="text-[22px] font-bold tracking-tight text-white">Create Account</h1>
              <p className="mt-0.5 text-sm text-white/55">Join PaisaX and start earning daily</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-semibold tracking-widest text-white/60 uppercase">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/35" aria-hidden />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  maxLength={24}
                  autoComplete="given-name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError("") }}
                  className="h-12 rounded-xl border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/30 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/30"
                  required
                />
              </div>
            </div>

            {/* Mobile */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-semibold tracking-widest text-white/60 uppercase">
                Mobile Number
              </label>
              <div className="relative">
                <PhoneIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/35" aria-hidden />
                <span className="pointer-events-none absolute top-1/2 left-9 -translate-y-1/2 text-sm text-white/40 select-none">+91</span>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError("") }}
                  className="h-12 rounded-xl border-white/20 bg-white/10 pl-16 text-white placeholder:text-white/30 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/30"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pass" className="text-xs font-semibold tracking-widest text-white/60 uppercase">
                Password
              </label>
              <div className="relative">
                <LockIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/35" aria-hidden />
                <Input
                  id="pass"
                  type={showPass ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={pass}
                  onChange={(e) => { setPass(e.target.value); setError("") }}
                  className="h-12 rounded-xl border-white/20 bg-white/10 pl-10 pr-11 text-white placeholder:text-white/30 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/30"
                  required
                />
                <button
                  type="button"
                  aria-label={showPass ? "Hide password" : "Show password"}
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute top-1/2 right-3.5 -translate-y-1/2 text-white/35 hover:text-white/70 transition-colors"
                >
                  {showPass ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
            </div>

            {/* Re-enter Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm" className="text-xs font-semibold tracking-widest text-white/60 uppercase">
                Re-enter Password
              </label>
              <div className="relative">
                <LockIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/35" aria-hidden />
                <Input
                  id="confirm"
                  type={showPass ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError("") }}
                  className="h-12 rounded-xl border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/30 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/30"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p role="alert" className="rounded-xl bg-red-500/15 px-4 py-2.5 text-sm text-red-300 ring-1 ring-red-400/30">
                {error}
              </p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              size="xl"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating account…
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-indigo-300 hover:text-white transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
