import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"

const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "https://noema-woad.vercel.app"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
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
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }: { account: any; profile?: any }) {
      console.log("[NextAuth] signIn callback", { provider: account?.provider, email: profile?.email })
      return true
    },
    async jwt({ token, account, profile }: { token: any; account: any; profile?: any }) {
      if (account && profile) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.googleId = account.providerAccountId

        // Fire-and-forget DB upsert — never block login
        prisma.student.upsert({
          where: { googleId: account.providerAccountId },
          update: {
            name: profile.name ?? "",
            image: profile.picture ?? null,
          },
          create: {
            googleId: account.providerAccountId,
            name: profile.name ?? "",
            email: profile.email ?? "",
            image: profile.picture ?? null,
          },
        }).catch(err => console.error("[NextAuth] DB upsert failed:", err))
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      session.accessToken = token.accessToken
      session.googleId = token.googleId
      return session
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Ensure redirects stay on our domain
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  logger: {
    error(code: any, metadata: any) {
      console.error("[NextAuth] ERROR", code, JSON.stringify(metadata, null, 2))
    },
    warn(code: any) {
      console.warn("[NextAuth] WARN", code)
    },
  },
  session: { strategy: "jwt" as const },
  pages: { signIn: "/login", error: "/error" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
