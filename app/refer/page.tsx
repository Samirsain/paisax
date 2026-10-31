"use client"

import { useState, useEffect } from "react"
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
  SparklesIcon,
  CheckCircle2Icon,
  HelpCircleIcon,
  SendIcon,
  LayersIcon,
  ClockIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/marks"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { fmt, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface TeamMember {
  id: string
  name: string
  phone: string
  createdAt: string
  deposited: number
  isActive: boolean
}

interface LevelData {
  level: number
  name: string
  commissionRate: string
  percent: number
  membersCount: number
  activeCount: number
  rechargeAmount: number
  commissionEarned: number
  members: TeamMember[]
}

interface CommissionLog {
  id: string
  level: number
  percent: number
  orderAmount: number
  commissionAmount: number
  createdAt: string
  payerName: string
  payerPhone: string
}

interface ReferralApiResponse {
  inviteCode: string
  totalTeamMembers: number
  totalActiveMembers: number
  totalTeamRecharge: number
  totalCommission: number
  paidCommission: number
  pendingCommission: number
  levels: LevelData[]
  recentCommissions: CommissionLog[]
}

export default function ReferPage() {
  const { ready: loaded, state } = useStore()
  const [data, setData] = useState<ReferralApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [activeLevelTab, setActiveLevelTab] = useState<number>(1)
  const [showRuleModal, setShowRuleModal] = useState(false)

  // Fetch live referral team data from API
  useEffect(() => {
    fetch("/api/refer")
      .then((res) => res.json())
      .then((res) => {
        if (!res.error) {
          setData(res)
        }
      })
      .catch((err) => console.error("Failed to load referral data:", err))
      .finally(() => setLoading(false))
  }, [])

  if (!loaded) return <Skeleton />

  const inviteCode = data?.inviteCode || state.inviteCode || "SOLAR88"
  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/login?tab=register&invite=${inviteCode}`
      : ""

  const totalMembers = data?.totalTeamMembers ?? (state.invites || 0)
  const totalCommission = data?.totalCommission ?? 0
  const totalTeamRecharge = data?.totalTeamRecharge ?? 0
  const totalActive = data?.totalActiveMembers ?? 0

  const levels: LevelData[] = data?.levels || [
    {
      level: 1,
      name: "Level 1 – Direct Referrals",
      commissionRate: "10%",
      percent: 10,
      membersCount: totalMembers,
      activeCount: totalActive,
      rechargeAmount: totalTeamRecharge,
      commissionEarned: totalCommission,
      members: [],
    },
    {
      level: 2,
      name: "Level 2 – Indirect Referrals",
      commissionRate: "3%",
      percent: 3,
      membersCount: 0,
      activeCount: 0,
      rechargeAmount: 0,
      commissionEarned: 0,
      members: [],
    },
    {
      level: 3,
      name: "Level 3 – 3rd-Level Referrals",
      commissionRate: "1.5%",
      percent: 1.5,
      membersCount: 0,
      activeCount: 0,
      rechargeAmount: 0,
      commissionEarned: 0,
      members: [],
    },
  ]

  const currentLevelData = levels.find((l) => l.level === activeLevelTab) || levels[0]

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
          text: `Join PaisaX Solar Investment and earn guaranteed daily income! Use my invite code: ${inviteCode}`,
          url: inviteLink,
        })
      } catch {
        // Share cancelled
      }
    } else {
      setInviteModalOpen(true)
    }
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `⚡ *Join PaisaX Solar Investment & Earn Daily Cash!*\n\nInvest in solar energy plans from ₹300 and get guaranteed daily wallet returns.\n\n👉 *Join now using my link:* ${inviteLink}\n👉 *Invite Code:* ${inviteCode}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank")
  }

  function shareTelegram() {
    const text = encodeURIComponent(
      `⚡ Join PaisaX Solar Investment & Earn Daily Cash! Use my invite code: ${inviteCode}`
    )
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${text}`, "_blank")
  }

  return (
    <div className="flex flex-col gap-4 pb-12 max-w-md mx-auto font-sans -mt-3">
      
      {/* ── TOP HEADER BANNER (Solar Gradient) ────────────────────────── */}
      <div className="relative -mx-3.5 px-5 pt-6 pb-14 rounded-b-[36px] bg-gradient-to-b from-[#b45309] via-[#d97706] to-[#f59e0b] shadow-md text-white overflow-hidden">
        {/* Ambient glow decoration */}
        <div className="absolute -top-10 -right-10 size-44 rounded-full bg-yellow-300/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 size-36 rounded-full bg-amber-950/30 blur-xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-0.5 text-[11px] font-bold text-amber-100 border border-white/20 mb-1.5">
              <SparklesIcon className="size-3 text-yellow-300" />
              <span>3-Level MLM Commission System</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white drop-shadow-xs">
              My Referral Team
            </h1>
            <p className="mt-1 text-4xl font-black text-white leading-none">
              ₹{fmt(totalCommission)}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-amber-100 flex items-center gap-1">
              <CheckCircle2Icon className="size-3.5 text-emerald-300" />
              <span>Total Earned & Credited to Wallet</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowRuleModal(true)}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 px-3 py-2 text-[10px] font-bold text-white shadow-inner hover:bg-white/30 transition-all cursor-pointer"
          >
            <HelpCircleIcon className="size-5 text-yellow-300" />
            <span>Rules</span>
          </button>
        </div>
      </div>

      {/* ── 3 METRICS STAT CARD (Overlapping Header) ───────────────────── */}
      <div className="relative -mt-8 mx-1 rounded-[26px] bg-white p-4 shadow-xl shadow-amber-950/5 border border-amber-100/80">
        <div className="grid grid-cols-3 divide-x divide-amber-100/80 text-center">
          
          {/* Total Members */}
          <div className="flex flex-col items-center px-1">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 shadow-xs">
              <UsersIcon className="size-5" />
            </span>
            <p className="mt-2 text-base font-black text-slate-900 leading-tight">
              {totalMembers}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              Total Team
            </p>
          </div>

          {/* Active Investors */}
          <div className="flex flex-col items-center px-1">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-xs">
              <UserCheckIcon className="size-5" />
            </span>
            <p className="mt-2 text-base font-black text-emerald-600 leading-tight">
              {totalActive}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              Active Investors
            </p>
          </div>

          {/* Team Volume */}
          <div className="flex flex-col items-center px-1">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 shadow-xs">
              <CreditCardIcon className="size-5" />
            </span>
            <p className="mt-2 text-base font-black text-amber-700 leading-tight">
              ₹{fmt(totalTeamRecharge)}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              Team Volume
            </p>
          </div>

        </div>
      </div>

      {/* ── REFERRAL LINK & QUICK SHARE CARD ───────────────────────────── */}
      <div className="rounded-[26px] bg-gradient-to-br from-slate-950 via-[#0e1726] to-[#0c1424] p-4 text-white shadow-xl border border-amber-500/30 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-12 -right-12 size-36 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Your Unique Referral Code
            </p>
            <p className="text-xl font-mono font-black tracking-widest text-white mt-0.5">
              {inviteCode}
            </p>
          </div>

          <button
            type="button"
            onClick={() => copyText(inviteCode, "Invite code")}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 active:scale-95 transition-all cursor-pointer"
          >
            <CopyIcon className="size-3.5" />
            <span>Copy Code</span>
          </button>
        </div>

        {/* Link Input Row */}
        <div className="mt-3">
          <p className="text-[11px] text-slate-400 font-medium mb-1.5">
            Share this link to bind new users automatically to your 3-level team:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-amber-200 select-all outline-none"
            />
            <button
              type="button"
              onClick={() => copyText(inviteLink, "Referral link")}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-2 text-xs font-black text-slate-950 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              Copy Link
            </button>
          </div>
        </div>

        {/* 1-Tap Social Share Buttons */}
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 py-2 text-xs font-bold text-[#25D366] hover:bg-[#25D366]/30 active:scale-95 transition-all cursor-pointer"
          >
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={shareTelegram}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#0088cc]/20 border border-[#0088cc]/40 py-2 text-xs font-bold text-[#38bdf8] hover:bg-[#0088cc]/30 active:scale-95 transition-all cursor-pointer"
          >
            <span>Telegram</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 py-2 text-xs font-bold text-white hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <Share2Icon className="size-3" />
            <span>More</span>
          </button>
        </div>
      </div>

      {/* ── 3-LEVEL COMMISSION TABS (Level 1 [10%], Level 2 [3%], Level 3 [1.5%]) ── */}
      <div className="flex flex-col gap-2.5 mt-1">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              3-Level Commission Tiers
            </h2>
            <p className="text-[11px] text-slate-500">
              Select tier to view team volume, income & members
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRuleModal(true)}
            className="text-[11px] font-bold text-amber-700 underline cursor-pointer"
          >
            How it works
          </button>
        </div>

        {/* Level Tabs */}
        <div className="grid grid-cols-3 gap-2">
          {levels.map((lvl) => (
            <button
              key={lvl.level}
              type="button"
              onClick={() => setActiveLevelTab(lvl.level)}
              className={cn(
                "rounded-2xl p-3 text-center transition-all cursor-pointer border flex flex-col items-center justify-between",
                activeLevelTab === lvl.level
                  ? "bg-gradient-to-b from-amber-500 to-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/25 scale-[1.02]"
                  : "bg-white text-slate-700 border-amber-200/80 hover:bg-amber-50/50"
              )}
            >
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Level {lvl.level}
                </span>
                <span className={cn(
                  "rounded-full px-1.5 py-0.2 text-[9px] font-black",
                  activeLevelTab === lvl.level ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                )}>
                  {lvl.commissionRate}
                </span>
              </div>
              <p className={cn(
                "mt-2 text-base font-black leading-tight",
                activeLevelTab === lvl.level ? "text-white" : "text-slate-900"
              )}>
                {lvl.membersCount}
              </p>
              <p className={cn(
                "mt-0.5 text-[10px] font-semibold",
                activeLevelTab === lvl.level ? "text-amber-100" : "text-slate-400"
              )}>
                {lvl.activeCount} Active
              </p>
            </button>
          ))}
        </div>

        {/* Selected Level Deep-Dive Card */}
        <div className="rounded-[26px] bg-white p-4 shadow-sm border border-amber-200">
          <div className="flex items-start justify-between pb-3 border-b border-amber-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-7 flex items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black text-xs">
                  L{currentLevelData.level}
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {currentLevelData.name}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    You earn <strong className="text-amber-800">{currentLevelData.commissionRate}</strong> on every plan purchase
                  </p>
                </div>
              </div>
            </div>

            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-black text-emerald-700 border border-emerald-200">
              ₹{fmt(currentLevelData.commissionEarned)} Earned
            </span>
          </div>

          {/* Level Stats Bar */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs bg-amber-50/50 p-2.5 rounded-2xl border border-amber-200/60">
            <div>
              <span className="text-[10px] text-slate-500 block">Members</span>
              <span className="font-black text-slate-900">{currentLevelData.membersCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Active Buyers</span>
              <span className="font-black text-emerald-600">{currentLevelData.activeCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Deposit Volume</span>
              <span className="font-black text-amber-800">₹{fmt(currentLevelData.rechargeAmount)}</span>
            </div>
          </div>

          {/* Members List */}
          <div className="mt-3.5">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              Level {currentLevelData.level} Members ({currentLevelData.members.length})
            </p>

            {currentLevelData.members.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-400 text-xs border border-slate-200/60">
                <UserPlusIcon className="size-7 mx-auto text-slate-300 mb-1.5" />
                <p className="font-bold text-slate-600">No members in Level {currentLevelData.level} yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {currentLevelData.level === 1
                    ? "Share your link to invite direct friends and earn 10% commission!"
                    : currentLevelData.level === 2
                    ? "When your direct members invite friends, they will appear here (3% commission)!"
                    : "When your Level 2 team invites new users, they appear here (1.5% commission)!"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                {currentLevelData.members.map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{m.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {m.phone} · Joined {new Date(m.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                        m.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      )}>
                        {m.isActive ? `Deposited ₹${fmt(m.deposited)}` : "Registered"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RECENT COMMISSIONS LOG ────────────────────────────────────── */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-black text-slate-900">
              Recent Commission Earnings
            </h2>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Instant Credit
          </span>
        </div>

        {data?.recentCommissions && data.recentCommissions.length > 0 ? (
          <div className="rounded-[26px] bg-white shadow-sm border border-amber-100 divide-y divide-amber-100/70 overflow-hidden">
            {data.recentCommissions.map((log) => (
              <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-amber-50/30 transition-colors text-xs">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex size-9 items-center justify-center rounded-xl font-black text-xs shrink-0 shadow-xs",
                    log.level === 1
                      ? "bg-amber-500 text-slate-950"
                      : log.level === 2
                      ? "bg-amber-700 text-white"
                      : "bg-slate-800 text-amber-300"
                  )}>
                    L{log.level}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-slate-900">{log.payerName}</p>
                      <span className="text-[9px] font-black text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-mono">
                        {log.percent}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Order ₹{fmt(log.orderAmount)} · {new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">
                    +₹{fmt(log.commissionAmount)}
                  </p>
                  <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                    Credited
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[26px] bg-white p-7 text-center shadow-sm border border-amber-100 flex flex-col items-center justify-center min-h-[140px]">
            <ClockIcon className="size-6 text-slate-300 mb-1" />
            <h3 className="text-xs font-black text-slate-800">No commissions received yet</h3>
            <p className="mt-1 text-[11px] text-slate-400 max-w-xs">
              When any member in your 3-level team activates a solar plan, your commission will appear here instantly!
            </p>
          </div>
        )}
      </div>

      {/* ── EXPLANATION CARD (Visual Rule & Example) ──────────────────── */}
      <div className="rounded-[26px] bg-amber-50/60 p-4 border border-amber-200/80 text-xs space-y-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="size-4 text-amber-700" />
          <h3 className="font-black text-slate-900">How 3-Level Commission Works</h3>
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed">
          PaisaX provides a transparent 3-level upline system with immediate wallet payouts:
        </p>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="rounded-xl bg-white p-2 border border-amber-200">
            <span className="text-[10px] font-black text-amber-600 block">Level 1 (Direct)</span>
            <span className="text-sm font-black text-slate-900">10%</span>
          </div>
          <div className="rounded-xl bg-white p-2 border border-amber-200">
            <span className="text-[10px] font-black text-amber-700 block">Level 2 (Indirect)</span>
            <span className="text-sm font-black text-slate-900">3%</span>
          </div>
          <div className="rounded-xl bg-white p-2 border border-amber-200">
            <span className="text-[10px] font-black text-amber-800 block">Level 3 (3rd-Level)</span>
            <span className="text-sm font-black text-slate-900">1.5%</span>
          </div>
        </div>

        <div className="rounded-xl bg-white p-2.5 border border-amber-200/80 text-[11px] text-slate-700">
          <p className="font-bold text-amber-900 mb-0.5">📌 Example (A → B → C → D):</p>
          <p className="leading-relaxed">
            If User D purchases a ₹1,000 plan:
            <br />• User C gets <strong className="text-emerald-700">₹100 (10%)</strong>
            <br />• User B gets <strong className="text-emerald-700">₹30 (3%)</strong>
            <br />• User A gets <strong className="text-emerald-700">₹15 (1.5%)</strong>
            <br />Total distributed: ₹145. Level 4+ receives 0%.
          </p>
        </div>
      </div>

      {/* ── SHARE & INVITE MODAL ─────────────────────────────────────── */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent sheet className="border border-amber-100 rounded-t-[32px] sm:rounded-[32px] p-6 bg-white shadow-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-black text-slate-900">
              Invite Friends & Earn
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Earn 10% on direct invites, 3% on level 2, and 1.5% on level 3
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-3">
            {/* Invite Code Box */}
            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 text-center">
              <p className="text-xs font-bold text-amber-900">Your Invitation Code</p>
              <p className="mt-1 text-3xl font-black tracking-widest text-[#b45309] font-mono">
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

      {/* ── RULES MODAL ──────────────────────────────────────────────── */}
      <Dialog open={showRuleModal} onOpenChange={setShowRuleModal}>
        <DialogContent className="rounded-[32px] p-6 max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              3-Level Referral Commission Structure
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Detailed commission rules and distribution terms
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-3 text-xs text-slate-700">
            <div className="rounded-2xl bg-amber-50 p-3 border border-amber-200 space-y-2">
              <div className="flex justify-between items-center font-bold">
                <span className="text-amber-900">🥇 Level 1 (Direct Referral)</span>
                <span className="text-amber-700 font-black text-sm">10%</span>
              </div>
              <p className="text-[11px] text-slate-600">
                When a user registers with your direct referral link and purchases any paid solar plan, you get 10% instant wallet credit.
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50/70 p-3 border border-amber-200 space-y-2">
              <div className="flex justify-between items-center font-bold">
                <span className="text-amber-900">🥈 Level 2 (Indirect Referral)</span>
                <span className="text-amber-700 font-black text-sm">3%</span>
              </div>
              <p className="text-[11px] text-slate-600">
                When your Level 1 member invites someone (Level 2 to you), you receive 3% commission on their purchases.
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50/40 p-3 border border-amber-200 space-y-2">
              <div className="flex justify-between items-center font-bold">
                <span className="text-amber-900">🥉 Level 3 (3rd-Level Referral)</span>
                <span className="text-amber-700 font-black text-sm">1.5%</span>
              </div>
              <p className="text-[11px] text-slate-600">
                When your Level 2 member invites someone (Level 3 to you), you receive 1.5% commission on their purchases.
              </p>
            </div>

            <div className="rounded-xl bg-slate-900 text-white p-3 text-[11px] space-y-1">
              <p className="font-bold text-amber-300">⚡ Important Policies:</p>
              <p>• Maximum 3 levels of distribution. Level 4+ receives 0%.</p>
              <p>• Only paid plans generate referral rewards (Free Trial ₹0 does not).</p>
              <p>• Instant wallet credit with 100% duplicate protection.</p>
            </div>

            <button
              type="button"
              onClick={() => setShowRuleModal(false)}
              className="w-full rounded-full bg-amber-500 hover:bg-amber-600 py-3 text-xs font-black text-slate-950 cursor-pointer"
            >
              Got It
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
