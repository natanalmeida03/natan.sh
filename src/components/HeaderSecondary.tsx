"use client"
import Link from "next/link";
import { LogOut, ArrowLeft } from 'lucide-react'
import { logout } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
   backRoute?: () => void;
}

function Header ( { backRoute = () => {} }: HeaderProps) {
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
            <button onClick={backRoute} className="text-[#2E2E2E] text-sm sm:text-base flex gap-2 items-center cursor-pointer">
               <ArrowLeft size={16} />
               {" "} Back
            </button>

            {/* Desktop Menu */}
            <div className="hidden sm:flex gap-4 md:gap-6 items-center">
               <Link href={'/home'}> home </Link>
               <Link href={'/habits'}> habits </Link>
               <Link href={'/reminders'}> reminders </Link>
               <Link href={'/profile'}> profile </Link>
               <p className="cursor-pointer" onClick={LogoutSubmit}>
                  <LogOut color="red" size={20}/>
               </p>
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
                  href="/home"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-3 hover:bg-[#2E2E2E] hover:text-[#F8F4EE] transition-colors"
               >
                  <span className="text-[#6B6B6B]">{">"}</span> home
               </Link>
               <Link
                  href="/habits"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-3 hover:bg-[#2E2E2E] hover:text-[#F8F4EE] transition-colors"
               >
                  <span className="text-[#6B6B6B]">{">"}</span> habits
               </Link>
               <Link
                  href="/reminders"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-3 hover:bg-[#2E2E2E] hover:text-[#F8F4EE] transition-colors"
               >
                  <span className="text-[#6B6B6B]">{">"}</span> reminders
               </Link>
               <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-3 hover:bg-[#2E2E2E] hover:text-[#F8F4EE] transition-colors"
               >
                  <span className="text-[#6B6B6B]">{">"}</span> profile
               </Link>
               <button
                  onClick={() => {
                     setMenuOpen(false);
                     LogoutSubmit();
                  }}
                  className="w-full text-left px-3 py-3 hover:bg-red-500 hover:text-white transition-colors text-red-600 cursor-pointer"
               >
                  <span className="text-[#6B6B6B]">{">"}</span> logout
               </button>
            </div>
         )}
      </div>
   );
}

export default Header;