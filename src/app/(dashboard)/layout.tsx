"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LangProvider } from "@/lib/lang-context"

function Guard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login")
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <img src="/athena-symbol.png" alt="athena" className="h-24 sm:h-32 object-contain" />
          <p className="text-sm text-gray-400 animate-pulse">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session) return null
  return <>{children}</>
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LangProvider>
        <Guard>{children}</Guard>
      </LangProvider>
    </SessionProvider>
  )
}
