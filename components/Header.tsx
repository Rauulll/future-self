"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-line">
      <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="font-display text-xl italic text-ink tracking-tight">
          Future Self
        </Link>
        <div className="flex items-center gap-4">
          {session?.user?.email && (
            <span className="font-ui text-xs text-ink-soft hidden sm:inline">
              {session.user.email}
            </span>
          )}
          <Link
            href="/"
            className="font-ui text-sm text-ink-soft hover:text-ink transition-colors"
          >
            Dashboard
          </Link>
          {session && (
            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="font-ui text-sm text-ink-soft hover:text-ink transition-colors"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
