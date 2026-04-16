import { cookies } from "next/headers"

export const ADMIN_COOKIE = "trix_admin"
export const ADMIN_COOKIE_VALUE = "ok"

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "0000"
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies()
  return store.get(ADMIN_COOKIE)?.value === ADMIN_COOKIE_VALUE
}
