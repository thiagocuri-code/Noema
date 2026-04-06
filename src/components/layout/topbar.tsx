"use client"

import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AthenaLogo } from "@/components/shared/athena-logo"

export function Topbar() {
  const { data: session } = useSession()

  return (
    <header className="flex py-4 items-center justify-between border-b border-[#E5E7EB] bg-white px-6">
      <div className="md:hidden flex items-center">
        <AthenaLogo variant="symbol" size="md" />
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{session?.user?.name}</span>
        <Avatar className="h-8 w-8">
          <AvatarImage src={session?.user?.image ?? ""} />
          <AvatarFallback>
            {session?.user?.name?.charAt(0) ?? "U"}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-gray-500"
        >
          Sair
        </Button>
      </div>
    </header>
  )
}
