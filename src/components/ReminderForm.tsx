"use client";
import { useState } from "react";
import { X } from "lucide-react";

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
   recurrence_end_date: string;
}

interface ReminderFormProps {
   initialData?: Partial<ReminderFormData>;
   categories: Category[];
   onSubmit: (data: ReminderFormData) => Promise<{ error?: string }>;
   onCancel: () => void;
   submitLabel?: string;
}

export default function ReminderForm({
   initialData,
   categories,
   onSubmit,
   onCancel,
   submitLabel = "Criar lembrete",
}: ReminderFormProps) {
   const now = new Date();
   const defaultDate = now.toISOString().split("T")[0];
   const defaultTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

   const [form, setForm] = useState<ReminderFormData>({
      title: initialData?.title || "",
      description: initialData?.description || "",
      category_id: initialData?.category_id || "",
      due_date: initialData?.due_date || defaultDate,
      due_time: initialData?.due_time || defaultTime,
      is_recurring: initialData?.is_recurring || false,
      recurrence_type: initialData?.recurrence_type || "FREQ=DAILY;INTERVAL=1",
      recurrence_end_date: initialData?.recurrence_end_date || "",
   });

   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setLoading(true);
      setError(null);

      const result = await onSubmit(form);

      if (result?.error) {
         setError(result.error);
         setLoading(false);
      }
   }

   function updateField<K extends keyof ReminderFormData>(key: K, value: ReminderFormData[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
   }

   return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
         {/* Error */}
         {error && (
            <div className="p-2.5 sm:p-3 rounded-lg flex items-center justify-between border border-red-400 bg-red-50">
               <span className="text-xs sm:text-sm text-red-700">{error}</span>
               <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 cursor-pointer shrink-0 ml-2"
               >
                  <X size={16} />
               </button>
            </div>
         )}

         {/* Title */}
         <fieldset className="border border-[#2E2E2E] rounded-lg px-3 pb-2 pt-0">
            <legend className="text-xs text-[#2E2E2E] px-1">Title *</legend>
            <input
               type="text"
               required
               placeholder="ex: Meeting with team"
               value={form.title}
               onChange={(e) => updateField("title", e.target.value)}
               className="w-full bg-transparent text-[#2E2E2E] focus:outline-none py-1 font-mono text-sm"
            />
         </fieldset>

         {/* Description */}
         <fieldset className="border border-[#2E2E2E] rounded-lg px-3 pb-2 pt-0">
            <legend className="text-xs text-[#2E2E2E] px-1">description</legend>
            <textarea
               placeholder="optional"
               value={form.description}
               onChange={(e) => updateField("description", e.target.value)}
               rows={2}
               className="w-full bg-transparent text-[#2E2E2E] focus:outline-none py-1 font-mono text-sm resize-none"
            />
         </fieldset>

         {/* Date & Time */}
         <div className="flex flex-col sm:flex-row gap-3">
            <fieldset className="border border-[#2E2E2E] rounded-lg px-3 pb-2 pt-0 flex-1">
               <legend className="text-xs text-[#2E2E2E] px-1">Date *</legend>
               <input
                  type="date"
                  required
                  value={form.due_date}
                  onChange={(e) => updateField("due_date", e.target.value)}
                  className="w-full bg-transparent text-[#2E2E2E] focus:outline-none py-1 font-mono text-sm cursor-pointer"
               />
            </fieldset>

            <fieldset className="border border-[#2E2E2E] rounded-lg px-3 pb-2 pt-0 w-full sm:w-40">
               <legend className="text-xs text-[#2E2E2E] px-1">Time *</legend>
               <input
                  type="time"
                  required
                  value={form.due_time}
                  onChange={(e) => updateField("due_time", e.target.value)}
                  className="w-full bg-transparent text-[#2E2E2E] focus:outline-none py-1 font-mono text-sm cursor-pointer"
               />
            </fieldset>
         </div>

         {/* Category */}
         {categories.length > 0 && (
            <fieldset className="border border-[#2E2E2E] rounded-lg px-3 pb-2 pt-0">
               <legend className="text-xs text-[#2E2E2E] px-1">category</legend>
               <select
                  value={form.category_id}
                  onChange={(e) => updateField("category_id", e.target.value)}
                  className="w-full bg-transparent text-[#2E2E2E] focus:outline-none py-1 font-mono text-sm cursor-pointer"
               >
                  <option value="">Sem categoria</option>
                  {categories.map((cat) => (
                     <option key={cat.id} value={cat.id}>
                        {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                     </option>
                  ))}
               </select>
            </fieldset>
         )}

         {/* Recurrence toggle */}
         <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => updateField("is_recurring", !form.is_recurring)}
         >
            <div
               className={`w-9 h-5 rounded-full transition-colors relative ${
                  form.is_recurring ? "bg-[#2E2E2E]" : "bg-[#2E2E2E]/20"
               }`}
            >
               <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#F8F4EE] transition-transform ${
                     form.is_recurring ? "translate-x-4" : "translate-x-0.5"
                  }`}
               />
            </div>
            <span className="text-xs sm:text-sm text-[#2E2E2E]">Repeat reminder</span>
         </div>

         {/* Recurrence options */}
         {form.is_recurring && (
            <div className="flex flex-col sm:flex-row gap-3 pl-0 ">
               <fieldset className="border border-[#2E2E2E] rounded-lg px-3 pb-2 pt-0 flex-1">
                  <legend className="text-xs text-[#2E2E2E] px-1">Recurrency</legend>
                  <select
                     value={form.recurrence_type}
                     onChange={(e) => updateField("recurrence_type", e.target.value)}
                     className="w-full bg-transparent text-[#2E2E2E] focus:outline-none py-1 font-mono text-sm cursor-pointer"
                  >
                     <option value="FREQ=DAILY;INTERVAL=1">Daily</option>
                     <option value="FREQ=WEEKLY;INTERVAL=1">Weekly</option>
                     <option value="FREQ=MONTHLY;INTERVAL=1">Monthly</option>
                     <option value="FREQ=YEARLY;INTERVAL=1">Yearly</option>
                  </select>
               </fieldset>

               <fieldset className="border border-[#2E2E2E] rounded-lg px-3 pb-2 pt-0 flex-1">
                  <legend className="text-xs text-[#2E2E2E] px-1">repeat until</legend>
                  <input
                     type="date"
                     value={form.recurrence_end_date}
                     onChange={(e) => updateField("recurrence_end_date", e.target.value)}
                     className="w-full bg-transparent text-[#2E2E2E] focus:outline-none py-1 font-mono text-sm cursor-pointer"
                     placeholder="Sem limite"
                  />
               </fieldset>
            </div>
         )}

         {/* Actions */}
         <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <button
               type="button"
               onClick={onCancel}
               className="flex-1 px-4 py-2 border-2 border-[#2E2E2E] text-[#2E2E2E] rounded-lg font-medium text-xs sm:text-sm hover:bg-[#2E2E2E] hover:text-[#F8F4EE] transition-colors cursor-pointer"
            >
               Cancel
            </button>
            <button
               type="submit"
               disabled={loading}
               className="flex-2 px-4 py-2 bg-[#2E2E2E] text-[#F8F4EE] rounded-lg font-medium text-xs sm:text-sm hover:bg-[#1a1a1a] transition-colors cursor-pointer disabled:opacity-50"
            >
               {loading ? "Saving..." : "> Create Reminder"}
            </button>
         </div>
      </form>
   );
}