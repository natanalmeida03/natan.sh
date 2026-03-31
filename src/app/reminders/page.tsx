"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import ReminderCard from "@/components/ReminderCard";
import { getReminders, deleteReminder } from "@/lib/reminders";
import { getActiveRemindersForDisplay } from "@/lib/reminder-schedule";
import Header from "@/components/Header";

interface Reminder {
   id: string;
   title: string;
   description?: string | null;
   due_at: string;
   is_completed: boolean;
   recurrence_rule?: string | null;
   recurrence_end_at?: string | null;
   categories?: { id: string; name: string; color?: string | null; icon?: string | null } | null;
}

export default function RemindersPage() {
   const router = useRouter();

   const [reminders, setReminders] = useState<Reminder[]>([]);
   const [loading, setLoading] = useState(true);

   const loadData = useCallback(async () => {
      const res = await getReminders({ completed: false });

      if (res.data) {
         setReminders(getActiveRemindersForDisplay(res.data as Reminder[]));
      }

      setLoading(false);
   }, []);

   useEffect(() => {
      const timeoutId = window.setTimeout(() => {
         void loadData();
      }, 0);

      return () => window.clearTimeout(timeoutId);
   }, [loadData]);

   async function handleDelete(id: string) {
      const res = await deleteReminder(id);
      if (!res.error) {
         setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
      }
   }

   const now = new Date();
   const todayCount = reminders.filter((reminder) => {
      const dueDate = new Date(reminder.due_at);
      return (
         dueDate.getDate() === now.getDate() &&
         dueDate.getMonth() === now.getMonth() &&
         dueDate.getFullYear() === now.getFullYear()
      );
   }).length;

   const nextWeekCount = reminders.filter((reminder) => {
      const dueDate = new Date(reminder.due_at);
      const daysUntil = Math.ceil(
         (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return daysUntil >= 0 && daysUntil <= 7;
   }).length;

   function groupByDate(list: Reminder[]) {
      const groups: Record<string, Reminder[]> = {};

      list.forEach((reminder) => {
         const dueDate = new Date(reminder.due_at);
         const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
         const target = new Date(
            dueDate.getFullYear(),
            dueDate.getMonth(),
            dueDate.getDate()
         );
         const tomorrow = new Date(today);
         tomorrow.setDate(tomorrow.getDate() + 1);

         let label: string;
         if (target.getTime() === today.getTime()) {
            label = "Today";
         } else if (target.getTime() === tomorrow.getTime()) {
            label = "Tomorrow";
         } else {
            label = dueDate.toLocaleDateString("en-us", {
               weekday: "long",
               day: "2-digit",
               month: "long",
            });
         }

         if (!groups[label]) {
            groups[label] = [];
         }

         groups[label].push(reminder);
      });

      return groups;
   }

   const grouped = groupByDate(reminders);

   return (
      <div className="bg-background min-h-dvh flex">
         <div className="bg-background w-full max-w-[95%] sm:max-w-10/12 mx-auto flex flex-col py-6 sm:py-16">
            <Header />

            <div className="flex gap-3 mb-4 sm:mb-5">
               <div className="flex-1 border border-foreground/15 rounded-lg px-3 py-2 text-center">
                  <p className="text-lg sm:text-xl font-bold text-foreground flex items-center justify-center gap-1">
                     <Bell size={18} className="text-foreground/40" />
                     {todayCount}
                  </p>
                  <p className="text-[10px] sm:text-xs text-foreground/50 font-mono">today</p>
               </div>
               <div className="flex-1 border border-foreground/15 rounded-lg px-3 py-2 text-center">
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                     {nextWeekCount}
                  </p>
                  <p className="text-[10px] sm:text-xs text-foreground/50 font-mono">next 7d</p>
               </div>
               <div className="flex-1 border border-foreground/15 rounded-lg px-3 py-2 text-center">
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                     {reminders.length}
                  </p>
                  <p className="text-[10px] sm:text-xs text-foreground/50 font-mono">scheduled</p>
               </div>
            </div>

            <div className="flex items-center justify-end mb-4 p-1">
               <button
                  onClick={() => router.push("/reminders/new")}
                  className="px-4 py-2 bg-foreground text-background rounded-md font-medium text-xs sm:text-sm hover:bg-accent transition-colors cursor-pointer flex items-center gap-1.5"
               >
                  Create new reminder
               </button>
            </div>

            {loading ? (
               <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
               </div>
            ) : reminders.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <p className="text-sm sm:text-base text-foreground/70 mb-1">
                     No upcoming reminders
                  </p>
                  <p className="text-xs text-foreground/40 mb-4">
                     Create a reminder and it will stay here until the scheduled time passes.
                  </p>
                  <button
                     onClick={() => router.push("/reminders/new")}
                     className="px-4 py-2 bg-foreground text-background rounded-lg font-medium text-xs sm:text-sm hover:bg-accent transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                     {"> "}
                     Create reminder
                  </button>
               </div>
            ) : (
               <div className="flex flex-col gap-4 sm:gap-5">
                  {Object.entries(grouped).map(([label, items]) => (
                     <div key={label}>
                        <h3
                           className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                              label === "Today" ? "text-foreground" : "text-foreground/40"
                           }`}
                        >
                           {label}
                           <span className="ml-1.5 font-mono font-normal text-[10px]">
                              ({items.length})
                           </span>
                        </h3>
                        <div className="flex flex-col gap-2">
                           {items.map((reminder) => (
                              <ReminderCard
                                 key={reminder.id}
                                 reminder={reminder}
                                 onEdit={(id) => router.push(`/reminders/${id}`)}
                                 onDelete={handleDelete}
                              />
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
}
