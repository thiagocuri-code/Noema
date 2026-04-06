import type { Metadata } from "next"
import { Open_Sans, Nunito } from "next/font/google"
import "./globals.css"

const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-sans" })
const nunito = Nunito({ subsets: ["latin"], variable: "--font-heading" })

export const metadata: Metadata = {
  title: "athena — understand the how, not just what",
  description: "Plataforma de IA educacional ética.",
  verification: {
    google: "W2-at-f5XzdUlTtDXg1QFl4q8J7v3YETTWPOcUfsh8s",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${openSans.variable} ${nunito.variable} h-full`}>
      <body className="min-h-full bg-white text-[#1a1a2e] antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
