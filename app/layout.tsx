import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display, DM_Sans } from "next/font/google"
import { AppShell } from "@/components/app-shell"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/lib/auth"
import "./globals.css"

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] })
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] })
const dmSans = DM_Sans({ variable: "--font-dm", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PaisaX · Daily Earning Game",
  description: "Subscribe to plans, earn daily returns for 30 days. Jio, Airtel, Tata, Tesla – choose your earning plan.",
  applicationName: "PaisaX",
  appleWebApp: { capable: true, title: "PaisaX", statusBarStyle: "default" },
}

export const viewport: Viewport = { themeColor: "#ffffff", viewportFit: "cover" }

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${dmSans.variable} antialiased`}>
      {/* Extensions such as ColorZilla add attributes to <body> before React loads. */}
      <body className="min-h-dvh" suppressHydrationWarning>
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
