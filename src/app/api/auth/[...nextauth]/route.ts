import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"

const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "https://noema-woad.vercel.app"

async function refreshAccessToken(token: any) {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("[NextAuth] Token refresh failed:", data)
      return { ...token, error: "RefreshAccessTokenError" }
    }

    console.log("[NextAuth] Token refreshed successfully")
    return {
      ...token,
      accessToken: data.access_token,
      accessTokenExpires: Date.now() + (data.expires_in ?? 3600) * 1000,
      // Google only returns a new refresh_token if the user re-consents
      refreshToken: data.refresh_token ?? token.refreshToken,
    }
  } catch (err) {
    console.error("[NextAuth] Token refresh error:", err)
    return { ...token, error: "RefreshAccessTokenError" }
  }
}

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
      // First login — save tokens and expiration
      if (account && profile) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.accessTokenExpires = Date.now() + (account.expires_in ?? 3600) * 1000
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

        return token
      }

      // Token still valid — return as-is (with 5min buffer)
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires - 5 * 60 * 1000) {
        return token
      }

      // Token expired — refresh it
      if (token.refreshToken) {
        return refreshAccessToken(token)
      }

      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      session.accessToken = token.accessToken
      session.googleId = token.googleId
      session.error = token.error
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
