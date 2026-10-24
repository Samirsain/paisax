"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  GiftIcon,
  HistoryIcon,
  LogOutIcon,
  PackageIcon,
  PencilIcon,
  PhoneIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  TrendingUpIcon,
  UserCheckIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
  ZapIcon,
  SendIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/marks"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { active, getPlan } from "@/lib/game"
import { useInstall } from "@/lib/install"
import { fmt, useStore } from "@/lib/store"
import { avatarOf, useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const { ready: loaded, state, rename } = useStore()
  const { user, logout } = useAuth()
  const router = useRouter()
  const { status: pwaStatus, install: installPwa } = useInstall()

  const [editNameOpen, setEditNameOpen] = useState(false)
  const [nameInput, setNameInput] = useState(state.name)

  if (!loaded) return <Skeleton />

  const runningPlans = active(state)
  const totalInvested = runningPlans.reduce((sum, o) => sum + getPlan(o.planId).cost, 0)
  const dailyIncome = runningPlans.reduce((sum, o) => sum + getPlan(o.planId).perDay, 0)
  const avatarSrc = user ? avatarOf(user) : "/avatar/1.png"
  const phone = user?.phone || "9876543210"
  const maskedPhone = `+91 ${phone.slice(0, 3)}****${phone.slice(-3)}`

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    const clean = nameInput.trim()
    if (!clean) return
    rename(clean)
    setEditNameOpen(false)
    toast.success("Name updated successfully")
  }

  async function copyInviteCode() {
    try {
      await navigator.clipboard.writeText(state.inviteCode)
      toast.success("Invite code copied!")
    } catch {
      toast.error(`Invite code: ${state.inviteCode}`)
    }
  }

  const menuItems = [
    {
      title: "My Orders & Income",
      subtitle: `${runningPlans.length} active solar plans`,
      icon: PackageIcon,
      href: "/my-plans",
      badge: runningPlans.length > 0 ? `${runningPlans.length} Active` : undefined,
    },
    {
      title: "Recharge Balance",
      subtitle: "Instant UPI deposits via AeroPay",
      icon: WalletIcon,
      href: "/wallet",
    },
    {
      title: "Withdraw Funds",
      subtitle: "Instant Bank transfer payouts (Min ₹200)",
      icon: GiftIcon,
      href: "/wallet/withdraw",
    },
    {
      title: "My Team & Invites",
      subtitle: "Up to 10% 3-level commissions",
      icon: UsersIcon,
      href: "/refer",
      badge: state.invites > 0 ? `${state.invites} Members` : undefined,
    },
    {
      title: "Telegram Official Support",
      subtitle: "@paisax025 • 24x7 Customer Helpdesk",
      icon: SendIcon,
      href: "https://t.me/paisax025",
      isExternal: true,
      badge: "Online 24/7",
    },
  ]

  return (
    <div className="flex flex-col gap-4 pb-12 max-w-md mx-auto font-sans -mt-3">
      
      {/* ── TOP USER PROFILE HEADER (Solar Gradient) ───────────────────── */}
      <div className="relative -mx-3.5 px-5 pt-6 pb-14 rounded-b-[36px] bg-gradient-to-b from-[#b45309] via-[#d97706] to-[#f59e0b] shadow-md text-white overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-12 -right-12 size-48 rounded-full bg-yellow-300/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 size-36 rounded-full bg-amber-950/30 blur-xl pointer-events-none" />

        <div className="flex items-center gap-3.5">
          {/* Avatar with golden ring */}
          <div className="relative size-16 shrink-0 rounded-full border-2 border-white/80 bg-slate-900 shadow-md ring-2 ring-yellow-400/50 overflow-hidden">
            <Image
              src={avatarSrc}
              alt="Profile"
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white truncate drop-shadow-xs">
                {state.name || "Solar Member"}
              </h1>
              <button
                type="button"
                aria-label="Edit Name"
                onClick={() => {
                  setNameInput(state.name)
                  setEditNameOpen(true)
                }}
                className="flex size-6 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 active:scale-95"
              >
                <PencilIcon className="size-3" />
              </button>
            </div>

            <p className="text-xs font-semibold text-amber-100 flex items-center gap-1 mt-0.5">
              <PhoneIcon className="size-3 text-yellow-300" />
              <span>{maskedPhone}</span>
            </p>

            {/* Invite code chip */}
            <button
              type="button"
              onClick={copyInviteCode}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-0.5 text-[11px] font-bold text-amber-100 border border-white/20 hover:bg-black/40 active:scale-95 transition-all"
            >
              <span>ID: {state.inviteCode}</span>
              <CopyIcon className="size-3 text-yellow-300" />
            </button>
          </div>
        </div>
      </div>

      {/* ── WALLET BALANCE & QUICK ACTION CARD ────────────────────────── */}
      <div className="relative -mt-9 mx-1 rounded-[26px] bg-white p-5 shadow-xl shadow-amber-950/5 border border-amber-100/80">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Available Balance</p>
            <p className="mt-0.5 text-3xl font-black text-slate-900">
              ₹{fmt(state.coins)}
            </p>
          </div>

          <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
            <WalletIcon className="size-6" />
          </span>
        </div>

        {/* 2 Primary CTA Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            href="/wallet"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-xs font-black text-white shadow-md shadow-amber-500/25 active:scale-95 transition-all hover:opacity-95 text-center"
          >
            <WalletIcon className="size-4" />
            <span>Recharge</span>
          </Link>

          <Link
            href="/wallet/withdraw"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 py-3 text-xs font-black text-slate-950 shadow-md shadow-yellow-500/20 active:scale-95 transition-all hover:opacity-95 text-center"
          >
            <GiftIcon className="size-4" />
            <span>Withdraw</span>
          </Link>
        </div>

        {/* Mini stats row */}
        <div className="mt-4 grid grid-cols-3 pt-3 border-t border-amber-100/70 text-center">
          <div>
            <p className="text-[10px] font-semibold text-slate-400">Total Invested</p>
            <p className="mt-0.5 text-xs font-black text-slate-800">₹{fmt(totalInvested)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400">Daily Return</p>
            <p className="mt-0.5 text-xs font-black text-emerald-600">₹{fmt(dailyIncome)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400">Team Invites</p>
            <p className="mt-0.5 text-xs font-black text-amber-700">{state.invites}</p>
          </div>
        </div>
      </div>

      {/* ── ACCOUNT MENU LIST ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 mt-1">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          Services & Records
        </h2>

        <div className="rounded-[26px] bg-white shadow-sm border border-amber-100 divide-y divide-amber-100/70 overflow-hidden">
          {menuItems.map(({ title, subtitle, icon: Icon, href, badge, isExternal }: any) => {
            const inner = (
              <>
                <div className="flex items-center gap-3.5">
                  <span className={cn(
                    "flex size-10 items-center justify-center rounded-2xl border shadow-xs",
                    isExternal ? "bg-sky-50 text-sky-600 border-sky-200" : "bg-amber-50 text-amber-600 border-amber-200/60"
                  )}>
                    <Icon className={cn("size-5", isExternal && "-rotate-12")} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{title}</p>
                    <p className="text-[11px] font-medium text-slate-400">{subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {badge && (
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                      isExternal
                        ? "bg-sky-50 text-sky-700 border-sky-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>
                      {badge}
                    </span>
                  )}
                  <ChevronRightIcon className="size-4 text-slate-400" />
                </div>
              </>
            )

            return isExternal ? (
              <a
                key={title}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 hover:bg-sky-50/40 transition-colors"
              >
                {inner}
              </a>
            ) : (
              <Link
                key={title}
                href={href}
                className="flex items-center justify-between p-4 hover:bg-amber-50/40 transition-colors"
              >
                {inner}
              </Link>
            )
          })}

          {/* Install App row if available */}
          {pwaStatus === "prompt" && (
            <button
              type="button"
              onClick={installPwa}
              className="flex w-full items-center justify-between p-4 hover:bg-amber-50/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-yellow-50 text-yellow-600 border border-yellow-200 shadow-xs">
                  <SmartphoneIcon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">Install App (PWA)</p>
                  <p className="text-[11px] font-medium text-slate-400">Add PaisaX Solar to home screen</p>
                </div>
              </div>
              <DownloadIcon className="size-4 text-yellow-600" />
            </button>
          )}
        </div>
      </div>

      {/* ── LOGOUT BUTTON ────────────────────────────────────────────── */}
      <div className="mt-3">
        <button
          type="button"
          onClick={async () => {
            await logout()
            router.replace("/login")
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-3.5 text-xs font-bold text-red-600 border border-red-200 hover:bg-red-100 active:scale-95 transition-all cursor-pointer"
        >
          <LogOutIcon className="size-4" />
          <span>Log Out from PaisaX</span>
        </button>
      </div>

      {/* ── EDIT NAME MODAL ──────────────────────────────────────────── */}
      <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
        <DialogContent sheet className="border-t-4 border-amber-500 rounded-t-[32px] sm:rounded-[32px] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">
              Change Display Name
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveName} className="mt-4 flex flex-col gap-3">
            <Input
              value={nameInput}
              maxLength={24}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your name"
              className="h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 text-sm font-bold text-slate-900"
            />
            <Button
              type="submit"
              variant="buy"
              size="lg"
              disabled={!nameInput.trim()}
              className="w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-bold text-white shadow-md active:scale-95 cursor-pointer"
            >
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
