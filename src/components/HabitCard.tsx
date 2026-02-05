"use client";
import { useState } from "react";
import { Flame, Check, Pause, Trash2, Power } from "lucide-react";
import { Habit } from "@/types";

interface HabitCardProps {
   habit: Habit;
   isLoggedToday: boolean;
   currentStreak?: number;
   onLog: (habitId: string) => Promise<void>;
   onUnlog: (habitId: string) => Promise<void>;
   onEdit: (habitId: string) => void;
   onDelete: (habitId: string) => Promise<void>;
   onToggleActive: (habitId: string) => Promise<void>;
}

export default function HabitCard({
   habit,
   isLoggedToday,
   currentStreak = 0,
   onLog,
   onUnlog,
   onEdit,
   onDelete,
   onToggleActive,
}: HabitCardProps) {
   const [loading, setLoading] = useState(false);

   async function handleToggleLog(e: React.MouseEvent) {
      e.stopPropagation();
      setLoading(true);
      try {
         if (isLoggedToday) {
            await onUnlog(habit.id);
         } else {
            await onLog(habit.id);
         }
      } finally {
         setLoading(false);
      }
   }

   function frequencyLabel() {
      if (habit.frequency_type === "daily") return "daily";
      if (habit.frequency_type === "weekly") return `${habit.frequency_target}x/week`;
      return `${habit.frequency_target}x/month`;
   }

   return (
      <div
         onClick={() => onEdit(habit.id)}
         className={`relative border rounded-md p-3 sm:p-4 transition-all cursor-pointer ${
            isLoggedToday
               ? "border-green-400 bg-green-50/50"
               : "border-foreground/20 bg-background"
         } ${!habit.is_active ? "opacity-50" : ""}`}
      >
         <div className="flex items-start gap-3">
            {/* Check-in button */}
            <button
               onClick={handleToggleLog}
               disabled={loading || !habit.is_active}
               className={`shrink-0 mt-0.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed ${
                  isLoggedToday
                     ? "bg-green-500 text-white"
                     : "border-2 border-foreground/30 text-transparent hover:border-green-400 hover:text-green-400"
               }`}
            >
               <Check size={16} strokeWidth={3} />
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2">
                  {habit.icon && <span className="text-base">{habit.icon}</span>}
                  <h3
                     className={`text-sm sm:text-base font-semibold text-foreground truncate ${
                        isLoggedToday ? "line-through text-foreground/50" : ""
                     }`}
                  >
                     {habit.title}
                  </h3>
               </div>

               <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[10px] sm:text-xs font-mono text-foreground/60 bg-foreground/5 px-1.5 py-0.5 rounded">
                     {frequencyLabel()}
                  </span>

                  {habit.categories && (
                     <span
                        className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded"
                        style={{
                           backgroundColor: habit.categories.color
                              ? `${habit.categories.color}20`
                              : "color-mix(in srgb, var(--foreground1) 12%, transparent)",
                           color: habit.categories.color || "var(--foreground1)",
                        }}
                     >
                        {habit.categories.name}
                     </span>
                  )}

                  {currentStreak > 0 && (
                     <span className="text-[10px] sm:text-xs font-mono text-orange-500 flex items-center gap-0.5">
                        <Flame size={12} />
                        {currentStreak}d
                     </span>
                  )}
               </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 shrink-0">
               <button
                  onClick={async (e) => {
                     e.stopPropagation();
                     await onToggleActive(habit.id);
                  }}
                  className="p-1.5 text-foreground/40 hover:text-foreground transition-colors cursor-pointer rounded-md hover:bg-foreground/5"
                  title={habit.is_active ? "pause" : "activate"}
               >
                  {habit.is_active ? <Pause size={15} /> : <Power size={15} />}
               </button>
               <button
                  onClick={async (e) => {
                     e.stopPropagation();
                     await onDelete(habit.id);
                  }}
                  className="p-1.5 text-foreground/40 hover:text-red-500 transition-colors cursor-pointer rounded-md hover:bg-red-50"
                  title="delete"
               >
                  <Trash2 size={15} />
               </button>
            </div>
         </div>
      </div>
   );
}
