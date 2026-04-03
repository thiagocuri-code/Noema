"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

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
    <aside className="hidden md:flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-200">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C47FF]">
          <span className="text-sm font-bold text-white">N</span>
        </div>
        <span className="text-lg font-bold text-[#1a1a2e]">Noema</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === link.href || pathname.startsWith(link.href + "/")
                ? "bg-[#6C47FF]/10 text-[#6C47FF] font-medium"
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
