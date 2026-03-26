"use client";
import { useState } from "react";
import { Check, Trash2, Clock, Repeat, AlertTriangle } from "lucide-react";

interface ReminderCardProps {
   reminder: {
      id: string;
      title: string;
      description?: string | null;
      due_at: string;
      is_completed: boolean;
      completed_at?: string | null;
      recurrence_rule?: string | null;
      categories?: { name: string; color?: string | null } | null;
   };
   onToggle: (id: string) => Promise<void>;
   onEdit: (id: string) => void;
   onDelete: (id: string) => Promise<void>;
}

function formatDueDate(iso: string): string {
   const date = new Date(iso);
   const now = new Date();
   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
   const tomorrow = new Date(today);
   tomorrow.setDate(tomorrow.getDate() + 1);
   const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

   const time = date.toLocaleTimeString("en-us", { hour: "2-digit", minute: "2-digit" });

   if (target.getTime() === today.getTime()) return `Today, ${time}`;
   if (target.getTime() === tomorrow.getTime()) return `Tomorrow, ${time}`;

   const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
   if (diff < 0) return `${Math.abs(diff)}d before, ${time}`;
   if (diff <= 7) return `${date.toLocaleDateString("en-us", { weekday: "short" })}, ${time}`;

   return date.toLocaleDateString("en-us", { day: "2-digit", month: "short" }) + `, ${time}`;
}

function isOverdue(iso: string, completed: boolean): boolean {
   if (completed) return false;
   return new Date(iso) < new Date();
}

const DAY_LABELS: Record<string, string> = {
   MO: "Mon", TU: "Tue", WE: "Wed", TH: "Thu", FR: "Fri", SA: "Sat", SU: "Sun",
};

function parseRecurrence(rule?: string | null): string | null {
   if (!rule) return null;
   const byDayMatch = rule.match(/BYDAY=([A-Z,]+)/);
   if (byDayMatch) {
      const days = byDayMatch[1].split(",").map((d) => DAY_LABELS[d] || d);
      return days.join(", ");
   }
   if (rule.includes("DAILY")) return "Daily";
   if (rule.includes("WEEKLY")) return "Weekly";
   if (rule.includes("MONTHLY")) return "Monthly";
   if (rule.includes("YEARLY")) return "Yearly";
   return "Recurring";
}

export default function ReminderCard({ reminder, onToggle, onEdit, onDelete }: ReminderCardProps) {
   const [loading, setLoading] = useState(false);

   const overdue = isOverdue(reminder.due_at, reminder.is_completed);
   const recurrenceLabel = parseRecurrence(reminder.recurrence_rule);

   async function handleToggle(e: React.MouseEvent) {
      e.stopPropagation();
      setLoading(true);
      await onToggle(reminder.id);
      setLoading(false);
   }

   return (
      <div
         onClick={() => onEdit(reminder.id)}
         className={`relative border rounded-lg p-3 sm:p-4 transition-all cursor-pointer ${
            reminder.is_completed
               ? "border-foreground/10 bg-foreground/2"
               : overdue
               ? "border-red-300 bg-red-50/40"
               : "border-foreground/20 bg-background"
         }`}
      >
         <div className="flex items-start gap-3">
            {/* Check button */}
            <button
               onClick={handleToggle}
               disabled={loading}
               className={`shrink-0 mt-0.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed ${
                  reminder.is_completed
                     ? "bg-foreground/20 text-foreground/40"
                     : overdue
                     ? "border-2 border-red-400 text-transparent hover:bg-red-500 hover:text-white"
                     : "border-2 border-foreground/30 text-transparent hover:border-green-400 hover:text-green-400"
               }`}
            >
               <Check size={16} strokeWidth={3} />
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
               <h3
                  className={`text-sm sm:text-base font-semibold truncate ${
                     reminder.is_completed
                        ? "line-through text-foreground/35"
                        : "text-foreground"
                  }`}
               >
                  {reminder.title}
               </h3>

               {reminder.description && (
                  <p
                     className={`text-xs mt-0.5 truncate ${
                        reminder.is_completed ? "text-foreground/25" : "text-foreground/50"
                     }`}
                  >
                     {reminder.description}
                  </p>
               )}

               <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {/* Due date */}
                  <span
                     className={`text-[10px] sm:text-xs font-mono flex items-center gap-1 ${
                        reminder.is_completed
                           ? "text-foreground/30"
                           : overdue
                           ? "text-red-500"
                           : "text-foreground/60"
                     }`}
                  >
                     {overdue ? <AlertTriangle size={11} /> : <Clock size={11} />}
                     {formatDueDate(reminder.due_at)}
                  </span>

                  {/* Recurrence */}
                  {recurrenceLabel && (
                     <span className="text-[10px] sm:text-xs font-mono text-blue-500 flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded">
                        <Repeat size={10} />
                        {recurrenceLabel}
                     </span>
                  )}

                  {/* Category */}
                  {reminder.categories && (
                     <span
                        className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded"
                        style={{
                           backgroundColor: reminder.categories.color
                              ? `${reminder.categories.color}20`
                              : "color-mix(in srgb, var(--foreground1) 12%, transparent)",
                           color: reminder.categories.color || "var(--foreground1)",
                        }}
                     >
                        {reminder.categories.name}
                     </span>
                  )}
               </div>
            </div>

            {/* Delete button */}
            <button
               onClick={async (e) => {
                  e.stopPropagation();
                  await onDelete(reminder.id);
               }}
               className="shrink-0 p-1.5 text-foreground/40 hover:text-red-500 transition-colors cursor-pointer rounded-md hover:bg-red-50"
               title="Excluir"
            >
               <Trash2 size={15} />
            </button>
         </div>
      </div>
   );
}
