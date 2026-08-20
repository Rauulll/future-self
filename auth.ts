import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

// Full config — providers + adapter live here, not in auth.config.ts,
// because this file is only ever imported from Route Handlers / Server
// Components (Node.js runtime), never from middleware. See auth.config.ts
// for why that split matters.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // The adapter is only used to store accounts + email verification
  // tokens (magic links need somewhere to persist the pending token).
  // Sessions themselves use JWTs (see auth.config.ts), not the adapter's
  // database session table.
  adapter: PrismaAdapter(prisma),
  providers: [
    Nodemailer({
      id: "email",
      server: {
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: Number(process.env.EMAIL_PORT || 587),
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    }),
  ],
});
