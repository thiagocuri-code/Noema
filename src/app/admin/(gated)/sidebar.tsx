"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/knowledge-base", label: "Base de Conhecimento", icon: "📚" },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" })
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Noema</p>
        <p className="text-base font-bold text-[#0a1a4a]">Admin</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-[#0a1a4a] text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-[#0a1a4a]"
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <button
          onClick={handleLogout}
          className="w-full rounded-xl px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 hover:text-[#0a1a4a]"
        >
          ↪ Sair
        </button>
      </div>
    </aside>
  )
}
