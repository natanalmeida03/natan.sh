"use client";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import HabitForm from "@/components/HabitForm";
import { createHabit } from "@/lib/habits";
import { getCategories } from "@/lib/categories";
import { Category } from "@/types";
import Header from "@/components/HeaderSecondary";

export default function NewHabitPage() {
   const router = useRouter();
   const [categories, setCategories] = useState<Category[]>([]);

   useEffect(() => {
      async function load() {
         const res = await getCategories();
         if (res.data) setCategories(res.data as Category[]);
      }
      load();
   }, []);

   async function handleSubmit(data: {
      title: string;
      description: string;
      category_id: string;
      icon: string;
      color: string;
      frequency_type: "daily" | "weekly" | "monthly";
      frequency_target: number;
   }) {
      const res = await createHabit({
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

      router.push("/habits");
      return {};
   }

   return (
      <div className="bg-[#F8F4EE] min-h-dvh flex">
         <div className="bg-[#F8F4EE] w-full max-w-[95%] sm:max-w-10/12 mx-auto flex flex-col py-6 sm:py-16">
            <Header backRoute={() => router.back()}/>
            <p className="mb-3">Create a new habit</p>
            <div className="flex items-center justify-center">
                <HabitForm
                categories={categories}
                onSubmit={handleSubmit}
                onCancel={() => router.back()}
                />
            </div>
         </div>
      </div>
   );
}