"use client"

import { useState } from "react"
import {
  ArrowRightIcon,
  ChevronRightIcon,
  CopyIcon,
  CreditCardIcon,
  DollarSignIcon,
  Share2Icon,
  TrendingUpIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/marks"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { fmt, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export default function ReferPage() {
  const { ready: loaded, state } = useStore()
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)

  if (!loaded) return <Skeleton />

  const inviteCode = state.inviteCode || "SOLAR88"
  const inviteLink = typeof window !== "undefined" ? `${window.location.origin}/login?tab=register&invite=${inviteCode}` : ""

  const totalMembers = state.invites || 0
  const teamRecharge = totalMembers * 285 // estimated team deposit volume
  const teamWithdraw = 0

  const levels = [
    {
      level: 1,
      commission: "10%",
      members: totalMembers,
      active: totalMembers > 0 ? totalMembers : 0,
      recharge: teamRecharge,
    },
    {
      level: 2,
      commission: "3%",
      members: 0,
      active: 0,
      recharge: 0,
    },
    {
      level: 3,
      commission: "1%",
      members: 0,
      active: 0,
      recharge: 0,
    },
  ]

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch {
      toast.error(`Could not copy. Text is: ${text}`)
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "PaisaX Solar",
          text: `Join PaisaX Solar Investment and earn daily income! Use my invite code: ${inviteCode}`,
          url: inviteLink,
        })
      } catch {
        // Share cancelled
      }
    } else {
      setInviteModalOpen(true)
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-12 max-w-md mx-auto font-sans -mt-3">
      
      {/* ── TOP HEADER BANNER (Solar Gradient) ────────────────────────── */}
      <div className="relative -mx-3.5 px-5 pt-6 pb-12 rounded-b-[36px] bg-gradient-to-b from-[#b45309] via-[#d97706] to-[#f59e0b] shadow-md text-white overflow-hidden">
        {/* Ambient glow decoration */}
        <div className="absolute -top-10 -right-10 size-44 rounded-full bg-yellow-300/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 size-36 rounded-full bg-amber-950/30 blur-xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="text-left">
            <h1 className="text-xl font-black tracking-tight text-white drop-shadow-xs">
              My Team
            </h1>
            <p className="mt-2 text-4xl font-black text-white leading-none">
              {totalMembers}
            </p>
            <p className="mt-1 text-xs font-semibold text-amber-100">
              Members across 3 levels
            </p>
          </div>

          <div className="flex size-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/25 shadow-inner text-white">
            <UsersIcon className="size-7" />
          </div>
        </div>
      </div>

      {/* ── 3 METRICS STAT CARD (Overlapping Header) ───────────────────── */}
      <div className="relative -mt-8 mx-1 rounded-[26px] bg-white p-4 shadow-xl shadow-amber-950/5 border border-amber-100/80">
        <div className="grid grid-cols-3 divide-x divide-amber-100/80 text-center">
          
          {/* Team recharge */}
          <div className="flex flex-col items-center px-1">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 shadow-xs">
              <CreditCardIcon className="size-5" />
            </span>
            <p className="mt-2 text-base font-black text-slate-900 leading-tight">
              ₹{fmt(teamRecharge)}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              Team recharge
            </p>
          </div>

          {/* Team withdraw */}
          <div className="flex flex-col items-center px-1">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 shadow-xs">
              <WalletIcon className="size-5" />
            </span>
            <p className="mt-2 text-base font-black text-slate-900 leading-tight">
              ₹{fmt(teamWithdraw)}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              Team withdraw
            </p>
          </div>

          {/* Team members */}
          <div className="flex flex-col items-center px-1">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 shadow-xs">
              <UsersIcon className="size-5" />
            </span>
            <p className="mt-2 text-base font-black text-slate-900 leading-tight">
              {totalMembers}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              Team members
            </p>
          </div>

        </div>
      </div>

      {/* ── GROW YOUR TEAM BANNER ─────────────────────────────────────── */}
      <div className="rounded-[24px] bg-gradient-to-r from-[#1c1917] via-[#292524] to-[#451a03] p-4 text-white shadow-lg flex items-center justify-between border border-amber-500/30">
        <div className="min-w-0 pr-3">
          <h2 className="text-sm font-black text-amber-300">
            Grow your team
          </h2>
          <p className="text-[11px] font-medium text-amber-100/90 leading-tight mt-0.5">
            Earn up to 10% on every plan your team buys.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setInviteModalOpen(true)}
          className="shrink-0 flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-900 shadow-md hover:bg-amber-50 active:scale-95 transition-all cursor-pointer"
        >
          <Share2Icon className="size-3.5 text-amber-600" />
          <span>Invite</span>
        </button>
      </div>

      {/* ── TEAM LEVELS SECTION ───────────────────────────────────────── */}
      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-slate-900">
            Team levels
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            Tap a level to see members
          </span>
        </div>

        <div className="rounded-[26px] bg-white shadow-sm border border-amber-100 divide-y divide-amber-100/70 overflow-hidden">
          {levels.map(({ level, commission, members, active: act, recharge }) => (
            <div
              key={level}
              onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
              className="flex items-center justify-between p-4 hover:bg-amber-50/40 transition-colors cursor-pointer"
            >
              {/* Left: Level Pill Badge */}
              <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-white shadow-xs font-black">
                <span className="text-[9px] uppercase leading-none opacity-90">Level</span>
                <span className="text-base leading-tight">{level}</span>
              </div>

              {/* Center: Members & Active */}
              <div className="flex-1 min-w-0 px-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{members}</span>
                  <span className="text-xs text-slate-500">members</span>
                </div>
                <div className="mt-1 h-1 w-24 rounded-full bg-amber-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: members > 0 ? "100%" : "0%" }}
                  />
                </div>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  {act} active
                </p>
              </div>

              {/* Right: Commission Badge & Recharge */}
              <div className="flex items-center gap-2 text-right">
                <div>
                  <span className="inline-block rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-black text-amber-800 border border-amber-200">
                    {commission} commission
                  </span>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">
                    Recharge <span className="font-bold text-slate-800">₹{fmt(recharge)}</span>
                  </p>
                </div>
                <ChevronRightIcon className="size-4 text-slate-400 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TEAM ACTIVITY SECTION ─────────────────────────────────────── */}
      <div className="flex flex-col gap-2 mt-2">
        <h2 className="text-sm font-black text-slate-900 px-1">
          Team activity
        </h2>

        <div className="rounded-[28px] bg-white p-7 text-center shadow-sm border border-amber-100 flex flex-col items-center justify-center min-h-[170px]">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-600 shadow-inner">
            <UserCheckIcon className="size-6" />
          </div>

          <h3 className="mt-3.5 text-sm font-black text-slate-900">
            No team recharges yet
          </h3>
          <p className="mt-1 max-w-[240px] text-[11px] font-medium text-slate-500 leading-relaxed">
            When your Level 1 members recharge, your commission will show up here instantly.
          </p>
        </div>
      </div>

      {/* ── SHARE & INVITE MODAL ─────────────────────────────────────── */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent sheet className="border-t-4 border-amber-500 rounded-t-[32px] sm:rounded-[32px] p-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-black text-slate-900">
              Invite Friends & Earn
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-3">
            {/* Invite Code Box */}
            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 text-center">
              <p className="text-xs font-bold text-amber-900">Your Invitation Code</p>
              <p className="mt-1 text-3xl font-black tracking-widest text-[#b45309]">
                {inviteCode}
              </p>
              <button
                type="button"
                onClick={() => copyText(inviteCode, "Invite code")}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 active:scale-95 transition-all cursor-pointer"
              >
                <CopyIcon className="size-3.5" />
                <span>Copy Code</span>
              </button>
            </div>

            {/* Invite Link Box */}
            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
              <p className="text-xs font-bold text-slate-700 mb-1.5">Invitation Link</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 rounded-xl bg-white px-3 py-2 text-xs text-slate-700 border border-slate-200 select-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => copyText(inviteLink, "Invite link")}
                  className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 active:scale-95 cursor-pointer shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Native Share button */}
            <button
              type="button"
              onClick={handleShare}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer"
            >
              <Share2Icon className="size-4" />
              <span>Share Link with Friends</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
