import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/hooks/use-auth"
import { MonitoringProvider } from "@/hooks/use-monitoring"
import { SocialPostingProvider } from "@/hooks/use-social-posting"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI Agent Dashboard",
  description: "Monitor mentions and automate replies across social platforms",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <AuthProvider>
            <MonitoringProvider>
              <SocialPostingProvider>{children}</SocialPostingProvider>
            </MonitoringProvider>
          </AuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
