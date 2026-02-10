"use client";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import ReminderForm from "@/components/ReminderForm";
import { createReminder } from "@/lib/reminders";
import { getCategories } from "@/lib/categories";
import Header from "@/components/HeaderSecondary";

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
   notify_email: boolean;
}

export default function NewReminderPage() {
   const router = useRouter();
   const [categories, setCategories] = useState<Category[]>([]);

   useEffect(() => {
      async function load() {
         const res = await getCategories();
         if (res.data) setCategories(res.data as Category[]);
      }
      load();
   }, []);

   async function handleSubmit(data: ReminderFormData) {
      const dueAt = new Date(`${data.due_date}T${data.due_time}`).toISOString();

      const res = await createReminder({
         title: data.title,
         description: data.description || null,
         category_id: data.category_id || null,
         due_at: dueAt,
         recurrence_rule: data.is_recurring ? data.recurrence_type : null,
         recurrence_end_at: data.is_recurring && data.recurrence_end_date
            ? new Date(`${data.recurrence_end_date}T23:59:59`).toISOString()
            : null,
         notify_email: data.notify_email,
      });

      if (res.error) {
         return { error: res.error };
      }

      router.push("/reminders");
      return {};
   }

   return (
      <div className="bg-background min-h-dvh flex">
         <div className="bg-background w-full max-w-[95%] sm:max-w-10/12 mx-auto flex flex-col py-6 sm:py-16">
            <Header backRoute={() => router.back()}/>
            <p className="mb-3">Create a new reminder</p>
            <div className="flex items-center justify-center">
               <ReminderForm
                  categories={categories}
                  onSubmit={handleSubmit}
                  onCancel={() => router.back()}
                  submitLabel="Create reminder"
               />
            </div>
         </div>
      </div>
   );
}
