import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PaisaX · Daily Earning Game",
    short_name: "PaisaX",
    description: "Subscribe to Jio, Airtel, Tata or Tesla plans and earn daily returns for 30 days.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf8ff",
    theme_color: "#ffffff",
    categories: ["finance"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "My Plans", url: "/my-plans" },
      { name: "Wallet", url: "/wallet" },
    ],
  }
}
