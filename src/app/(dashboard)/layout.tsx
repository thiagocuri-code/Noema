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
      <div className="flex min-h-screen items-center justify-center bg-[#F8F7FF]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6C47FF]">
            <span className="font-bold text-white text-lg">N</span>
          </div>
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
