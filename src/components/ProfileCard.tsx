"use client";

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

const themes = [
   { id: "light", label: "Light" },
   { id: "dracula", label: "Dracula" },
   { id: "onedark", label: "One Dark" },
   { id: "solarized", label: "Solarized Dark" },
   { id: "monokai", label: "Monokai" },
   { id: "github-dark", label: "GitHub Dark" },
   { id: "nord", label: "Nord" },
   { id: "tokyonight", label: "Tokyo Night" },
   { id: "gruvbox", label: "Gruvbox" },
   { id: "material-dark", label: "Material Dark" },
   { id: "solarized-light", label: "Solarized Light" },
   { id: "github-light", label: "GitHub Light" },
];

function ProfileCard() {
   const router = useRouter();

   const [profile, setProfile] = useState<Profile | null>(null);
   const [loading, setLoading] = useState(true);

   const [avatarColor, setAvatarColor] = useState("#3B4BA6");
   const [quote, setQuote] = useState<{ quote: string; author: string } | null>(null);

   const [isChoosingTheme, setIsChoosingTheme] = useState(false);
   const [currentTheme, setCurrentTheme] = useState("light");

   useEffect(() => {
      const savedColor = localStorage.getItem("avatarColor");
      if (savedColor) setAvatarColor(savedColor);

      loadDailyQuote();
      loadProfile();
   }, []);

   async function loadProfile() {
      const result = await getProfile();
      if (result.data) setProfile(result.data);
      setLoading(false);
   }

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
      } catch {
         setQuote({
            quote: "The only way to do great work is to love what you do.",
            author: "Steve Jobs",
         });
      }
   }

  function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const color = e.target.value;
    setAvatarColor(color);
    localStorage.setItem("avatarColor", color);
  }

   function applyTheme(theme: string) {
      const html = document.documentElement;

      if (theme === "light") {
         html.removeAttribute("data-theme");
      } else {
         html.setAttribute("data-theme", theme);
      }

      localStorage.setItem("theme", theme);
      setCurrentTheme(theme);
      setIsChoosingTheme(false);
   }

   async function handleLogout() {
      await logout();
      router.push("/");
   }

   if (loading) {
      return null;
   }

   return (
      <div className="relative mt-10 sm:mt-12 md:mt-16 w-full lg:max-w-96 flex-1 lg:flex-initial flex flex-col">
         {/* Avatar */}
         <div className="absolute left-1/2 -translate-x-1/2 -top-10 sm:-top-12 md:-top-16 z-10">
         <label
            className="group relative block w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full cursor-pointer transition-all"
            style={{ backgroundColor: avatarColor }}
         >
            <div className="absolute inset-0 rounded-full bg-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <Brush className="text-foreground w-5 h-5 sm:w-6 sm:h-6" />
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
         <div className="bg-background rounded-md pt-14 sm:pt-16 md:pt-20 pb-4 sm:pb-6 md:pb-8 px-4 sm:px-6 md:px-8 w-full border border-foreground flex-1 flex flex-col">
         {!isChoosingTheme && (
            <h2 className="text-center text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-4">
               {profile?.username?.toUpperCase() || "USER"}
            </h2>
         )}

         {!isChoosingTheme ? (
            <div className="mb-6 flex-1 relative">
               <span
               className="text-3xl font-serif absolute"
               style={{ color: avatarColor }}
               >
               "
               </span>
               <p className="text-foreground font-mono italic text-sm sm:text-base leading-relaxed pl-4">
               {quote?.quote}
               </p>
               {quote?.author && (
               <p className="text-foreground/60 font-mono text-xs mt-2 pl-4">
                  — {quote.author}
               </p>
               )}
            </div>
         ) : (
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 max-h-10/12 no-scrollbar">
               {themes.map(theme => (
               <button
                  key={theme.id}
                  onClick={() => applyTheme(theme.id)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors
                     ${
                     currentTheme === theme.id
                        ? "bg-foreground text-background border-foreground"
                        : "border-foreground text-foreground hover:bg-foreground hover:text-background cursor-pointer"
                     }
                  `}
               >
                  {theme.label}
               </button>
               ))}
            </div>
         )}

         <div className="flex gap-2 mt-auto">
            <button
               onClick={handleLogout}
               className="flex-1 px-3 py-2 border-2 border-foreground text-foreground rounded-lg text-xs sm:text-sm hover:bg-foreground hover:text-background transition-colors cursor-pointer"
            >
               Logout
            </button>

            <button
               onClick={() => setIsChoosingTheme(prev => !prev)}
               className="flex-1 px-3 py-2 border-2 bg-foreground border-foreground text-background rounded-lg text-xs sm:text-sm hover:bg-background hover:text-foreground transition-colors cursor-pointer"
            >
               {isChoosingTheme ? "Cancel" : "Change theme"}
            </button>
         </div>
         </div>
      </div>
   );
}

export default ProfileCard;
