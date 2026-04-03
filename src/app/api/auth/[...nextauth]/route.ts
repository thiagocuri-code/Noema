import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"

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
    async jwt({ token, account, profile }: { token: any; account: any; profile?: any }) {
      if (account && profile) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.googleId = account.providerAccountId

        // Upsert student in DB (fire-and-forget — don't block login on DB errors)
        try {
          await prisma.student.upsert({
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
          })
        } catch (err) {
          console.error("[NextAuth] DB upsert failed:", err)
        }
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      session.accessToken = token.accessToken
      session.googleId = token.googleId
      return session
    },
  },
  session: { strategy: "jwt" as const },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
