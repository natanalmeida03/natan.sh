"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-[#F8F4EE] min-h-dvh flex">
      <main className="bg-[#F8F4EE] w-full max-w-[95%] sm:max-w-10/12 mx-auto flex flex-col py-6 sm:py-16">
        {/* Header */}
        <div className="flex gap-3 sm:gap-4 items-center justify-between">
          <h1 className="text-[#2E2E2E] font-mono text-lg sm:text-xl">
            <span className="text-[#6B6B6B]">~$</span> ./natan.sh
          </h1>

          {/* Desktop Menu */}
          <div className="hidden sm:flex gap-3 font-mono text-sm">
            <Link
              href="/login"
              className="py-1 px-3 border border-transparent text-[#2E2E2E] rounded transition-colors"
            >
              SignIn
            </Link>
            <Link
              href="/register"
              className="bg-[#2E2E2E] border-[#2E2E2E] py-1 px-3 border rounded text-[#F8F4EE] hover:bg-[#404040] transition-colors"
            >
              SignUp
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden font-mono text-[#2E2E2E] py-1 px-2 cursor-pointer rounded text-sm hover:bg-[#2E2E2E] hover:text-[#F8F4EE] transition-colors"
          >
            {menuOpen ? "[x]" : "[=]"}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="sm:hidden mt-3 font-mono text-sm rounded bg-[#F8F4EE] text-[#2E2E2E] overflow-hidden">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-3 hover:bg-[#404040] transition-colors "
            >
              <span className="text-[#6B6B6B]">{">"}</span> --login
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-3 hover:bg-[#404040] transition-colors"
            >
              <span className="text-[#6B6B6B]">{">"}</span> --register
            </Link>
          </div>
        )}

        {/* Iframe Container */}
        <div className="mt-4 flex w-full flex-1 min-h-[70vh] sm:min-h-0 rounded overflow-hidden border border-[#D0C9C0]">
          <iframe
            src="https://im.natan.sh"
            frameBorder="0"
            className="grow rounded cursor-pointer"
          />
        </div>

        {/* Footer estilo terminal */}
        <div className="mt-3 font-mono text-xs text-[#6B6B6B]">
          Feito com ❤️ por NATANGOATOSO  |{" "}
          2026 - Presente
        </div>
      </main>
    </div>
  );
}