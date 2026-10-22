"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { ChevronLeftIcon, ClipboardCheckIcon, HouseIcon, LayersIcon, WalletIcon } from "lucide-react"
import { LevelUp } from "@/components/level-up"
import { Avatar, Logo } from "@/components/marks"
import "@/lib/install" // starts listening for the install prompt as early as possible
import { avatarOf, useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/", label: "Home", icon: HouseIcon },
  { href: "/plans", label: "Plans", icon: LayersIcon },
  { href: "/my-plans", label: "My Plans", icon: ClipboardCheckIcon },
  { href: "/wallet", label: "Wallet", icon: WalletIcon },
]

/** Screens outside the tab bar get a back arrow and a title instead of the logo. */
const SUB_PAGES: Record<string, string> = { "/profile": "Profile", "/refer": "Invite friends" }

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
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background md:shadow-[0_0_0_1px_#e4e6f5,0_24px_64px_-24px_rgb(19_27_46/0.18)]">
      <header className="sticky top-0 z-40 border-b border-border bg-white pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center justify-between px-4">
          {title ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Back"
                onClick={() => (history.length > 1 ? router.back() : router.push("/"))}
                className="-ml-2 flex size-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-high"
              >
                <ChevronLeftIcon className="size-5" />
              </button>
              <h1 className="text-headline-sm text-on-surface">{title}</h1>
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <Logo className="size-9" />
              <span className="text-lg font-bold tracking-tight text-on-surface">PaisaX</span>
            </Link>
          )}
          <Link href="/profile" aria-label="Profile" aria-current={path === "/profile" ? "page" : undefined} className="flex size-10 items-center justify-center rounded-full hover:bg-surface-low">
            <Avatar src={avatarOf(user)} className="size-9" />
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 pt-3 pb-[calc(6rem+env(safe-area-inset-bottom))]">{children}</main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-white/85 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.05)] backdrop-blur-xl"
      >
        <ul className="grid h-16 grid-cols-4">
          {TABS.map(({ href, label, icon: Icon }) => {
            const on = href === "/" ? path === "/" : path.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={cn("flex h-full flex-col items-center justify-center gap-1 text-label-sm text-on-variant select-none", on && "text-primary")}
                >
                  <span className={cn("flex h-8 w-12 items-center justify-center rounded-full transition-colors", on && "bg-primary-fixed")}>
                    <Icon className="size-[22px]" strokeWidth={on ? 2.25 : 1.75} aria-hidden />
                  </span>
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <LevelUp />
    </div>
  )
}
