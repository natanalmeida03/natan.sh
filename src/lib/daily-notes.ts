"use server";
import { createClient } from "@/utils/supabase/server";

type Mood = "great" | "good" | "neutral" | "bad" | "awful";

export async function getDailyNote(date?: string) {
   const supabase = await createClient();

   const {
      data: { user },
      error: authError,
   } = await supabase.auth.getUser();

   if (authError || !user) {
      return { error: "User not authenticated" };
   }

   const noteDate = date || new Date().toISOString().split("T")[0];

   const { data, error } = await supabase
      .from("daily_notes")
      .select("*")
      .eq("user_id", user.id)
      .eq("note_date", noteDate)
      .maybeSingle();

   if (error) {
      return { error: error.message };
   }

   return { data };
}

// Alias para o calendário interativo — busca nota por data específica
export async function getDailyNoteByDate(date: string) {
   return getDailyNote(date);
}

// Busca todas as datas do mês que têm nota (para os dots do calendário)
export async function getNotesForMonth(year: number, month: number) {
   const supabase = await createClient();

   const {
      data: { user },
      error: authError,
   } = await supabase.auth.getUser();

   if (authError || !user) {
      return { error: "User not authenticated" };
   }

   const from = `${year}-${String(month).padStart(2, "0")}-01`;
   const lastDay = new Date(year, month, 0).getDate();
   const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

   const { data, error } = await supabase
      .from("daily_notes")
      .select("note_date")
      .eq("user_id", user.id)
      .gte("note_date", from)
      .lte("note_date", to);

   if (error) {
      return { error: error.message };
   }

   // Retorna array de datas "YYYY-MM-DD" que possuem nota
   const dates = (data || []).map((n) => n.note_date as string);
   return { data: dates };
}

export async function getRecentNotes(limit: number = 7) {
   const supabase = await createClient();

   const {
      data: { user },
      error: authError,
   } = await supabase.auth.getUser();

   if (authError || !user) {
      return { error: "User not authenticated" };
   }

   const { data, error } = await supabase
      .from("daily_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("note_date", { ascending: false })
      .limit(limit);

   if (error) {
      return { error: error.message };
   }

   return { data };
}

export async function saveDailyNote(input: {
   content: string;
   mood?: Mood | null;
   date?: string;
}) {
   const supabase = await createClient();

   const {
      data: { user },
      error: authError,
   } = await supabase.auth.getUser();

   if (authError || !user) {
      return { error: "User not authenticated" };
   }

   const noteDate = input.date || new Date().toISOString().split("T")[0];

   const { data, error } = await supabase
      .from("daily_notes")
      .upsert(
         {
            user_id: user.id,
            note_date: noteDate,
            content: input.content,
            mood: input.mood || null,
         },
         { onConflict: "user_id,note_date" }
      )
      .select()
      .single();

   if (error) {
      return { error: error.message };
   }

   return { success: true, data };
}

export async function deleteDailyNote(date?: string) {
   const supabase = await createClient();

   const {
      data: { user },
      error: authError,
   } = await supabase.auth.getUser();

   if (authError || !user) {
      return { error: "User not authenticated" };
   }

   const noteDate = date || new Date().toISOString().split("T")[0];

   const { error } = await supabase
      .from("daily_notes")
      .delete()
      .eq("user_id", user.id)
      .eq("note_date", noteDate);

   if (error) {
      return { error: error.message };
   }

   return { success: true };
}