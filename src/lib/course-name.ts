export type ParsedCourse = {
  grade: number | null
  className: string | null
  subject: string
  subjectNormalized: string
}

export function normalizeSubject(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function parseCourseName(courseName: string): ParsedCourse {
  const trimmed = (courseName || "").trim()
  const match = trimmed.match(/^(\d)([A-Za-z])[\s\-:.]*(.*)$/)
  if (match) {
    const grade = parseInt(match[1], 10)
    const className = match[2].toUpperCase()
    const subject = (match[3] || "").trim()
    return {
      grade: grade >= 1 && grade <= 3 ? grade : null,
      className,
      subject,
      subjectNormalized: normalizeSubject(subject),
    }
  }
  return {
    grade: null,
    className: null,
    subject: trimmed,
    subjectNormalized: normalizeSubject(trimmed),
  }
}
