import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import AdminSidebar from "./sidebar"

export default async function AdminGatedLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login")
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  )
}
