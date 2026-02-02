"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Bell, CheckCircle2, AlertTriangle } from "lucide-react";
import ReminderCard from "@/components/ReminderCard";
import {
   getReminders,
   toggleReminderComplete,
   deleteReminder,
} from "@/lib/reminders";
import Header from "@/components/Header";

interface Reminder {
   id: string;
   title: string;
   description?: string | null;
   due_at: string;
   is_completed: boolean;
   completed_at?: string | null;
   recurrence_rule?: string | null;
   categories?: { id: string; name: string; color?: string | null; icon?: string | null } | null;
}

type Filter = "pending" | "overdue" | "completed";

export default function RemindersPage() {
   const router = useRouter();

   const [reminders, setReminders] = useState<Reminder[]>([]);
   const [loading, setLoading] = useState(true);
   const [filter, setFilter] = useState<Filter>("pending");

   const loadData = useCallback(async () => {
      setLoading(true);

      const completed = filter === "completed" ? true : false;
      const res = await getReminders({ completed });

      if (res.data) {
         let list = res.data as Reminder[];

         if (filter === "overdue") {
            const now = new Date();
            list = list.filter((r) => !r.is_completed && new Date(r.due_at) < now);
         }

         setReminders(list);
      }

      setLoading(false);
   }, [filter]);

   useEffect(() => {
      loadData();
   }, [loadData]);

   async function handleToggle(id: string) {
      const res = await toggleReminderComplete(id);
      if (!res.error) {
         // Remove da lista atual (muda de tab)
         setReminders((prev) => prev.filter((r) => r.id !== id));
      }
   }

   async function handleDelete(id: string) {
      const res = await deleteReminder(id);
      if (!res.error) {
         setReminders((prev) => prev.filter((r) => r.id !== id));
      }
   }

   // Stats
   const now = new Date();
   const pendingCount = reminders.length;
   const overdueCount =
      filter === "pending"
         ? reminders.filter((r) => new Date(r.due_at) < now).length
         : 0;
   const todayCount =
      filter === "pending"
         ? reminders.filter((r) => {
              const d = new Date(r.due_at);
              return (
                 d.getDate() === now.getDate() &&
                 d.getMonth() === now.getMonth() &&
                 d.getFullYear() === now.getFullYear()
              );
           }).length
         : 0;

   // Group reminders by date sections
   function groupByDate(list: Reminder[]) {
      const groups: Record<string, Reminder[]> = {};

      list.forEach((r) => {
         const d = new Date(r.due_at);
         const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
         const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
         const tomorrow = new Date(today);
         tomorrow.setDate(tomorrow.getDate() + 1);

         let label: string;
         if (target < today) label = "Overdue";
         else if (target.getTime() === today.getTime()) label = "Today";
         else if (target.getTime() === tomorrow.getTime()) label = "Tomorrow";
         else label = d.toLocaleDateString("en-us", { weekday: "long", day: "2-digit", month: "long" });

         if (!groups[label]) groups[label] = [];
         groups[label].push(r);
      });

      return groups;
   }

   const grouped = filter !== "completed" ? groupByDate(reminders) : { Concluídos: reminders };

   return (
      <div className="bg-[#F8F4EE] min-h-dvh flex">
         <div className="bg-[#F8F4EE] w-full max-w-[95%] sm:max-w-10/12 mx-auto flex flex-col py-6 sm:py-16">
            <Header />

            {/* Stats bar */}
            { (
               <div className="flex gap-3 mb-4 sm:mb-5">
                  <div className="flex-1 border border-[#2E2E2E]/15 rounded-lg px-3 py-2 text-center">
                     <p className="text-lg sm:text-xl font-bold text-[#2E2E2E] flex items-center justify-center gap-1">
                        <Bell size={18} className="text-[#2E2E2E]/40" />
                        {todayCount?todayCount:"0"}
                     </p>
                     <p className="text-[10px] sm:text-xs text-[#2E2E2E]/50 font-mono">today</p>
                  </div>
                  <div className="flex-1 border border-[#2E2E2E]/15 rounded-lg px-3 py-2 text-center">
                     <p className={`text-lg sm:text-xl font-bold flex items-center justify-center gap-1 ${
                        overdueCount && overdueCount > 0 ? "text-red-500" : "text-[#2E2E2E]"
                     }`}>
                        {overdueCount?overdueCount:0 > 0 && <AlertTriangle size={18} />}
                        {overdueCount?overdueCount:"0"}
                     </p>
                     <p className="text-[10px] sm:text-xs text-[#2E2E2E]/50 font-mono">overdue</p>
                  </div>
                  <div className="flex-1 border border-[#2E2E2E]/15 rounded-lg px-3 py-2 text-center">
                     <p className="text-lg sm:text-xl font-bold text-[#2E2E2E]">
                        {pendingCount?pendingCount:"0"}
                     </p>
                     <p className="text-[10px] sm:text-xs text-[#2E2E2E]/50 font-mono">pending</p>
                  </div>
               </div>
            )}

            {/* Filter tabs */}
            <div className="flex items-center gap-3 mb-4 p-1 justify-between">
                <div className="flex items-center gap-3 p-1">
                    {([
                        { key: "pending", label: "Pending" },
                        { key: "overdue", label: "Overdue" },
                        { key: "completed", label: "Completed" },
                    ] as const).map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`py-1.5 rounded-md text-sm cursor-pointer ${
                                filter === f.key
                                ? "font-bold "
                                : "hover:font-bold "
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => router.push("/reminders/new")}
                    className="px-4 py-2 bg-[#2E2E2E] text-[#F8F4EE] rounded-md font-medium text-xs sm:text-sm hover:bg-[#1a1a1a] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                    Create new reminder
                </button>
            </div>

            {/* List */}
            {loading ? (
               <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#2E2E2E]/20 border-t-[#2E2E2E] rounded-full animate-spin" />
               </div>
            ) : reminders.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <p className="text-sm sm:text-base text-[#2E2E2E]/70 mb-1">
                     {filter === "completed"
                        ? "No reminders completed"
                        : filter === "overdue"
                        ? "No late reminders!"
                        : "No pending reminders"}
                  </p>
                  <p className="text-xs text-[#2E2E2E]/40 mb-4">
                     {filter === "pending"
                        ? "Create your first reminder"
                        : filter === "overdue"
                        ? "You're up to date with everything."
                        : "Complete reminders to see them here."}
                  </p>
                  {filter === "pending" && (
                     <button
                        onClick={() => router.push("/reminders/new")}
                        className="px-4 py-2 bg-[#2E2E2E] text-[#F8F4EE] rounded-lg font-medium text-xs sm:text-sm hover:bg-[#1a1a1a] transition-colors cursor-pointer flex items-center gap-1.5"
                     >
                        {'> '}
                        Create reminder
                     </button>
                  )}
               </div>
            ) : (
               <div className="flex flex-col gap-4 sm:gap-5">
                  {Object.entries(grouped).map(([label, items]) => (
                     <div key={label}>
                        <h3
                           className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                              label === "Atrasados"
                                 ? "text-red-500"
                                 : label === "Today"
                                 ? "text-[#2E2E2E]"
                                 : "text-[#2E2E2E]/40"
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
                                 onToggle={handleToggle}
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