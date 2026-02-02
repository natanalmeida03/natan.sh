"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Flame, TrendingUp, Calendar} from "lucide-react";
import StreakCalendar from "@/components/StreakCalendar";
import HabitForm from "@/components/HabitForm";
import DeleteConfirm from "@/components/DeleteConfirm";
import {
   getHabitById,
   updateHabit,
   deleteHabit,
   getHabitLogs,
} from "@/lib/habits";
import { getHabitStreaks, getHabitWeeklyStats } from "@/lib/stats";
import { getCategories } from "@/lib/categories";
import Header from "@/components/HeaderSecondary";

interface Habit {
   id: string;
   title: string;
   description?: string | null;
   icon?: string | null;
   color?: string | null;
   frequency_type: string;
   frequency_target: number;
   is_active: boolean;
   category_id?: string | null;
   categories?: { id: string; name: string; color?: string | null; icon?: string | null } | null;
}

interface Category {
   id: string;
   name: string;
   color?: string | null;
   icon?: string | null;
}

interface Streak {
   habit_id: string;
   current_streak: number;
   best_streak: number;
}

interface WeeklyStat {
   week_start: string;
   times_completed: number;
   completion_pct: number | null;
}

export default function HabitDetailPage() {
   const router = useRouter();
   const params = useParams();
   const habitId = params.id as string;

   const [habit, setHabit] = useState<Habit | null>(null);
   const [categories, setCategories] = useState<Category[]>([]);
   const [streak, setStreak] = useState<Streak | null>(null);
   const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
   const [loggedDates, setLoggedDates] = useState<string[]>([]);
   const [loading, setLoading] = useState(true);
   const [editing, setEditing] = useState(false);

   // Calendar state
   const now = new Date();
   const [calMonth, setCalMonth] = useState(now.getMonth());
   const [calYear, setCalYear] = useState(now.getFullYear());

   const loadData = useCallback(async () => {
      setLoading(true);

      const [habitRes, categoriesRes, streaksRes, weeklyRes] = await Promise.all([
         getHabitById(habitId),
         getCategories(),
         getHabitStreaks(),
         getHabitWeeklyStats({ habit_id: habitId }),
      ]);

      if (habitRes.data) setHabit(habitRes.data as Habit);
      if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);

      if (streaksRes.data) {
         const found = (streaksRes.data as Streak[]).find((s) => s.habit_id === habitId);
         if (found) setStreak(found);
      }

      if (weeklyRes.data) setWeeklyStats(weeklyRes.data as WeeklyStat[]);

      setLoading(false);
   }, [habitId]);

   // Load logs when calendar month changes
   const loadLogs = useCallback(async () => {
      const from = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(calYear, calMonth + 1, 0).getDate();
      const to = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const res = await getHabitLogs(habitId, { from, to });
      if (res.data) {
         const dates = (res.data as { logged_date: string }[]).map((l) => l.logged_date);
         setLoggedDates(dates);
      }
   }, [habitId, calMonth, calYear]);

   useEffect(() => {
      loadData();
   }, [loadData]);

   useEffect(() => {
      loadLogs();
   }, [loadLogs]);

   function handlePrevMonth() {
      if (calMonth === 0) {
         setCalMonth(11);
         setCalYear(calYear - 1);
      } else {
         setCalMonth(calMonth - 1);
      }
   }

   function handleNextMonth() {
      if (calMonth === 11) {
         setCalMonth(0);
         setCalYear(calYear + 1);
      } else {
         setCalMonth(calMonth + 1);
      }
   }

   async function handleUpdate(data: {
      title: string;
      description: string;
      category_id: string;
      icon: string;
      color: string;
      frequency_type: "daily" | "weekly" | "monthly";
      frequency_target: number;
   }) {
      const res = await updateHabit(habitId, {
         title: data.title,
         description: data.description || null,
         category_id: data.category_id || null,
         icon: data.icon || null,
         color: data.color || null,
         frequency_type: data.frequency_type,
         frequency_target: data.frequency_target,
      });

      if (res.error) {
         return { error: res.error };
      }

      setEditing(false);
      await loadData();
      return {};
   }

   async function handleDelete() {
      const res = await deleteHabit(habitId);
      if (!res.error) {
         router.push("/habits");
      }
   }

   if (loading) {
      return (
         <div className="relative mt-4 lg:mt-16 w-full flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#2E2E2E]/20 border-t-[#2E2E2E] rounded-full animate-spin" />
         </div>
      );
   }

   if (!habit) {
      return (
         <div className="relative mt-4 lg:mt-16 w-full flex-1 flex flex-col items-center justify-center">
            <p className="text-sm text-[#2E2E2E]/50 mb-3">Habit not found</p>
            <button
               onClick={() => router.push("/habits")}
               className="px-4 py-2 bg-[#2E2E2E] text-[#F8F4EE] rounded-md text-xs sm:text-sm cursor-pointer"
            >
               Back
            </button>
         </div>
      );
   }

   return (
      <div className="bg-[#F8F4EE] min-h-dvh flex">
         <div className="bg-[#F8F4EE] w-full max-w-[95%] sm:max-w-10/12 mx-auto flex flex-col py-6 sm:py-16">
            {editing ? (
               /* Edit mode */
               <div>
                    <Header backRoute={() => setEditing(false)} />

                    <p className="mb-3">Edit habit</p>
                    <div className="flex items-center justify-center">
                    <HabitForm
                        initialData={{
                            title: habit.title,
                            description: habit.description || "",
                            category_id: habit.category_id || "",
                            icon: habit.icon || "",
                            color: habit.color || "",
                            frequency_type: habit.frequency_type as "daily" | "weekly" | "monthly",
                            frequency_target: habit.frequency_target,
                        }}
                        categories={categories}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditing(false)}
                        submitLabel="Save"
                    />
                    </div>

               </div>
            ) : (
               /* View mode */
               <div>
                <Header backRoute={() => router.back()} />
               <div className="flex flex-col gap-4 sm:gap-5">
                  {/* Description */}
                  {habit.description && (
                     <p className="text-xs sm:text-sm text-[#2E2E2E]/70">{habit.description}</p>
                  )}

                  {/* Calendar + Stats side by side on lg, stacked on mobile */}
                  <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                     {/* Calendar - takes more space */}
                     <div className="border border-[#2E2E2E]/15 rounded-md p-3 sm:p-4 lg:flex-1">
                        <StreakCalendar
                           loggedDates={loggedDates}
                           month={calMonth}
                           year={calYear}
                           onPrevMonth={handlePrevMonth}
                           onNextMonth={handleNextMonth}
                           habitColor={habit.color}
                        />
                     </div>

                     {/* Stats cards - vertical stack beside calendar */}
                     <div className="flex flex-row lg:flex-col gap-2 sm:gap-3 lg:w-48">
                        <div className="flex-1 border border-[#2E2E2E]/15 rounded-md px-3 py-4 text-center flex flex-col items-center justify-center">
                           <Flame className="mb-1.5 text-orange-500" size={20} />
                           <p className="text-lg sm:text-xl font-bold text-[#2E2E2E]">
                              {streak?.current_streak || 0}
                           </p>
                           <p className="text-[10px] sm:text-xs text-[#2E2E2E]/50 font-mono">
                              current streak
                           </p>
                        </div>
                        <div className="flex-1 border border-[#2E2E2E]/15 rounded-md px-3 py-4 text-center flex flex-col items-center justify-center">
                           <TrendingUp className="mb-1.5 text-blue-500" size={20} />
                           <p className="text-lg sm:text-xl font-bold text-[#2E2E2E]">
                              {streak?.best_streak || 0}
                           </p>
                           <p className="text-[10px] sm:text-xs text-[#2E2E2E]/50 font-mono">
                              best streak
                           </p>
                        </div>
                        <div className="flex-1 border border-[#2E2E2E]/15 rounded-md px-3 py-4 text-center flex flex-col items-center justify-center">
                           <Calendar className="mb-1.5 text-green-500" size={20} />
                           <p className="text-lg sm:text-xl font-bold text-[#2E2E2E]">
                              {weeklyStats.length > 0
                                 ? weeklyStats[0].times_completed
                                 : 0}
                           </p>
                           <p className="text-[10px] sm:text-xs text-[#2E2E2E]/50 font-mono">
                              this week
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Weekly history */}
                  {weeklyStats.length > 1 && (
                     <div className="border border-[#2E2E2E]/15 rounded-md p-3 sm:p-4">
                        <h3 className="text-xs sm:text-sm font-semibold text-[#2E2E2E] mb-3">
                           Histórico semanal
                        </h3>
                        <div className="flex flex-col gap-2">
                           {weeklyStats.slice(0, 8).map((week) => {
                              const weekDate = new Date(week.week_start);
                              const label = weekDate.toLocaleDateString("pt-BR", {
                                 day: "2-digit",
                                 month: "short",
                              });
                              const pct = week.completion_pct ?? 0;

                              return (
                                 <div key={week.week_start} className="flex items-center gap-3">
                                    <span className="text-[10px] sm:text-xs font-mono text-[#2E2E2E]/50 w-16 shrink-0">
                                       {label}
                                    </span>
                                    <div className="flex-1 h-2 bg-[#2E2E2E]/5 rounded-full overflow-hidden">
                                       <div
                                          className="h-full rounded-full transition-all"
                                          style={{
                                             width: `${Math.min(pct, 100)}%`,
                                             backgroundColor: habit.color || "#4CAF50",
                                          }}
                                       />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-mono text-[#2E2E2E]/50 w-8 text-right">
                                       {week.times_completed}x
                                    </span>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  )}

                  {/* Action buttons — edit + delete together at the bottom */}
                  <div className="flex items-center gap-4 pt-4 border-t border-[#2E2E2E]/10">
                     <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-[#2E2E2E] rounded-md text-xs sm:text-sm text-[#2E2E2E] hover:bg-[#2E2E2E] hover:text-[#F8F4EE] transition-colors cursor-pointer"
                     >
                        Edit
                     </button>

                     <DeleteConfirm
                        title="Delete"
                        message={`Are you sure you want to delete "${habit.title}"? All check-in history will be lost.`}
                        onConfirm={handleDelete}
                     />
                  </div>
               </div>
            </div>
            )}
         </div>
      </div>
   );
}