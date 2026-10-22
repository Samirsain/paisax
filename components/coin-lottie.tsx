"use client"

import dynamic from "next/dynamic"

const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((m) => ({ default: m.DotLottieReact })),
  { ssr: false }
)

const COIN_LOTTIE = "https://lottie.host/2c37db57-151b-4eef-92de-a3eb6bdb8334/BWUMVeMWiN.json"

/** Coin burst Lottie — plays once then stops. Use on claim/win moments. */
export function CoinBurst({ size = 160, loop = false }: { size?: number; loop?: boolean }) {
  return (
    <DotLottieReact
      src={COIN_LOTTIE}
      autoplay
      loop={loop}
      style={{ width: size, height: size }}
    />
  )
}

/** Looping coin animation — use for idle "earn" states. */
export function CoinLoop({ size = 80 }: { size?: number }) {
  return (
    <DotLottieReact
      src={COIN_LOTTIE}
      autoplay
      loop
      style={{ width: size, height: size }}
    />
  )
}
