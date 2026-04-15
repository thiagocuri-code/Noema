// Returns a Google OAuth URL that requests Classroom + Drive scopes incrementally.
// The user is redirected here when their current token lacks Classroom access.

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const baseUrl = process.env.NEXTAUTH_URL || "https://noema-woad.vercel.app"

  if (!clientId) {
    return Response.json({ error: "GOOGLE_CLIENT_ID not configured" }, { status: 500 })
  }

  const scopes = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me",
    "https://www.googleapis.com/auth/classroom.coursework.students",
    "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
    "https://www.googleapis.com/auth/classroom.announcements.readonly",
    "https://www.googleapis.com/auth/classroom.rosters.readonly",
    "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
  ]

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${baseUrl}/api/auth/callback/google`,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: Buffer.from(JSON.stringify({ callbackUrl: "/dashboard/student" })).toString("base64"),
  })

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  return Response.json({ url })
}
