"use client"

import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function Topbar() {
  const { data: session } = useSession()

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="md:hidden flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C47FF]">
          <span className="text-sm font-bold text-white">N</span>
        </div>
        <span className="text-lg font-bold text-[#1a1a2e]">Noema</span>
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
