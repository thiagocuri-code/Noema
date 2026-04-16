import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ADMIN_COOKIE, ADMIN_COOKIE_VALUE, getAdminPassword } from "@/lib/admin-auth"

export async function POST(req: Request) {
  const { password } = await req.json()
  if (password !== getAdminPassword()) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const store = await cookies()
  store.set(ADMIN_COOKIE, ADMIN_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const store = await cookies()
  store.delete(ADMIN_COOKIE)
  return NextResponse.json({ ok: true })
}
