"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { logout } from "@/lib/auth";
import { Brush } from "lucide-react";

interface Profile {
   username: string;
   email: string;
}

interface DailyQuote {
   quote: string;
   author: string;
   date: string;
}

function ProfileCard() {
   const router = useRouter();
   const [profile, setProfile] = useState<Profile | null>(null);
   const [loading, setLoading] = useState(true);
   const [avatarColor, setAvatarColor] = useState("#3B4BA6");
   const [quote, setQuote] = useState<{ quote: string; author: string } | null>(null);

   useEffect(() => {
      const savedColor = localStorage.getItem("avatarColor");
      if (savedColor) {
         setAvatarColor(savedColor);
      }

      loadDailyQuote();

      async function loadProfile() {
         const result = await getProfile();
         if (result.data) {
            setProfile(result.data);
         }
         setLoading(false);
      }
      loadProfile();
   }, []);

   async function loadDailyQuote() {
      const today = new Date().toDateString();
      const savedQuote = localStorage.getItem("dailyQuote");

      if (savedQuote) {
         const parsed: DailyQuote = JSON.parse(savedQuote);
         if (parsed.date === today) {
            setQuote({ quote: parsed.quote, author: parsed.author });
            return;
         }
      }

      try {
         const res = await fetch("https://dummyjson.com/quotes/random");
         const data = await res.json();
         
         const newQuote: DailyQuote = {
            quote: data.quote,
            author: data.author,
            date: today,
         };
         
         localStorage.setItem("dailyQuote", JSON.stringify(newQuote));
         setQuote({ quote: data.quote, author: data.author });
      } catch (error) {
         setQuote({ quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" });
      }
   }

   function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
      const color = e.target.value;
      setAvatarColor(color);
      localStorage.setItem("avatarColor", color);
   }

   async function handleLogout() {
      await logout();
      router.push("/");
   }

   function handleEditProfile() {
      router.push("/profile/edit");
   }

   if (loading) {
      return (
         <div className="relative mt-10 sm:mt-12 md:mt-16 w-full lg:max-w-96 flex-1 lg:flex-initial flex flex-col">
            <div className="absolute left-1/2 -translate-x-1/2 -top-10 sm:-top-12 md:-top-16 z-10">
               <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-zinc-400" />
            </div>

            <div className="bg-[#F5F5F0] rounded-md pt-14 sm:pt-16 md:pt-20 pb-4 sm:pb-6 md:pb-8 px-4 sm:px-6 md:px-8 w-full shadow-lg border border-[#2E2E2E] flex-1 flex flex-col">
               <h2 className="text-center text-lg sm:text-xl md:text-2xl font-bold text-[#2E2E2E] mb-3 sm:mb-4 md:mb-6">
                  GUEST
               </h2>

               <div className="mb-4 sm:mb-6 md:mb-8 flex-1">
                  <span className="text-[#3B4BA6] text-2xl sm:text-3xl md:text-4xl font-serif leading-none">"</span>
                  <p className="text-[#2E2E2E] font-mono text-xs sm:text-sm leading-relaxed -mt-2 sm:-mt-3 md:-mt-4 pl-2 sm:pl-3 md:pl-4">
                     Loading...
                  </p>
               </div>

               <div className="flex flex-col xs:flex-row items-stretch gap-2 sm:gap-3 mt-auto">
                  <button className="px-3 py-2 border-2 border-[#2E2E2E] text-[#2E2E2E] rounded-lg font-medium text-xs sm:text-sm">
                     Logout
                  </button>
                  <button className="px-3 py-2 border-2 border-[#2E2E2E] text-[#2E2E2E] rounded-lg font-medium text-xs sm:text-sm">
                     Change theme
                  </button>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="relative mt-10 sm:mt-12 md:mt-16 w-full lg:max-w-96 flex-1 lg:flex-initial flex flex-col">
         {/* Avatar with native color picker */}
         <div className="absolute left-1/2 -translate-x-1/2 -top-10 sm:-top-12 md:-top-16 z-10">
            <label
               className="group relative block w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full cursor-pointer transition-all hover:ring-4 hover:ring-[#F8F4EE]/50"
               style={{ backgroundColor: avatarColor }}
               title="Click to change color"
            >
               {/* Paint brush icon on hover */}
               <div className="absolute inset-0 rounded-full bg-[#2E2E2E]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Brush color="#2E2E2E" className="w-5 h-5 sm:w-6 sm:h-6"/>
               </div>
               <input
                  type="color"
                  value={avatarColor}
                  onChange={handleColorChange}
                  className="sr-only"
               />
            </label>
         </div>

         {/* Card */}
         <div className="bg-[#F8F4EE] rounded-md pt-14 sm:pt-16 md:pt-20 pb-4 sm:pb-6 md:pb-8 px-4 sm:px-6 md:px-8 w-full border border-[#2E2E2E] flex-1 flex flex-col">
            {/* Username */}
            <h2 className="text-center text-lg sm:text-xl md:text-2xl font-bold text-[#2E2E2E] mb-3 sm:mb-4 md:mb-6">
               {profile?.username?.toUpperCase() || "USER"}
            </h2>

            {/* Bio */}
            <div className="mb-4 sm:mb-6 md:mb-8 flex-1 relative">
               <span className="text-2xl sm:text-3xl md:text-4xl font-serif leading-none absolute z-0" style={{ color: avatarColor }}>"</span>
               <p className="text-[#2E2E2E] font-mono italic text-sm sm:text-base md:text-lg lg:text-sm leading-relaxed pt-1 sm:pt-0 -mt-1 sm:-mt-3 md:-mt-4 pl-3 sm:pl-4 z-20 relative">
                  {quote?.quote || "Loading..."}
               </p>
               {quote?.author && (
                  <p className="text-[#2E2E2E]/60 font-mono text-xs mt-2 pl-3 sm:pl-4">
                     — {quote.author}
                  </p>
               )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col xs:flex-row items-stretch gap-2 sm:gap-3 mt-auto">
               <button
                  onClick={handleLogout}
                  className="flex-1 px-3 py-2 border-2 border-[#2E2E2E] text-[#2E2E2E] rounded-lg font-medium text-xs sm:text-sm hover:bg-[#2E2E2E] hover:text-[#F8F4EE] transition-colors cursor-pointer"
               >
                  Logout
               </button>
               <button
                  onClick={handleEditProfile}
                  className="flex-1 px-3 py-2 border-2 bg-[#2E2E2E] border-[#2E2E2E] text-[#F8F4EE] rounded-lg font-medium text-xs sm:text-sm hover:bg-[#F8F4EE] hover:text-[#2E2E2E] transition-colors cursor-pointer"
               >
                  Change theme
               </button>
            </div>
         </div>
      </div>
   );
}

export default ProfileCard;