import type { Metadata } from "next"
import { Inter, Sora } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" })

export const metadata: Metadata = {
  title: "Noema — IA que ensina. Não que faz.",
  description: "Plataforma de IA educacional ética.",
  verification: {
    google: "W2-at-f5XzdUlTtDXg1QFl4q8J7v3YETTWPOcUfsh8s",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable} h-full`}>
      <body className="min-h-full bg-[#F8F7FF] text-[#1a1a2e] antialiased">
        {children}
      </body>
    </html>
  )
}
