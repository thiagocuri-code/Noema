"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LotusLogo } from "@/components/shared/lotus-logo"

const studentLinks = [
  { href: "/dashboard/student", label: "Minhas Turmas", icon: "📚" },
]

const teacherLinks = [
  { href: "/dashboard/teacher", label: "Painel do Professor", icon: "👨‍🏫" },
]

const adminLinks = [
  { href: "/dashboard/admin", label: "Relatórios", icon: "📊" },
]

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()

  const links =
    role === "ADMIN"
      ? [...studentLinks, ...teacherLinks, ...adminLinks]
      : role === "TEACHER"
        ? [...studentLinks, ...teacherLinks]
        : studentLinks

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-[#E5E7EB] bg-white">
      <div className="flex py-4 items-center px-6 border-b border-[#E5E7EB]">
        <LotusLogo variant="full" size="md" />
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === link.href || pathname.startsWith(link.href + "/")
                ? "bg-[#0a1a4a]/10 text-[#0a1a4a] font-medium"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
