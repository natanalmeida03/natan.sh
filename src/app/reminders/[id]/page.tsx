"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
   ChevronLeft,
   Pencil,
   Clock,
   Repeat,
   AlertTriangle,
   CheckCircle2,
   Tag,
} from "lucide-react";
import ReminderForm from "@/components/ReminderForm";
import DeleteConfirm from "@/components/DeleteConfirm";
import {
   getReminderById,
   updateReminder,
   deleteReminder,
   toggleReminderComplete,
} from "@/lib/reminders";
import { getCategories } from "@/lib/categories";
import Header from "@/components/HeaderSecondary";

interface Reminder {
   id: string;
   title: string;
   description?: string | null;
   due_at: string;
   is_completed: boolean;
   completed_at?: string | null;
   recurrence_rule?: string | null;
   recurrence_end_at?: string | null;
   category_id?: string | null;
   categories?: { id: string; name: string; color?: string | null; icon?: string | null } | null;
}

interface Category {
   id: string;
   name: string;
   color?: string | null;
   icon?: string | null;
}

interface ReminderFormData {
   title: string;
   description: string;
   category_id: string;
   due_date: string;
   due_time: string;
   is_recurring: boolean;
   recurrence_type: string;
   recurrence_days: string[];
   recurrence_end_date: string;
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

export default function ReminderDetailPage() {
   const router = useRouter();
   const params = useParams();
   const reminderId = params.id as string;

   const [reminder, setReminder] = useState<Reminder | null>(null);
   const [categories, setCategories] = useState<Category[]>([]);
   const [loading, setLoading] = useState(true);
   const [editing, setEditing] = useState(false);

   const loadData = useCallback(async () => {
      setLoading(true);

      const [reminderRes, categoriesRes] = await Promise.all([
         getReminderById(reminderId),
         getCategories(),
      ]);

      if (reminderRes.data) setReminder(reminderRes.data as Reminder);
      if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);

      setLoading(false);
   }, [reminderId]);

   useEffect(() => {
      loadData();
   }, [loadData]);

   async function handleToggle() {
      const res = await toggleReminderComplete(reminderId);
      if (!res.error) {
         await loadData();
      }
   }

   async function handleUpdate(data: ReminderFormData) {
      const dueAt = new Date(`${data.due_date}T${data.due_time}`).toISOString();

      const res = await updateReminder(reminderId, {
         title: data.title,
         description: data.description || null,
         category_id: data.category_id || null,
         due_at: dueAt,
         recurrence_rule: data.is_recurring ? data.recurrence_type : null,
         recurrence_end_at: data.is_recurring && data.recurrence_end_date
            ? new Date(`${data.recurrence_end_date}T23:59:59`).toISOString()
            : null,
      });

      if (res.error) {
         return { error: res.error };
      }

      setEditing(false);
      await loadData();
      return {};
   }

   async function handleDelete() {
      const res = await deleteReminder(reminderId);
      if (!res.error) {
         router.push("/reminders");
      }
   }

   if (loading) {
      return (
         <div className="relative mt-4 lg:mt-16 w-full flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
         </div>
      );
   }

   if (!reminder) {
      return (
         <div className="relative mt-4 lg:mt-16 w-full flex-1 flex flex-col items-center justify-center">
            <p className="text-sm text-foreground/50 mb-3">Lembrete não encontrado</p>
            <button
               onClick={() => router.push("/reminders")}
               className="px-4 py-2 bg-foreground text-background rounded-lg text-xs sm:text-sm cursor-pointer"
            >
               Voltar
            </button>
         </div>
      );
   }

   const dueDate = new Date(reminder.due_at);
   const overdue = !reminder.is_completed && dueDate < new Date();
   const recurrenceLabel = parseRecurrence(reminder.recurrence_rule);

   // Build initial form data from existing reminder
   const initialFormData: Partial<ReminderFormData> = {
      title: reminder.title,
      description: reminder.description || "",
      category_id: reminder.category_id || "",
      due_date: dueDate.toISOString().split("T")[0],
      due_time: `${String(dueDate.getHours()).padStart(2, "0")}:${String(dueDate.getMinutes()).padStart(2, "0")}`,
      is_recurring: !!reminder.recurrence_rule,
      recurrence_type: reminder.recurrence_rule || "FREQ=DAILY;INTERVAL=1",
      recurrence_end_date: reminder.recurrence_end_at
         ? new Date(reminder.recurrence_end_at).toISOString().split("T")[0]
         : "",
   };

   return (
      <div className="bg-background min-h-dvh flex">
         <div className="bg-background w-full max-w-[95%] sm:max-w-10/12 mx-auto flex flex-col py-6 sm:py-16">

            {editing ? (
               <div>
                  <Header backRoute={() => setEditing(false)} />

                  <p className="mb-3">Edit habit</p>
                  <div className="flex items-center justify-center">
                  <ReminderForm
                     initialData={initialFormData}
                     categories={categories}
                     onSubmit={handleUpdate}
                     onCancel={() => setEditing(false)}
                     submitLabel="Salvar alterações"
                  />
                  </div>
               </div>
            ) : (

               <div>
                  <Header backRoute={() => router.back()} />
                  <div className="flex flex-col gap-4 sm:gap-5">
                     {/* Status banner */}
                     {reminder.is_completed ? (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                           <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                           <div>
                              <p className="text-xs sm:text-sm font-medium text-green-700">Completed</p>
                              {reminder.completed_at && (
                                 <p className="text-[10px] sm:text-xs text-green-600/70 font-mono">
                                    {new Date(reminder.completed_at).toLocaleDateString("en-us", {
                                       day: "2-digit",
                                       month: "long",
                                       year: "numeric",
                                       hour: "2-digit",
                                       minute: "2-digit",
                                    })}
                                 </p>
                              )}
                           </div>
                        </div>
                     ) : overdue ? (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                           <AlertTriangle size={18} className="text-red-500 shrink-0" />
                           <p className="text-xs sm:text-sm font-medium text-red-700">Overdue</p>
                        </div>
                     ) : null}

                     {/* Details card */}
                     <div className="border border-foreground/15 rounded-lg p-4 flex flex-col gap-3">
                        {/* Description */}
                        {reminder.description && (
                           <p className="text-xs sm:text-sm text-foreground/70">
                              {reminder.description}
                           </p>
                        )}

                        {/* Due date */}
                        <div className="flex items-center gap-2">
                           <Clock size={15} className="text-foreground/40 shrink-0" />
                           <span
                              className={`text-xs sm:text-sm font-mono ${
                                 overdue ? "text-red-500" : "text-foreground/70"
                              }`}
                           >
                              {dueDate.toLocaleDateString("en-us", {
                                 weekday: "long",
                                 day: "2-digit",
                                 month: "long",
                                 year: "numeric",
                              })}
                              {" "}
                              {dueDate.toLocaleTimeString("en-us", {
                                 hour: "2-digit",
                                 minute: "2-digit",
                              })}
                           </span>
                        </div>

                        {/* Recurrence */}
                        {recurrenceLabel && (
                           <div className="flex items-center gap-2">
                              <Repeat size={15} className="text-blue-400 shrink-0" />
                              <span className="text-xs sm:text-sm text-blue-600 font-mono">
                                 {recurrenceLabel}
                                 {reminder.recurrence_end_at && (
                                    <span className="text-foreground/40">
                                       {" "}até{" "}
                                       {new Date(reminder.recurrence_end_at).toLocaleDateString("en-us", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                       })}
                                    </span>
                                 )}
                              </span>
                           </div>
                        )}

                        {/* Category */}
                        {reminder.categories && (
                           <div className="flex items-center gap-2">
                              <Tag size={15} className="text-foreground/40 shrink-0" />
                              <span
                                 className="text-xs sm:text-sm px-2 py-0.5 rounded"
                                 style={{
                                    backgroundColor: reminder.categories.color
                                       ? `${reminder.categories.color}20`
                                       : "#2E2E2E10",
                                    color: reminder.categories.color || "#2E2E2E",
                                 }}
                              >
                                 {reminder.categories.icon ? `${reminder.categories.icon} ` : ""}
                                 {reminder.categories.name}
                              </span>
                           </div>
                        )}
                     </div>

                     {/* Toggle complete button */}
                     <button
                        onClick={handleToggle}
                        className={`w-full px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                           reminder.is_completed
                              ? "border-2 border-foreground text-foreground hover:bg-foreground hover:text-background"
                              : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                     >
                        <CheckCircle2 size={16} />
                        {reminder.is_completed ? "Mark as pending" : "Mark as completed"}
                     </button>

                     {/* Danger zone */}
                     <div className="flex items-center gap-4 pt-4 border-t border-foreground/10">
                        <button
                           onClick={() => setEditing(true)}
                           className="flex items-center gap-2 px-4 py-2 border border-foreground rounded-md text-xs sm:text-sm text-foreground hover:bg-foreground hover:text-background transition-colors cursor-pointer"
                        >
                           Edit
                        </button>

                        <DeleteConfirm
                           title="Delete"
                           message={`Are you sure you want to delete "${reminder.title}"? All check-in history will be lost.`}
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
