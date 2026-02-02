"use client";
import { useState } from "react";
import { Check, Flame } from "lucide-react";

interface Habit {
   id: string;
   title: string;
   icon?: string | null;
   color?: string | null;
}

interface Streak {
   habit_id: string;
   current_streak: number;
}

interface QuickHabitsProps {
   habits: Habit[];
   loggedToday: Record<string, boolean>;
   streaks: Record<string, Streak>;
   onLog: (habitId: string) => Promise<void>;
   onUnlog: (habitId: string) => Promise<void>;
}

export default function QuickHabits({
   habits,
   loggedToday,
   streaks,
   onLog,
   onUnlog,
}: QuickHabitsProps) {
   const [loadingId, setLoadingId] = useState<string | null>(null);

   async function handleToggle(habitId: string) {
      setLoadingId(habitId);
      if (loggedToday[habitId]) {
         await onUnlog(habitId);
      } else {
         await onLog(habitId);
      }
      setLoadingId(null);
   }

   const done = Object.values(loggedToday).filter(Boolean).length;

   if (habits.length === 0) return null;

   return (
      <div className="border border-[#2E2E2E]/15 rounded-lg p-3 sm:p-4">
         <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-semibold text-[#2E2E2E]">
               Habits for today
            </h3>
            <span className="text-[10px] sm:text-xs font-mono text-[#2E2E2E]/40">
               {done}/{habits.length}
            </span>
         </div>

         {/* Progress bar */}
         <div className="h-1.5 bg-[#2E2E2E]/5 rounded-full overflow-hidden mb-3">
            <div
               className="h-full bg-green-500 rounded-full transition-all duration-500"
               style={{ width: `${habits.length > 0 ? (done / habits.length) * 100 : 0}%` }}
            />
         </div>

         <div className="flex flex-col gap-1.5">
            {habits.map((habit) => {
               const logged = loggedToday[habit.id] || false;
               const streak = streaks[habit.id]?.current_streak || 0;

               return (
                  <div
                     key={habit.id}
                     className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-all ${
                        logged ? "bg-green-50/60" : "hover:bg-[#2E2E2E]/2"
                     }`}
                  >
                     <button
                        onClick={() => handleToggle(habit.id)}
                        disabled={loadingId === habit.id}
                        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed ${
                           logged
                              ? "bg-green-500 text-white"
                              : "border-[1.5px] border-[#2E2E2E]/25 text-transparent hover:border-green-400 hover:text-green-400"
                        }`}
                     >
                        <Check size={12} strokeWidth={3} />
                     </button>

                     <span className="flex items-center gap-1.5 flex-1 min-w-0">
                        {habit.icon && <span className="text-sm">{habit.icon}</span>}
                        <span
                           className={`text-xs sm:text-sm truncate ${
                              logged
                                 ? "line-through text-[#2E2E2E]/35"
                                 : "text-[#2E2E2E]"
                           }`}
                        >
                           {habit.title}
                        </span>
                     </span>

                     {streak > 0 && (
                        <span className="text-[10px] font-mono text-orange-400 flex items-center gap-0.5 shrink-0">
                           <Flame size={10} />
                           {streak}
                        </span>
                     )}
                  </div>
               );
            })}
         </div>
      </div>
   );
}