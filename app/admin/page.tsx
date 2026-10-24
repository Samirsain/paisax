"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  UsersIcon,
  ZapIcon,
  CreditCardIcon,
  BanknoteIcon,
  SearchIcon,
  RefreshCwIcon,
  CopyIcon,
  CheckIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  LogOutIcon,
  ExternalLinkIcon,
  Building2Icon,
  PhoneIcon,
  CalendarIcon,
  ArrowUpRightIcon,
  DollarSignIcon,
  AlertTriangleIcon,
  Share2Icon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface OwnedPlanDetail {
  id?: string
  planId: string
  planName: string
  cost: number
  perDay: number
  days: number
  totalReturn: number
  claimed: number
  boughtAt?: number
}

interface UserItem {
  id: string
  name: string
  phone: string
  inviteCode: string
  invitedBy: string | null
  inviterName?: string | null
  inviterPhone?: string | null
  directInvitesCount?: number
  totalCommissionEarned?: number
  createdAt: string
  coins: number
  lifetime: number
  hasPaidPlan: boolean
  paidPlansCount: number
  totalDepositsAmount?: number
  successfulOrdersCount?: number
  ownedPlans: OwnedPlanDetail[]
  totalOrdersCount: number
  bankAccountName?: string | null
  bankAccountNumber?: string | null
  bankName?: string | null
  bankIfsc?: string | null
}

interface PaidUserItem {
  userId: string
  name: string
  phone: string
  inviteCode: string
  invitedBy?: string | null
  inviterName?: string | null
  inviterPhone?: string | null
  directInvitesCount?: number
  totalCommissionEarned?: number
  createdAt: string
  coins: number
  totalDeposits: number
  depositCount: number
  bankAccountName?: string | null
  bankAccountNumber?: string | null
  bankName?: string | null
  bankIfsc?: string | null
  ownedPlans: OwnedPlanDetail[]
  successfulOrders?: {
    id: string
    planId: string
    planName: string
    amount: number
    txnId: string | null
    createdAt: string
  }[]
}

interface OrderItem {
  id: string
  userId: string
  userName: string
  userPhone: string
  planId: string
  planName: string
  amount: number
  status: string
  txnId: string | null
  createdAt: string
}

interface WithdrawalItem {
  id: string
  userId: string
  userName: string
  userPhone: string
  accountName: string
  accountNumber: string
  bankName: string
  ifscCode: string
  amount: number
  fee: number
  netAmount: number
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED"
  utr: string | null
  adminNote: string | null
  createdAt: string
  updatedAt: string
}

interface CommissionItem {
  id: string
  orderId: string
  payerId: string
  payerName: string
  payerPhone: string
  recipientId: string
  recipientName: string
  recipientPhone: string
  level: number
  percent: number
  orderAmount: number
  commissionAmount: number
  status: string
  createdAt: string
}

interface AdminData {
  stats: {
    totalUsers: number
    paidUsersCount: number
    totalDeposits: number
    totalDepositsCount: number
    totalOrdersCount: number
    pendingWithdrawalsCount: number
    pendingWithdrawalsAmount: number
    approvedWithdrawalsCount: number
    approvedWithdrawalsAmount: number
    totalWithdrawalsCount: number
    totalCommissionsPaid?: number
    totalCommissionsCount?: number
  }
  users: UserItem[]
  paidUsers: PaidUserItem[]
  orders: OrderItem[]
  withdrawals: WithdrawalItem[]
  commissions?: CommissionItem[]
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"users" | "paid" | "withdrawals" | "orders" | "commissions">("users")
  const [search, setSearch] = useState("")
  const [withdrawalFilter, setWithdrawalFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL")
  const [orderFilter, setOrderFilter] = useState<"ALL" | "SUCCESS" | "PENDING" | "FAILED">("ALL")
  const [commissionFilter, setCommissionFilter] = useState<"ALL" | "1" | "2" | "3">("ALL")
  const [orderCheckingId, setOrderCheckingId] = useState<string | null>(null)

  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Action modal for approving / rejecting withdrawal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalItem | null>(null)
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null)
  const [actionUtr, setActionUtr] = useState("")
  const [actionNote, setActionNote] = useState("")
  const [actionRefund, setActionRefund] = useState(true)
  const [actionSubmitting, setActionSubmitting] = useState(false)

  // Check auth on load
  useEffect(() => {
    fetch("/api/admin/auth")
      .then((res) => res.json())
      .then((res) => {
        setAuthenticated(res.authenticated)
        if (res.authenticated) {
          loadData()
        } else {
          setLoading(false)
        }
      })
      .catch(() => {
        setAuthenticated(false)
        setLoading(false)
      })
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/data")
      if (res.status === 401) {
        setAuthenticated(false)
        return
      }
      const json = await res.json()
      if (json.stats) {
        setData(json)
      } else {
        toast.error("Failed to load dashboard data")
      }
    } catch {
      toast.error("Network error while loading data")
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError("")
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setAuthenticated(true)
        loadData()
      } else {
        setLoginError(json.error || "Invalid password")
      }
    } catch {
      setLoginError("Could not reach server")
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" })
    setAuthenticated(false)
    setData(null)
  }

  function copyToClipboard(text: string, key: string, label = "Copied") {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success(`${label}: ${text}`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  function copyAllPhones() {
    if (!data?.users?.length) return
    const phones = data.users.map((u) => u.phone).join("\n")
    copyToClipboard(phones, "all_phones", "All phone numbers copied")
  }

  async function handleUpdateWithdrawalStatus() {
    if (!selectedWithdrawal || !actionType) return
    setActionSubmitting(true)
    try {
      const targetStatus = actionType === "APPROVE" ? "APPROVED" : "REJECTED"
      const res = await fetch("/api/admin/withdrawals/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedWithdrawal.id,
          status: targetStatus,
          utr: actionUtr.trim() || undefined,
          adminNote: actionNote.trim() || undefined,
          refundUser: actionType === "REJECT" ? actionRefund : false,
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(`Withdrawal ${targetStatus.toLowerCase()} successfully!`)
        setSelectedWithdrawal(null)
        setActionType(null)
        setActionUtr("")
        setActionNote("")
        loadData()
      } else {
        toast.error(json.error || "Failed to update withdrawal")
      }
    } catch {
      toast.error("Network error while updating status")
    } finally {
      setActionSubmitting(false)
    }
  }

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!data?.users) return []
    const q = search.trim().toLowerCase()
    if (!q) return data.users
    return data.users.filter(
      (u) =>
        u.phone.includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.inviteCode.toLowerCase().includes(q)
    )
  }, [data?.users, search])

  // Filtered paid users
  const filteredPaidUsers = useMemo(() => {
    if (!data?.paidUsers) return []
    const q = search.trim().toLowerCase()
    if (!q) return data.paidUsers
    return data.paidUsers.filter(
      (u) =>
        u.phone.includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.inviteCode.toLowerCase().includes(q)
    )
  }, [data?.paidUsers, search])

  // Filtered withdrawals
  const filteredWithdrawals = useMemo(() => {
    if (!data?.withdrawals) return []
    let list = data.withdrawals
    if (withdrawalFilter !== "ALL") {
      list = list.filter((w) => {
        if (withdrawalFilter === "APPROVED") {
          return w.status === "APPROVED" || w.status === "PAID"
        }
        return w.status === withdrawalFilter
      })
    }
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (w) =>
        w.userPhone.includes(q) ||
        w.userName.toLowerCase().includes(q) ||
        w.accountNumber.includes(q) ||
        w.ifscCode.toLowerCase().includes(q) ||
        w.accountName.toLowerCase().includes(q)
    )
  }, [data?.withdrawals, withdrawalFilter, search])

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (!data?.orders) return []
    let list = data.orders
    if (orderFilter !== "ALL") {
      list = list.filter((o) => o.status === orderFilter)
    }
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.userPhone.includes(q) ||
        o.userName.toLowerCase().includes(q) ||
        o.planName.toLowerCase().includes(q) ||
        (o.txnId && o.txnId.toLowerCase().includes(q))
    )
  }, [data?.orders, orderFilter, search])

  // Filtered referral commissions
  const filteredCommissions = useMemo(() => {
    if (!data?.commissions) return []
    let list = data.commissions
    if (commissionFilter !== "ALL") {
      const lvl = parseInt(commissionFilter, 10)
      list = list.filter((c) => c.level === lvl)
    }
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (c) =>
        c.recipientName?.toLowerCase().includes(q) ||
        c.recipientPhone?.includes(q) ||
        c.payerName?.toLowerCase().includes(q) ||
        c.payerPhone?.includes(q) ||
        c.orderId?.toLowerCase().includes(q)
    )
  }, [data?.commissions, commissionFilter, search])

  async function handleCheckGateway(orderId: string) {
    setOrderCheckingId(orderId)
    try {
      const res = await fetch("/api/admin/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "CHECK_GATEWAY" }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(json.message)
        loadData()
      } else {
        toast.error(json.error || json.message || "Gateway check failed")
      }
    } catch {
      toast.error("Network error while checking gateway")
    } finally {
      setOrderCheckingId(null)
    }
  }

  async function handleManualApproveOrder(orderId: string) {
    if (!confirm("Are you sure you want to manually mark this order as SUCCESS and activate the plan for this user?")) {
      return
    }
    setOrderCheckingId(orderId)
    try {
      const res = await fetch("/api/admin/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "MANUAL_APPROVE" }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Order approved and plan activated!")
        loadData()
      } else {
        toast.error(json.error || "Failed to approve order")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setOrderCheckingId(null)
    }
  }

  // If still checking auth
  if (authenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b12] text-amber-400">
        <RefreshCwIcon className="size-8 animate-spin" />
      </div>
    )
  }

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b12] p-4 font-sans text-slate-100">
        <div className="w-full max-w-sm rounded-3xl bg-[#0f172a] p-7 shadow-2xl border border-amber-500/30">
          <div className="flex items-center justify-center gap-3">
            <div className="relative size-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="flex size-full items-center justify-center rounded-[14px] bg-[#0f172a]">
                <ShieldCheckIcon className="size-6 text-amber-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">PaisaX Admin</h1>
              <p className="text-xs text-amber-400/80 font-medium">Control & Management Panel</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Admin Security Password / PIN
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-2xl bg-slate-900/90 border border-slate-700 px-4 py-3 text-sm font-bold text-white placeholder-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                autoFocus
              />
            </div>

            {loginError && (
              <p className="text-xs font-semibold text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-800/50">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loginLoading ? (
                <RefreshCwIcon className="size-4 animate-spin text-slate-950" />
              ) : (
                <span>Unlock Admin Dashboard</span>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── DASHBOARD SCREEN ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 font-sans pb-16">
      
      {/* ── TOP NAV BAR ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0b111e]/95 backdrop-blur-md px-4 py-3.5 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="relative size-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 p-0.5 shadow-md shadow-amber-500/20">
              <div className="flex size-full items-center justify-center rounded-[10px] bg-[#0f172a]">
                <ShieldCheckIcon className="size-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight sm:text-lg">
                  PaisaX Admin Console
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 border border-emerald-600/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live DB
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                User Management, Paid Plans & Bank Withdrawals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              title="Refresh Data"
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCwIcon className={cn("size-3.5", loading && "animate-spin text-amber-400")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all active:scale-95"
            >
              <ExternalLinkIcon className="size-3.5" />
              <span className="hidden sm:inline">Open App</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="flex items-center gap-1.5 rounded-xl bg-red-950/40 border border-red-800/40 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-900/60 transition-all active:scale-95 cursor-pointer"
            >
              <LogOutIcon className="size-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        
        {/* ── 5 KPI STATS CARDS ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
          
          {/* Total Users */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0e1726] p-4 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">Total Users</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                <UsersIcon className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-white sm:text-3xl">
              {data?.stats?.totalUsers ?? "..."}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">
              Registered mobile accounts
            </p>
          </div>

          {/* Paid Plan Users */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0e1726] p-4 border border-amber-500/30 shadow-lg shadow-amber-500/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400">Paid Plan Users</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                <ZapIcon className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-amber-400 sm:text-3xl">
              {data?.stats?.paidUsersCount ?? "..."}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">
              Active solar investors
            </p>
          </div>

          {/* Total Deposits */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0e1726] p-4 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400">Confirmed Deposits</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <BanknoteIcon className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-400 sm:text-3xl">
              ₹{Number(data?.stats?.totalDeposits ?? 0).toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">
              Total plan purchases
            </p>
          </div>

          {/* Referral Commissions Paid */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0e1726] p-4 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300">Referral Paid</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                <Share2Icon className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-amber-300 sm:text-3xl">
              ₹{Number(data?.stats?.totalCommissionsPaid ?? 0).toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">
              {data?.stats?.totalCommissionsCount ?? 0} paid across 3 tiers
            </p>
          </div>

          {/* Pending Withdrawals */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0e1726] p-4 border border-slate-800 shadow-lg col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-400">Pending Withdrawals</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
                <ClockIcon className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-rose-400 sm:text-3xl">
              {data?.stats?.pendingWithdrawalsCount ?? 0}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                (₹{Number(data?.stats?.pendingWithdrawalsAmount ?? 0).toLocaleString("en-IN")})
              </span>
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">
              Awaiting bank transfer
            </p>
          </div>

        </div>

        {/* ── SEARCH & TABS BAR ──────────────────────────────────────────────── */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === "users"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
              )}
            >
              <UsersIcon className="size-3.5" />
              <span>All Users & Numbers ({data?.users?.length ?? 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("paid")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === "paid"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
              )}
            >
              <ZapIcon className="size-3.5" />
              <span>Paid Plan Users ({data?.paidUsers?.length ?? 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === "orders"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
              )}
            >
              <BanknoteIcon className="size-3.5" />
              <span>
                Deposits / Orders ({data?.orders?.length ?? 0})
                {(data?.orders?.filter((o) => o.status === "SUCCESS").length ?? 0) > 0 && (
                  <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-300 font-extrabold">
                    {data?.orders?.filter((o) => o.status === "SUCCESS").length} Paid
                  </span>
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("commissions")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === "commissions"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
              )}
            >
              <Share2Icon className="size-3.5" />
              <span>
                3-Level Commissions ({data?.commissions?.length ?? 0})
                {(data?.stats?.totalCommissionsPaid ?? 0) > 0 && (
                  <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-300 font-extrabold">
                    ₹{Number(data?.stats?.totalCommissionsPaid ?? 0).toLocaleString("en-IN")}
                  </span>
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("withdrawals")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === "withdrawals"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
              )}
            >
              <CreditCardIcon className="size-3.5" />
              <span>
                Withdrawals ({data?.withdrawals?.length ?? 0})
                {(data?.stats?.pendingWithdrawalsCount ?? 0) > 0 && (
                  <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] text-white font-extrabold">
                    {data?.stats?.pendingWithdrawalsCount}
                  </span>
                )}
              </span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[260px] sm:w-72">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by phone, name..."
              className="w-full rounded-xl bg-slate-900/90 border border-slate-800 pl-9 pr-3.5 py-2 text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-amber-500 transition-all"
            />
          </div>

        </div>

        {/* ── TAB 1: ALL USERS & PHONE NUMBERS ──────────────────────────────── */}
        {activeTab === "users" && (
          <div className="mt-4">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h2 className="text-sm font-black text-white">
                  Registered Users & Mobile Numbers ({filteredUsers.length})
                </h2>
                <p className="text-[11px] text-slate-400">
                  Every user with their phone number, registration date, and investment status
                </p>
              </div>

              <button
                type="button"
                onClick={copyAllPhones}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
              >
                {copiedKey === "all_phones" ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
                <span>Copy All Numbers</span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0c121e] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Mobile Number</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Invite Code</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Balance</th>
                      <th className="py-3 px-4">Joined Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          No users found matching your search
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, i) => (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-slate-500">{i + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-300 text-[13px]">
                                {u.phone}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(u.phone, `phone_${u.id}`, "Phone")}
                                title="Copy Phone Number"
                                className="text-slate-500 hover:text-amber-400 p-0.5 cursor-pointer"
                              >
                                {copiedKey === `phone_${u.id}` ? (
                                  <CheckIcon className="size-3 text-emerald-400" />
                                ) : (
                                  <CopyIcon className="size-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            <span className="font-bold text-amber-200">{u.inviteCode}</span>
                            {u.invitedBy ? (
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">
                                via: <strong className="text-slate-300">{u.inviterName || "Partner"}</strong> {u.inviterPhone ? `(${u.inviterPhone.slice(-4)})` : ""}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-600 block mt-0.5 font-sans">
                                Direct Registration
                              </span>
                            )}
                            {(u.directInvitesCount ?? 0) > 0 && (
                              <span className="text-[10px] font-bold text-emerald-400 block mt-0.5 font-sans">
                                Team: {u.directInvitesCount} invited
                              </span>
                            )}
                            {(u.totalCommissionEarned ?? 0) > 0 && (
                              <span className="text-[10px] font-black text-amber-300 block font-sans">
                                Earned: ₹{Number(u.totalCommissionEarned).toLocaleString("en-IN")}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {u.hasPaidPlan ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-400">
                                <ZapIcon className="size-3" />
                                Paid Plan ({u.paidPlansCount})
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">
                                Free User
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-400 font-mono">
                            ₹{u.coins.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {new Date(u.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <a
                              href={`tel:${u.phone}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white"
                            >
                              <PhoneIcon className="size-3" />
                              <span>Call</span>
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: PAID PLAN USERS ────────────────────────────────────────── */}
        {activeTab === "paid" && (
          <div className="mt-4">
            <div className="pb-3">
              <h2 className="text-sm font-black text-amber-400">
                Paid Plan Investors ({filteredPaidUsers.length} Users)
              </h2>
              <p className="text-[11px] text-slate-400">
                List of users who have purchased paid solar plans with their active plans & details
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPaidUsers.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-slate-800 bg-[#0c121e] p-8 text-center text-slate-500">
                  No paid plan users found
                </div>
              ) : (
                filteredPaidUsers.map((u) => (
                  <div
                    key={u.userId}
                    className="rounded-2xl border border-amber-500/30 bg-[#0c121e] p-4 shadow-lg shadow-amber-500/5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-white text-sm">{u.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-xs font-bold text-amber-300">
                              {u.phone}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(u.phone, `p_phone_${u.userId}`, "Phone")}
                              className="text-slate-500 hover:text-amber-400 cursor-pointer"
                            >
                              <CopyIcon className="size-3" />
                            </button>
                          </div>
                        </div>

                        <span className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border",
                          (u.depositCount ?? 1) > 1
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                            : "bg-amber-500/15 border-amber-500/40 text-amber-400"
                        )}>
                          {(u.depositCount ?? 1) > 1 ? `${u.depositCount} Deposits` : "Active Investor"}
                        </span>
                      </div>

                      {/* User Investment Summary */}
                      <div className="mt-3 rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Total Deposited</span>
                          <span className="font-mono font-black text-emerald-400 text-sm">
                            ₹{(u.totalDeposits || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] block">Active Plans</span>
                          <span className="font-bold text-amber-300">
                            {u.ownedPlans?.length || 0} {u.ownedPlans?.length === 1 ? "Plan" : "Plans"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Purchased Solar Plans:
                        </p>
                        {u.ownedPlans?.length > 0 ? (
                          u.ownedPlans.map((p, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl bg-slate-900/95 border border-slate-800/80 p-3 space-y-1.5 text-xs shadow-xs"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div>
                                  <p className="font-bold text-white text-xs">{p.planName}</p>
                                  <p className="text-[10px] text-slate-400">
                                    {p.days || 60} Days Plan • Return: ₹{(p.totalReturn || (p.perDay * (p.days || 60))).toLocaleString("en-IN")}
                                  </p>
                                </div>
                                <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-black text-emerald-300 font-mono shrink-0">
                                  ₹{(p.cost || 0).toLocaleString("en-IN")}
                                </span>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                                <span className="text-emerald-400 font-bold">
                                  Daily: ₹{p.perDay} / day
                                </span>
                                <span className="font-mono text-slate-400 text-[10px]">
                                  Day {p.claimed} / {p.days || 60}
                                </span>
                              </div>

                              {p.boughtAt && (
                                <p className="text-[10px] text-slate-500 font-mono">
                                  Purchased: {new Date(p.boughtAt).toLocaleString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">Plan activated via gateway order</p>
                        )}
                      </div>

                      {/* Saved Bank Details if available */}
                      {u.bankAccountNumber && (
                        <div className="mt-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 p-2 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Building2Icon className="size-3.5 text-emerald-400 shrink-0" />
                            <span className="text-[11px] text-slate-300 font-mono truncate">
                              {u.bankName ? `${u.bankName} · ` : ""}•••• {u.bankAccountNumber.slice(-4)} ({u.bankIfsc})
                            </span>
                          </div>
                          <span className="text-[9px] text-emerald-400 font-extrabold uppercase shrink-0 ml-1">
                            Saved Bank
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Current Balance</span>
                        <span className="font-bold font-mono text-emerald-400 text-sm">
                          ₹{u.coins.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <a
                        href={`tel:${u.phone}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-all"
                      >
                        <PhoneIcon className="size-3" />
                        <span>Call Investor</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: WITHDRAWAL REQUESTS & BANK DETAILS ──────────────────────── */}
        {activeTab === "withdrawals" && (
          <div className="mt-4">
            
            {/* Filter buttons */}
            <div className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-black text-white">
                  Bank Withdrawal Requests & Account Details ({filteredWithdrawals.length})
                </h2>
                <p className="text-[11px] text-slate-400">
                  Direct Bank transfer details: Account Holder, Account Number, IFSC & Net Payout
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setWithdrawalFilter(filter)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer",
                      withdrawalFilter === filter
                        ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    )}
                  >
                    {filter === "ALL" ? "All" : filter.charAt(0) + filter.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Withdrawals list */}
            <div className="space-y-3">
              {filteredWithdrawals.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-8 text-center text-slate-500">
                  No withdrawal requests found
                </div>
              ) : (
                filteredWithdrawals.map((w) => {
                  const isPending = w.status === "PENDING"
                  const isApproved = w.status === "APPROVED" || w.status === "PAID"
                  const isRejected = w.status === "REJECTED"

                  return (
                    <div
                      key={w.id}
                      className={cn(
                        "rounded-2xl border bg-[#0c121e] p-4 shadow-lg transition-all",
                        isPending ? "border-amber-500/40" : "border-slate-800/80"
                      )}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        
                        {/* User & Amount */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-400">{w.id}</span>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                                isPending && "bg-amber-500/15 border border-amber-500/40 text-amber-400",
                                isApproved && "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400",
                                isRejected && "bg-red-500/15 border border-red-500/40 text-red-400"
                              )}
                            >
                              {w.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <p className="text-base font-black text-white">{w.userName}</p>
                            <span className="font-mono font-bold text-amber-300 text-sm">
                              {w.userPhone}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(w.userPhone, `w_phone_${w.id}`, "User Phone")}
                              title="Copy Phone"
                              className="text-slate-500 hover:text-amber-400 cursor-pointer"
                            >
                              <CopyIcon className="size-3" />
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-400">
                            Requested on:{" "}
                            {new Date(w.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </p>
                        </div>

                        {/* Bank Details Box */}
                        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 sm:min-w-[320px]">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1.5">
                            <Building2Icon className="size-4" />
                            <span>Bank Account Details</span>
                          </div>

                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-400 text-[11px]">Account Holder:</span>
                              <span className="font-bold text-white">{w.accountName}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[11px]">Account No:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-black text-amber-300">
                                  {w.accountNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(w.accountNumber, `acc_${w.id}`, "Account Number")}
                                  title="Copy Account Number"
                                  className="text-slate-500 hover:text-amber-400 cursor-pointer"
                                >
                                  {copiedKey === `acc_${w.id}` ? (
                                    <CheckIcon className="size-3 text-emerald-400" />
                                  ) : (
                                    <CopyIcon className="size-3" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[11px]">IFSC Code:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-white uppercase">
                                  {w.ifscCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(w.ifscCode, `ifsc_${w.id}`, "IFSC Code")}
                                  title="Copy IFSC Code"
                                  className="text-slate-500 hover:text-amber-400 cursor-pointer"
                                >
                                  {copiedKey === `ifsc_${w.id}` ? (
                                    <CheckIcon className="size-3 text-emerald-400" />
                                  ) : (
                                    <CopyIcon className="size-3" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {w.bankName && (
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-400">Bank:</span>
                                <span className="text-slate-300 font-semibold">{w.bankName}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Amount & Action Buttons */}
                        <div className="flex flex-col sm:items-end justify-between gap-3">
                          <div className="sm:text-right">
                            <span className="text-[10px] text-slate-400 block">Net Payout to Transfer:</span>
                            <span className="text-xl font-black text-emerald-400 font-mono">
                              ₹{w.netAmount.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              (Requested: ₹{w.amount} - Fee 3%: ₹{w.fee})
                            </span>
                          </div>

                          {isPending ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedWithdrawal(w)
                                  setActionType("APPROVE")
                                  setActionUtr("")
                                  setActionNote("")
                                }}
                                className="rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-md hover:bg-emerald-400 active:scale-95 transition-all cursor-pointer"
                              >
                                Approve / Paid
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedWithdrawal(w)
                                  setActionType("REJECT")
                                  setActionUtr("")
                                  setActionNote("")
                                }}
                                className="rounded-xl bg-red-950/60 border border-red-800/60 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-900/60 active:scale-95 transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="text-right">
                              {w.utr && (
                                <p className="text-[11px] font-mono text-slate-300">
                                  UTR: <span className="text-amber-300">{w.utr}</span>
                                </p>
                              )}
                              {w.adminNote && (
                                <p className="text-[10px] text-slate-400 italic">{w.adminNote}</p>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  )
                })
              )}
            </div>

          </div>
        )}

        {/* ── TAB 4: DEPOSITS & RECHARGE ORDERS ─────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="mt-4">
            
            {/* Header and filters */}
            <div className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-black text-white">
                  Plan Deposits & Recharge Orders ({filteredOrders.length})
                </h2>
                <p className="text-[11px] text-slate-400">
                  Track all gateway orders, verify live AeroPay payment status, and manually activate plans
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {(["ALL", "SUCCESS", "PENDING", "FAILED"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setOrderFilter(filter)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer",
                      orderFilter === filter
                        ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    )}
                  >
                    {filter === "ALL" ? "All" : filter.charAt(0) + filter.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c121e] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Investor / Phone</th>
                      <th className="py-3 px-4">Plan Name</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">UTR / Gateway Ref</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500">
                          No deposit orders found matching your search
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o, i) => {
                        const isSuccess = o.status === "SUCCESS"
                        const isPending = o.status === "PENDING"
                        const isFailed = o.status === "FAILED"
                        const isChecking = orderCheckingId === o.id

                        return (
                          <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 text-slate-500">{i + 1}</td>
                            
                            {/* Order ID */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-slate-300 text-[11px] font-bold">
                                  {o.id}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(o.id, `ord_${o.id}`, "Order ID")}
                                  className="text-slate-500 hover:text-amber-400 cursor-pointer"
                                  title="Copy Order ID"
                                >
                                  {copiedKey === `ord_${o.id}` ? (
                                    <CheckIcon className="size-3 text-emerald-400" />
                                  ) : (
                                    <CopyIcon className="size-3" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* User details */}
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-bold text-white">{o.userName}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono text-[11px] text-amber-300 font-semibold">
                                    {o.userPhone}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(o.userPhone, `ord_p_${o.id}`, "Phone")}
                                    className="text-slate-500 hover:text-amber-400 cursor-pointer"
                                  >
                                    <CopyIcon className="size-2.5" />
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Plan Name */}
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-200">
                                {o.planName}
                              </span>
                              <span className="block text-[10px] text-slate-500 font-mono">
                                id: {o.planId}
                              </span>
                            </td>

                            {/* Amount */}
                            <td className="py-3 px-4 font-mono font-black text-emerald-400 text-sm">
                              ₹{o.amount.toLocaleString("en-IN")}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                                  isSuccess && "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400",
                                  isPending && "bg-amber-500/15 border border-amber-500/40 text-amber-400 animate-pulse",
                                  isFailed && "bg-red-500/15 border border-red-500/40 text-red-400"
                                )}
                              >
                                {isSuccess && <CheckCircle2Icon className="size-3" />}
                                {isPending && <ClockIcon className="size-3" />}
                                {isFailed && <XCircleIcon className="size-3" />}
                                {o.status}
                              </span>
                            </td>

                            {/* UTR */}
                            <td className="py-3 px-4 font-mono text-[11px]">
                              {o.txnId ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-amber-300 font-bold">{o.txnId}</span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(o.txnId!, `utr_${o.id}`, "UTR")}
                                    className="text-slate-500 hover:text-amber-400 cursor-pointer"
                                  >
                                    <CopyIcon className="size-2.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>

                            {/* Date */}
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              {new Date(o.createdAt).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Live Gateway Check */}
                                <button
                                  type="button"
                                  onClick={() => handleCheckGateway(o.id)}
                                  disabled={isChecking}
                                  title="Check Live Status with AeroPay Gateway"
                                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-bold text-amber-400 hover:bg-slate-700 hover:text-amber-300 transition-all cursor-pointer disabled:opacity-50"
                                >
                                  {isChecking ? (
                                    <RefreshCwIcon className="size-3 animate-spin" />
                                  ) : (
                                    <RefreshCwIcon className="size-3" />
                                  )}
                                  <span>Check Gateway</span>
                                </button>

                                {/* Manual Activate Plan button if not already success */}
                                {!isSuccess && (
                                  <button
                                    type="button"
                                    onClick={() => handleManualApproveOrder(o.id)}
                                    disabled={isChecking}
                                    title="Manually Activate Plan for this User"
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    <CheckIcon className="size-3" />
                                    <span>Activate</span>
                                  </button>
                                )}
                              </div>
                            </td>

                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 5: 3-LEVEL REFERRAL COMMISSIONS ───────────────────────────── */}
        {activeTab === "commissions" && (
          <div className="mt-4">
            
            {/* Header & Tier Filters */}
            <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <span>3-Level Referral Commissions Log ({filteredCommissions.length})</span>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-black text-emerald-300 font-mono">
                    ₹{Number(data?.stats?.totalCommissionsPaid ?? 0).toLocaleString("en-IN")} Total Paid
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Complete audit trail: Level 1 (10%), Level 2 (3%), and Level 3 (1.5%) automated distributions
                </p>
              </div>

              {/* Tier Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(
                  [
                    { key: "ALL", label: `All Tiers (${data?.commissions?.length ?? 0})` },
                    { key: "1", label: `L1 (10%) · ${data?.commissions?.filter((c) => c.level === 1).length ?? 0}` },
                    { key: "2", label: `L2 (3%) · ${data?.commissions?.filter((c) => c.level === 2).length ?? 0}` },
                    { key: "3", label: `L3 (1.5%) · ${data?.commissions?.filter((c) => c.level === 3).length ?? 0}` },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setCommissionFilter(f.key)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                      commissionFilter === f.key
                        ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Commissions Table */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c121e] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Recipient (Earner)</th>
                      <th className="py-3 px-4">Tier / Rate</th>
                      <th className="py-3 px-4">Payer (Buyer)</th>
                      <th className="py-3 px-4">Order Amount</th>
                      <th className="py-3 px-4">Commission Paid</th>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Credited At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredCommissions.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-500">
                          <Share2Icon className="size-8 mx-auto text-slate-600 mb-2" />
                          <p className="font-bold text-slate-400">No referral commission records found</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Commissions generate automatically when users register via invite link and purchase a paid plan.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredCommissions.map((c, i) => (
                        <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-slate-500">{i + 1}</td>

                          {/* Recipient */}
                          <td className="py-3 px-4">
                            <p className="font-bold text-white text-xs">{c.recipientName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-bold text-amber-300 text-[11px]">
                                {c.recipientPhone}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(c.recipientPhone, `recip_${c.id}`, "Phone")}
                                className="text-slate-500 hover:text-amber-400 cursor-pointer"
                              >
                                {copiedKey === `recip_${c.id}` ? (
                                  <CheckIcon className="size-3 text-emerald-400" />
                                ) : (
                                  <CopyIcon className="size-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Tier */}
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-black border font-mono",
                                c.level === 1
                                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                                  : c.level === 2
                                  ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                                  : "bg-purple-500/15 border-purple-500/40 text-purple-300"
                              )}
                            >
                              <span>Level {c.level}</span>
                              <span className="text-[10px] opacity-80">({c.percent}%)</span>
                            </span>
                          </td>

                          {/* Payer */}
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-200 text-xs">{c.payerName}</p>
                            <span className="font-mono text-[11px] text-slate-400">
                              {c.payerPhone}
                            </span>
                          </td>

                          {/* Order Amount */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-300">
                            ₹{Number(c.orderAmount).toLocaleString("en-IN")}
                          </td>

                          {/* Commission Paid */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-black text-emerald-400 text-sm">
                              +₹{Number(c.commissionAmount).toLocaleString("en-IN")}
                            </span>
                          </td>

                          {/* Order ID */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                              <span className="truncate max-w-[120px]">{c.orderId}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(c.orderId, `ord_${c.id}`, "Order ID")}
                                className="text-slate-500 hover:text-amber-400 cursor-pointer shrink-0"
                              >
                                <CopyIcon className="size-2.5" />
                              </button>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400">
                              <CheckCircle2Icon className="size-3 text-emerald-400" />
                              <span>PAID</span>
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {new Date(c.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ── APPROVE / REJECT CONFIRMATION MODAL ─────────────────────────────── */}
      {selectedWithdrawal && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#0f172a] p-6 shadow-2xl border border-slate-700">
            <h3 className="text-lg font-black text-white">
              {actionType === "APPROVE" ? "Confirm Payout Approval" : "Reject Withdrawal Request"}
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              User: <strong className="text-white">{selectedWithdrawal.userName}</strong> ({selectedWithdrawal.userPhone})
            </p>

            <div className="mt-4 rounded-2xl bg-slate-900 p-3.5 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Net Amount:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  ₹{selectedWithdrawal.netAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account:</span>
                <span className="font-mono font-bold text-amber-300">
                  {selectedWithdrawal.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IFSC:</span>
                <span className="font-mono font-bold text-white uppercase">
                  {selectedWithdrawal.ifscCode}
                </span>
              </div>
            </div>

            {actionType === "APPROVE" ? (
              <div className="mt-4">
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Bank UTR / Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  value={actionUtr}
                  onChange={(e) => setActionUtr(e.target.value)}
                  placeholder="e.g. IMPS428190381029"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-500 outline-none focus:border-amber-500"
                />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Rejection Reason / Admin Note
                  </label>
                  <input
                    type="text"
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="e.g. Invalid bank details / account mismatch"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-red-500"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={actionRefund}
                    onChange={(e) => setActionRefund(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Refund ₹{selectedWithdrawal.amount} coins back to user's wallet</span>
                </label>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedWithdrawal(null)
                  setActionType(null)
                }}
                disabled={actionSubmitting}
                className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateWithdrawalStatus}
                disabled={actionSubmitting}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-xs font-black text-slate-950 transition-all cursor-pointer",
                  actionType === "APPROVE"
                    ? "bg-emerald-400 hover:bg-emerald-300"
                    : "bg-red-500 hover:bg-red-400 text-white"
                )}
              >
                {actionSubmitting ? (
                  <RefreshCwIcon className="size-4 animate-spin text-slate-950" />
                ) : actionType === "APPROVE" ? (
                  "Confirm Approval"
                ) : (
                  "Confirm Rejection"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
