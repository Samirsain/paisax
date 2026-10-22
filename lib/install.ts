"use client"

import { useSyncExternalStore } from "react"

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

// The browser fires this once, often before the Profile screen exists, so it is caught at import time.
let deferred: InstallPrompt | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

if (typeof window !== "undefined") {
  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault()
    deferred = e as InstallPrompt
    emit()
  })
  addEventListener("appinstalled", () => {
    deferred = null
    emit()
  })
}

const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l))

/** "installed", "prompt" (Chrome/Edge/Android can install in one tap), "ios" (Share › Add to Home Screen) or "manual". */
export function useInstall() {
  const prompt = useSyncExternalStore(subscribe, () => deferred, () => null)
  const standalone = typeof window !== "undefined" && (matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true)
  const ios = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent)
  const status = standalone ? "installed" : prompt ? "prompt" : ios ? "ios" : "manual"
  return {
    status,
    install: async () => {
      if (!prompt) return
      await prompt.prompt()
      await prompt.userChoice
      deferred = null
      emit()
    },
  } as const
}
