import type { NextAuthConfig } from "next-auth";

// Kept deliberately free of providers/adapter: middleware runs on the
// Edge runtime, and the real Nodemailer provider (auth.ts) pulls in the
// actual `nodemailer` package, which needs Node's `stream` module — not
// available on Edge. This subset is all middleware needs to check "is
// there a valid session," so it's the only part middleware imports.
export const authConfig = {
  pages: {
    signIn: "/signin",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = (user as { id: string }).id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
