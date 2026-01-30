"use client"
import { useEffect, useState } from "react";
import Header from "@/components/Header";

function AboutPage() {
   const [uptime, setUptime] = useState(0);
   const [avatarColor, setAvatarColor] = useState("#3B4BA6");


   useEffect(() => {
      const interval = setInterval(() => {
         setUptime(prev => prev + 1);
      }, 1000);

      const savedColor = localStorage.getItem("avatarColor");
      if (savedColor) {
         setAvatarColor(savedColor);
      }
      
      return () => clearInterval(interval);

   }, []);

   function formatUptime(seconds: number) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins} mins, ${secs} secs`;
   }

   const info = [
      { label: "OS", value: "natan.sh" },
      { label: "Host", value: "Vercel" },
      { label: "Kernel", value: "Linux Kernel" },
      { label: "Uptime", value: formatUptime(uptime) },
      { label: "Packages", value: "supabase, nextjs" },
      { label: "Shell", value: "zsh 5.9" },
      { label: "Resolution", value: "1920 x 1080" },
      { label: "DE", value: "VS Code" },
      { label: "Terminal", value: "About" },
      { label: "Memory", value: "Full" },
   ];

   return (
      <div className="bg-[#F8F4EE] min-h-dvh flex">
         <main className="bg-[#F8F4EE] max-w-10/12 mx-auto w-full flex flex-col py-16">
            <Header />

            <div className="mt-8 bg-[#2E2E2E] rounded-lg p-6 sm:p-8 font-mono text-sm flex-1">
               
               <div className="flex flex-col lg:flex-row gap-8">
                  <div className="text-xs sm:text-sm leading-tight whitespace-pre select-none" style={{ color: avatarColor }}>
{`
                              
        ################      
      ####################    
    ########################  
  ############################
  ##########        ##########
  ########  ########  ########
  ########  ########  ########
  ########  ########  ########
  ########  ########  ########
  ########  ########  ########
  ############################
    ########################  
      ####################    
        ################      
`}
                  </div>

                  {/* System Info */}
                  <div className="flex-1">
                     {/* User@Host */}
                     <div className="mb-4">
                        <span className="text-[#F8F4EE] font-bold">natan</span>
                        <span className="text-[#F8F4EE]">@</span>
                        <span className="text-[#F8F4EE]">ubuntu:~# </span>
                        <span style={{ color: avatarColor }}>neofetch</span>
                     </div>
                     
                     {/* Separator */}
                     <div className="text-[#F8F4EE]/40 mb-4">──────────────────────</div>

                     {/* Info list */}
                     <div className="space-y-1">
                        {info.map((item) => (
                           <div key={item.label} className="flex">
                              <span className="w-28" style={{ color: avatarColor }}>{item.label}</span>
                              <span className="text-[#F8F4EE]">{item.value}</span>
                           </div>
                        ))}
                     </div>

                     {/* Color palette */}
                     <div className="mt-6 flex gap-1">
                        <div className="w-6 h-6 bg-[#2E2E2E] border border-[#F8F4EE]/20"></div>
                        <div className="w-6 h-6 bg-red-500"></div>
                        <div className="w-6 h-6 bg-green-500"></div>
                        <div className="w-6 h-6 bg-yellow-500"></div>
                        <div className="w-6 h-6 bg-[#3B4BA6]"></div>
                        <div className="w-6 h-6 bg-purple-500"></div>
                        <div className="w-6 h-6 bg-cyan-400"></div>
                        <div className="w-6 h-6 bg-[#F8F4EE]"></div>
                     </div>
                     <div className="mt-1 flex gap-1">
                        <div className="w-6 h-6 bg-gray-600"></div>
                        <div className="w-6 h-6 bg-red-400"></div>
                        <div className="w-6 h-6 bg-green-400"></div>
                        <div className="w-6 h-6 bg-yellow-400"></div>
                        <div className="w-6 h-6 bg-blue-400"></div>
                        <div className="w-6 h-6 bg-purple-400"></div>
                        <div className="w-6 h-6 bg-cyan-300"></div>
                        <div className="w-6 h-6 bg-gray-300"></div>
                     </div>
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
}

export default AboutPage;