"use client";
import { Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface Reminder {
   id: string;
   title: string;
   due_at: string;
   is_completed: boolean;
   categories?: { name: string; color?: string | null } | null;
}

interface UpcomingRemindersProps {
   reminders: Reminder[];
   overdueCount: number;
}

function formatRelative(iso: string): string {
   const date = new Date(iso);
   const now = new Date();
   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
   const tomorrow = new Date(today);
   tomorrow.setDate(tomorrow.getDate() + 1);
   const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
   const time = date.toLocaleTimeString("en-us", { hour: "2-digit", minute: "2-digit" });

   if (target.getTime() === today.getTime()) return `Today, ${time}`;
   if (target.getTime() === tomorrow.getTime()) return `Tomorrow, ${time}`;
   return date.toLocaleDateString("en-us", { day: "2-digit", month: "short" }) + `, ${time}`;
}

export default function UpcomingReminders({ reminders, overdueCount }: UpcomingRemindersProps) {
   const router = useRouter();

   return (
      <div className="border border-foreground/15 rounded-lg p-3 sm:p-4">
         <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground">
               Upcoming reminders
            </h3>
            <button
               onClick={() => router.push("/reminders")}
               className="text-[10px] sm:text-xs text-foreground/40 hover:text-foreground transition-colors cursor-pointer flex items-center gap-0.5"
            >
               See all <ChevronRight size={12} />
            </button>
         </div>

         {/* Overdue alert */}
         {overdueCount > 0 && (
            <button
               onClick={() => router.push("/reminders")}
               className="w-full flex items-center gap-2 px-2.5 py-2 mb-2 bg-red-50 border border-red-200 rounded-md cursor-pointer hover:bg-red-100 transition-colors"
            >
               <AlertTriangle size={14} className="text-red-500 shrink-0" />
               <span className="text-xs text-red-600 font-medium">
                  {overdueCount} overdue reminder{overdueCount > 1 ? "s" : ""}
               </span>
            </button>
         )}

         {reminders.length === 0 && overdueCount === 0 ? (
            <p className="text-xs text-foreground/30 text-center py-3">
               No upcoming reminders
            </p>
         ) : (
            <div className="flex flex-col gap-1">
               {reminders.slice(0, 5).map((r) => (
                  <button
                     key={r.id}
                     onClick={() => router.push(`/reminders/${r.id}`)}
                     className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-foreground/3 transition-colors cursor-pointer text-left w-full"
                  >
                     <Clock size={13} className="text-foreground/30 shrink-0" />
                     <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-foreground truncate">{r.title}</p>
                        <p className="text-[10px] font-mono text-foreground/40">
                           {formatRelative(r.due_at)}
                        </p>
                     </div>
                     {r.categories && (
                        <span
                           className="text-[9px] px-1.5 py-0.5 rounded shrink-0"
                           style={{
                              backgroundColor: r.categories.color ? `${r.categories.color}20` : "color-mix(in srgb, var(--foreground1) 12%, transparent)",
                              color: r.categories.color || "var(--foreground1)",
                           }}
                        >
                           {r.categories.name}
                        </span>
                     )}
                  </button>
               ))}
            </div>
         )}
      </div>
   );
}
