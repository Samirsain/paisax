"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { ChevronLeftIcon, HouseIcon, TrendingUpIcon, UsersIcon, UserIcon } from "lucide-react"
import "@/lib/install" // starts listening for the install prompt as early as possible
import { avatarOf, useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/", label: "Home", icon: HouseIcon },
  { href: "/my-plans", label: "Income", icon: TrendingUpIcon },
  { href: "/plans", label: "Task", isCenter: true },
  { href: "/refer", label: "Team", icon: UsersIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
]

/** Screens outside the tab bar get a back arrow and a title instead of the logo. */
const SUB_PAGES: Record<string, string> = { "/profile": "Profile", "/refer": "Team & Refer", "/wallet/withdraw": "Withdrawal", "/wallet": "Recharge & Wallet" }

/** These routes are public — auth guard won't redirect here. */
const PUBLIC_PATHS = new Set(["/login", "/signup"])

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const { user, ready } = useAuth()
  const title = SUB_PAGES[path]
  const isPublic = PUBLIC_PATHS.has(path)

  // Auth guard: redirect to login if not logged in (after hydration)
  useEffect(() => {
    if (ready && !user && !isPublic) {
      router.replace("/login")
    }
  }, [ready, user, isPublic, router])

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    } else {
      navigator.serviceWorker.getRegistrations().then((all) => all.forEach((r) => r.unregister()))
    }
  }, [])

  // On public pages render bare (no shell chrome)
  if (isPublic) return <>{children}</>

  // While auth is loading, show nothing (avoids flash)
  if (!ready || !user) return null

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#faf8f4] md:shadow-[0_0_0_1px_#fde68a,0_24px_64px_-24px_rgba(217,119,6,0.18)]">
      <header className="sticky top-0 z-40 border-b border-amber-100 bg-white/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="relative flex h-14 items-center justify-between px-4">
          {title ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Back"
                onClick={() => (history.length > 1 ? router.back() : router.push("/"))}
                className="-ml-2 flex size-10 items-center justify-center rounded-full text-amber-900 hover:bg-amber-50"
              >
                <ChevronLeftIcon className="size-5" />
              </button>
              <h1 className="text-base font-bold text-slate-800">{title}</h1>
            </div>
          ) : (
            <div className="size-9" aria-hidden />
          )}

          {!title && (
            <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center py-1">
              <div className="relative h-10 w-44 sm:w-48">
                <Image
                  src="/dairymilk/logo-main/logo-main.png"
                  alt="PAISAX Solar Energy"
                  fill
                  className="object-contain object-center"
                  priority
                />
              </div>
            </Link>
          )}

          <Link href="/profile" aria-label="Profile" aria-current={path === "/profile" ? "page" : undefined} className="flex size-9 items-center justify-center rounded-full ring-2 ring-amber-400/30 overflow-hidden ml-auto">
            <Image src={avatarOf(user)} alt="avatar" width={36} height={36} className="size-full object-cover" />
          </Link>
        </div>
      </header>

      <main className="flex-1 px-3.5 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">{children}</main>

      {/* ONE SINGLE FIXED BOTTOM NAVBAR IN SOLAR YELLOW */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-white/95 pb-[env(safe-area-inset-bottom)] border-t border-amber-100 shadow-[0_-4px_24px_rgba(217,119,6,0.08)] backdrop-blur-xl"
      >
        <ul className="grid h-16 grid-cols-5 items-center">
          {TABS.map(({ href, label, icon: Icon, isCenter }) => {
            const on = href === "/" ? path === "/" : path.startsWith(href)

            if (isCenter) {
              return (
                <li key={label} className="relative flex flex-col items-center justify-center">
                  <Link
                    href={href}
                    aria-label="Task"
                    className="group -mt-6 flex flex-col items-center justify-center"
                  >
                    <div className="relative flex size-12 items-center justify-center rounded-full border-3 border-white bg-[#0f172a] shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/60 overflow-hidden group-active:scale-95 transition-all">
                      <Image
                        src="/dairymilk/logo.png"
                        alt="Task"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="mt-0.5 text-[11px] font-bold text-amber-700">
                      {label}
                    </span>
                  </Link>
                </li>
              )
            }

            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors select-none",
                    on ? "text-amber-700 font-extrabold" : "text-slate-500 hover:text-amber-600"
                  )}
                >
                  {Icon && (
                    <span className={cn("flex size-7 items-center justify-center rounded-full transition-all", on && "bg-amber-100/70")}>
                      <Icon className="size-[20px]" strokeWidth={on ? 2.5 : 1.75} aria-hidden />
                    </span>
                  )}
                  <span>{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
