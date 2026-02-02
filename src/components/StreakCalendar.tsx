"use client";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StreakCalendarProps {
   loggedDates: string[]; 
   month: number; // 0-11
   year: number;
   onPrevMonth: () => void;
   onNextMonth: () => void;
   habitColor?: string | null;
}

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function StreakCalendar({
   loggedDates,
   month,
   year,
   onPrevMonth,
   onNextMonth,
   habitColor,
}: StreakCalendarProps) {
   const color = habitColor || "#50B63F";

   const loggedSet = useMemo(() => new Set(loggedDates), [loggedDates]);

   const days = useMemo(() => {
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = new Date();

      const cells: Array<{
         day: number | null;
         date: string;
         isLogged: boolean;
         isToday: boolean;
         isFuture: boolean;
      }> = [];

      // Empty cells before first day
      for (let i = 0; i < firstDay; i++) {
         cells.push({ day: null, date: "", isLogged: false, isToday: false, isFuture: false });
      }

      for (let d = 1; d <= daysInMonth; d++) {
         const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
         const cellDate = new Date(year, month, d);

         cells.push({
            day: d,
            date: dateStr,
            isLogged: loggedSet.has(dateStr),
            isToday:
               cellDate.getDate() === today.getDate() &&
               cellDate.getMonth() === today.getMonth() &&
               cellDate.getFullYear() === today.getFullYear(),
            isFuture: cellDate > today,
         });
      }

      return cells;
   }, [year, month, loggedSet]);

   const monthName = new Date(year, month).toLocaleDateString("en-us", {
      month: "long",
      year: "numeric",
   });

   const loggedCount = days.filter((d) => d.isLogged).length;

   return (
      <div>
         {/* Header */}
         <div className="flex items-center justify-between mb-3">
            <button
               onClick={onPrevMonth}
               className="p-1 text-[#2E2E2E]/60 hover:text-[#2E2E2E] transition-colors cursor-pointer"
            >
               <ChevronLeft size={18} />
            </button>

            <div className="text-center">
               <span className="text-sm font-semibold text-[#2E2E2E] capitalize">
                  {monthName}
               </span>
               <span className="text-[10px] font-mono text-[#2E2E2E]/50 ml-2">
                  {loggedCount}d
               </span>
            </div>

            <button
               onClick={onNextMonth}
               className="p-1 text-[#2E2E2E]/60 hover:text-[#2E2E2E] transition-colors cursor-pointer"
            >
               <ChevronRight size={18} />
            </button>
         </div>

         {/* Weekday headers */}
         <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((day, i) => (
               <div
                  key={i}
                  className="text-[10px] font-mono text-[#2E2E2E]/40 text-center"
               >
                  {day}
               </div>
            ))}
         </div>

         {/* Days grid */}
         <div className="grid grid-cols-7 gap-1">
            {days.map((cell, i) => (
               <div
                  key={i}
                  className={`aspect-square rounded-md flex items-center justify-center text-xs transition-all ${
                     !cell.day
                        ? ""
                        : cell.isFuture
                        ? "text-[#2E2E2E]/20"
                        : cell.isLogged
                        ? "text-white font-bold"
                        : "text-[#2E2E2E]/50"
                  } ${cell.isToday && !cell.isLogged ? "ring-1 ring-[#2E2E2E]/30" : ""}`}
                  style={
                     cell.isLogged
                        ? { backgroundColor: color }
                        : undefined
                  }
               >
                  {cell.day}
               </div>
            ))}
         </div>
      </div>
   );
}