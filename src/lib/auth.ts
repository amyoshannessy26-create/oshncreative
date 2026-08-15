import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/**
 * Auth.js config for sign-in only. Deliberately requests the minimal
 * `openid email profile` scope — Drive/Calendar/Xero access is a separate,
 * explicit "Connect" flow (see /api/integrations/*) whose tokens are
 * encrypted and stored in IntegrationConnection, not here. Keeps the login
 * flow simple and lets you revoke an integration without logging out.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  debug: true,
  logger: {
    error(error) {
      // Auth.js redacts error detail in its default production logs — this
      // prints the real message/stack so it's greppable in Vercel's log search.
      console.error("[auth:error]", error);
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
