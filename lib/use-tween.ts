"use client"

import { useEffect, useRef, useState } from "react"

/** Shows `value`, easing from the previous one when it changes (expo-out, instant under reduced motion). */
export function useTween(value: number, ms = 600) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const start = from.current
    if (start === value) return
    const span = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms
    const t0 = performance.now()
    let raf = requestAnimationFrame(function step(t) {
      const p = span ? Math.min(1, (t - t0) / span) : 1
      from.current = Math.round(start + (value - start) * (p === 1 ? 1 : 1 - 2 ** (-10 * p)))
      setShown(from.current)
      if (p < 1) raf = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return shown
}
