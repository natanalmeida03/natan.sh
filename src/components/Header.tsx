"use client"
import Link from "next/link";
import { LogOut } from 'lucide-react'
import { logout } from "@/lib/auth";
import { useRouter, usePathname  } from "next/navigation";
import { useState } from "react";


function Header () {
   const router = useRouter();
   const pathname = usePathname();
   const [inputValue, setInputValue] = useState("");

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
      <div className="flex gap-4 items-center justify-between">
         <h1 className="text-[#2E2E2E] flex-2 "><b>{currentPage}</b>@ubuntu:~# 
         <input 
            type="text" 
            name="secret" 
            id="secret" 
            className="pl-3 w-28 outline-0"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
         />
         </h1>
            <div className="flex gap-6 flex-4 justify-end items-center">
            <Link href={'/home'}> home </Link>
            <Link href={'/projects'}> projects </Link>
            <Link href={'/profile'}> profile </Link>
            <p className="cursor-pointer" onClick={LogoutSubmit}><LogOut color="red" size={20}/></p>
         </div>
      </div>
  );
}

export default Header;