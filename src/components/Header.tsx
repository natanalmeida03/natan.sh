"use client"
import Link from "next/link";
import { LogOut } from 'lucide-react'
import { logout } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

function Header () {
   const router = useRouter();
   const pathname = usePathname();
   const [inputValue, setInputValue] = useState("");
   const [menuOpen, setMenuOpen] = useState(false);
   const currentPage = pathname.split("/")[1] || "home";

   async function LogoutSubmit () {
      await logout();
      router.push("/");
   }

   function handleInputKeyDown (e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Enter" && inputValue.toLowerCase() === "neofetch") {
         router.push("/about");
         setInputValue("");
      }
   }

   return (
      <div className="flex flex-col mb-4">
         <div className="flex gap-3 sm:gap-4 items-center justify-between">
            <h1 className="text-foreground text-sm sm:text-base">
               <b>{currentPage}</b>@ubuntu:~#
               <input
                  type="text"
                  name="secret"
                  id="secret"
                  className="pl-2 sm:pl-3 w-20 sm:w-28 outline-0 bg-transparent"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
               />
            </h1>

            {/* Desktop Menu */}
            <div className="hidden sm:flex gap-4 md:gap-6 items-center">
               <Link href={'/home'}> home </Link>
               <Link href={'/habits'}> habits </Link>
               <Link href={'/reminders'}> reminders </Link>
               <Link href={'/profile'}> profile </Link>
               <p className="cursor-pointer" onClick={LogoutSubmit}>
                  <LogOut className="text-accent" size={20}/>
               </p>
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
                  href="/home"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-3 hover:bg-foreground hover:text-background transition-colors"
               >
                  <span className="text-muted">{">"}</span> home
               </Link>
               <Link
                  href="/habits"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-3 hover:bg-foreground hover:text-background transition-colors"
               >
                  <span className="text-muted">{">"}</span> habits
               </Link>
               <Link
                  href="/reminders"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-3 hover:bg-foreground hover:text-background transition-colors"
               >
                  <span className="text-muted">{">"}</span> reminders
               </Link>
               <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-3 hover:bg-foreground hover:text-background transition-colors"
               >
                  <span className="text-muted">{">"}</span> profile
               </Link>
               <button
                  onClick={() => {
                     setMenuOpen(false);
                     LogoutSubmit();
                  }}
                  className="w-full text-left px-3 py-3 transition-colors text-accent cursor-pointer"
               >
                  <span className="text-muted">{">"}</span> logout
               </button>
            </div>
         )}
      </div>
   );
}

export default Header;
