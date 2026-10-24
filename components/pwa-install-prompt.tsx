"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { DownloadIcon, XIcon, ShareIcon, PlusSquareIcon, CheckCircle2Icon, SparklesIcon } from "lucide-react"
import { useInstall } from "@/lib/install"

export function PwaInstallPrompt() {
  const { status, install } = useInstall()
  const [visible, setVisible] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    // If already installed, never show
    if (status === "installed") return

    // Check if dismissed recently (cooldown: 24h)
    try {
      const dismissed = localStorage.getItem("paisax_pwa_dismissed_at")
      if (dismissed) {
        const passed = Date.now() - parseInt(dismissed, 10)
        if (passed < 24 * 60 * 60 * 1000) return
      }
    } catch {}

    // Pop up nicely after 2 seconds
    const timer = setTimeout(() => {
      setVisible(true)
    }, 2200)

    return () => clearTimeout(timer)
  }, [status])

  const handleDismiss = () => {
    setVisible(false)
    setShowGuide(false)
    try {
      localStorage.setItem("paisax_pwa_dismissed_at", Date.now().toString())
    } catch {}
  }

  const handleInstall = async () => {
    if (status === "prompt") {
      try {
        await install()
        setVisible(false)
      } catch {}
    } else {
      setShowGuide(true)
    }
  }

  if (!visible || status === "installed") return null

  return (
    <div className="fixed bottom-20 left-3.5 right-3.5 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-sm mx-auto sm:mx-0 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-[#14100b]/95 border border-amber-500/35 p-3.5 shadow-[0_18px_45px_rgba(0,0,0,0.9),0_0_25px_rgba(217,119,6,0.2)] backdrop-blur-xl">
        
        {/* Ambient golden glow behind card */}
        <div className="absolute -top-10 -right-10 size-32 rounded-full bg-amber-500/12 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close"
          className="absolute top-2.5 right-2.5 flex size-6 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <XIcon className="size-3.5" />
        </button>

        {!showGuide ? (
          /* Main Minimal Install Card */
          <div className="flex items-center gap-3 pr-5">
            {/* App Logo */}
            <div className="relative size-12 shrink-0 rounded-xl overflow-hidden border border-amber-400/50 bg-[#0B0A08] shadow-[0_4px_14px_rgba(0,0,0,0.7),0_0_12px_rgba(217,119,6,0.3)] p-0.5">
              <Image
                src="/icon-192.png"
                alt="PaisaX App Logo"
                width={48}
                height={48}
                className="size-full object-cover rounded-lg"
              />
            </div>

            {/* App Details & CTA */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white tracking-tight truncate">PaisaX Solar</h4>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/20 shrink-0">
                  <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
                  App
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight truncate mt-0.5">
                Install app for 1-tap daily income
              </p>

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-amber-600/30 active:scale-95 hover:opacity-95 transition-all cursor-pointer"
                >
                  <DownloadIcon className="size-3.5" strokeWidth={2.2} />
                  <span>Install App</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 px-1 py-1 cursor-pointer transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Step-by-Step Install Guide for iOS / Manual Browsers */
          <div className="pr-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative size-8 shrink-0 rounded-lg overflow-hidden border border-amber-400/40 bg-[#0B0A08]">
                <Image
                  src="/icon-192.png"
                  alt="PaisaX App Logo"
                  width={32}
                  height={32}
                  className="size-full object-cover rounded-md"
                />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {status === "ios" ? "Install on iPhone / iPad" : "Add to Phone"}
                </h4>
                <p className="text-[10px] text-zinc-400">Takes less than 5 seconds</p>
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-[11px] text-zinc-300 space-y-2">
              {status === "ios" ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">1</span>
                    <span>Tap the Safari <strong className="text-white">Share</strong> icon <ShareIcon className="inline size-3.5 text-sky-400 ml-0.5" /></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">2</span>
                    <span>Scroll down and tap <strong className="text-white">Add to Home Screen</strong> <PlusSquareIcon className="inline size-3.5 text-amber-400 ml-0.5" /></span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">1</span>
                  <span>Tap browser menu (⋮) and click <strong className="text-white">Install App</strong> or <strong className="text-white">Add to Home Screen</strong></span>
                </div>
              )}
            </div>

            <div className="mt-2.5 flex justify-end">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
