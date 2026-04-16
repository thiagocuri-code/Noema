const EDU_PATTERN = /@[^@]*edu/i

export function isEduEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return EDU_PATTERN.test(email)
}

export function eduEmailWhereSQL(column = "email"): string {
  return `${column} ~* '@[^@]*edu'`
}
