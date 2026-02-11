"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-background min-h-dvh flex">
      <main className="bg-background w-full max-w-[95%] sm:max-w-10/12 mx-auto flex flex-col py-6 sm:py-16">
        {/* Header */}
        <div className="flex gap-3 sm:gap-4 items-center justify-between">
          <h1 className="text-foreground font-mono text-lg sm:text-xl">
            <span className="text-muted">~$</span> ./natan.sh
          </h1>

          {/* Desktop Menu */}
          <div className="hidden sm:flex gap-3 font-mono text-sm">
            <Link
              href="/login"
              className="py-1 px-3 border border-transparent text-foreground rounded transition-colors"
            >
              SignIn
            </Link>
            <Link
              href="/register"
              className="bg-foreground border-foreground py-1 px-3 border rounded text-background hover:bg-hover transition-colors"
            >
              SignUp
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden font-mono text-foreground py-1 px-2 cursor-pointer rounded text-sm hover:bg-foreground hover:text-background transition-colors"
          >
            {menuOpen ? "[x]" : "[=]"}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="sm:hidden mt-3 font-mono text-sm rounded bg-background text-foreground overflow-hidden">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-3 hover:bg-hover transition-colors "
            >
              <span className="text-muted">{">"}</span> login
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-3 hover:bg-hover transition-colors"
            >
              <span className="text-muted">{">"}</span> register
            </Link>
          </div>
        )}

        {/* Iframe Container */}
        <div className="mt-4 flex w-full flex-1 min-h-[70vh] sm:min-h-0 rounded overflow-hidden border border-border-custom">
          <Link href="https://im.natan.sh" target="_blank" className="grow flex rounded cursor-pointer">
            <iframe
              src="https://im.natan.sh"
              frameBorder="0"
              className="grow rounded cursor-pointer"
            />
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-3 font-mono text-xs text-muted flex flex-col sm:flex-row sm:justify-between gap-1">
          <span>
            Feito com ❤️ por NATANGOATOSO  |{" "}
            2026 - Presente
          </span>
          <span className="flex gap-3">
            <Link href="/terms" className="hover:text-foreground transition-colors">terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">privacy</Link>
          </span>
        </div>
      </main>
    </div>
  );
}
