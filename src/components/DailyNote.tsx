"use client";
import { useState, useEffect, useRef } from "react";
import { Save, Check, Trash2 } from "lucide-react";
import { saveDailyNote, getDailyNote, deleteDailyNote } from "@/lib/daily-notes";

type Mood = "great" | "good" | "neutral" | "bad" | "awful";

const MOODS: { value: Mood; emoji: string; label: string }[] = [
   { value: "awful", emoji: "😞", label: "Awful" },
   { value: "bad", emoji: "😕", label: "Bad" },
   { value: "neutral", emoji: "😐", label: "Neutral" },
   { value: "good", emoji: "🙂", label: "Good" },
   { value: "great", emoji: "😄", label: "Great" },
];

export default function DailyNote() {
   const [content, setContent] = useState("");
   const [mood, setMood] = useState<Mood | null>(null);
   const [saving, setSaving] = useState(false);
   const [saved, setSaved] = useState(false);
   const [hasNote, setHasNote] = useState(false);
   const [loading, setLoading] = useState(true);
   const debounceRef = useRef<NodeJS.Timeout | null>(null);

   useEffect(() => {
      async function load() {
         const res = await getDailyNote();
         if (res.data) {
            setContent(res.data.content || "");
            setMood(res.data.mood as Mood | null);
            setHasNote(true);
         }
         setLoading(false);
      }
      load();
   }, []);

   // Autosave com debounce de 1.5s
   useEffect(() => {
      if (loading) return;
      if (!content && !mood) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
         setSaving(true);
         const res = await saveDailyNote({ content, mood });
         if (!res.error) {
            setHasNote(true);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
         }
         setSaving(false);
      }, 1500);

      return () => {
         if (debounceRef.current) clearTimeout(debounceRef.current);
      };
   }, [content, mood, loading]);

   async function handleSaveNow() {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaving(true);
      const res = await saveDailyNote({ content, mood });
      if (!res.error) {
         setHasNote(true);
         setSaved(true);
         setTimeout(() => setSaved(false), 2000);
      }
      setSaving(false);
   }

   async function handleDelete() {
      const res = await deleteDailyNote();
      if (!res.error) {
         setContent("");
         setMood(null);
         setHasNote(false);
      }
   }

   const today = new Date().toLocaleDateString("en-us", {
      weekday: "long",
      day: "2-digit",
      month: "long",
   });

   if (loading) {
      return (
         <div className="border border-[#2E2E2E]/15 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-[#2E2E2E]/10 rounded w-32 mb-3" />
            <div className="h-20 bg-[#2E2E2E]/5 rounded" />
         </div>
      );
   }

   return (
      <div className="border border-[#2E2E2E]/15 rounded-lg p-3 sm:p-4">
         {/* Header */}
         <div className="flex items-center justify-between mb-2">
            <div>
               <h3 className="text-xs sm:text-sm font-semibold text-[#2E2E2E]">
                  Note for Today
               </h3>
               <p className="text-[10px] sm:text-xs text-[#2E2E2E]/40 font-mono capitalize">
                  {today}
               </p>
            </div>

            <div className="flex items-center gap-1.5">
               {/* Save indicator */}
               {saving && (
                  <span className="text-[10px] text-[#2E2E2E]/40 font-mono">saving...</span>
               )}
               {saved && !saving && (
                  <span className="text-[10px] text-green-500 font-mono flex items-center gap-0.5">
                     <Check size={10} /> saved
                  </span>
               )}

               {/* Manual save */}
               {(content || mood) && (
                  <button
                     onClick={handleSaveNow}
                     disabled={saving}
                     className="p-1 text-[#2E2E2E]/30 hover:text-[#2E2E2E] transition-colors cursor-pointer disabled:opacity-50"
                     title="Save now"
                  >
                     <Save size={14} />
                  </button>
               )}

               {/* Delete */}
               {hasNote && (
                  <button
                     onClick={handleDelete}
                     className="p-1 text-[#2E2E2E]/30 hover:text-red-500 transition-colors cursor-pointer"
                     title="Delete note"
                  >
                     <Trash2 size={14} />
                  </button>
               )}
            </div>
         </div>

         {/* Mood picker */}
         <div className="flex items-center gap-1 mb-2.5">
            {MOODS.map((m) => (
               <button
                  key={m.value}
                  onClick={() => setMood(mood === m.value ? null : m.value)}
                  className={`flex flex-col items-center px-2 py-1 rounded-md transition-all cursor-pointer ${
                     mood === m.value
                        ? "bg-[#2E2E2E]/10 scale-110"
                        : "hover:bg-[#2E2E2E]/5"
                  }`}
                  title={m.label}
               >
                  <span className="text-base sm:text-lg">{m.emoji}</span>
                  <span
                     className={`text-[8px] sm:text-[9px] font-mono mt-0.5 ${
                        mood === m.value ? "text-[#2E2E2E]" : "text-[#2E2E2E]/30"
                     }`}
                  >
                     {m.label}
                  </span>
               </button>
            ))}
         </div>

         {/* Text area */}
         <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="How was your day? What happened well? What do you want to focus on tomorrow?"
            rows={3}
            className="w-full bg-[#2E2E2E]/2 border border-[#2E2E2E]/10 rounded-lg px-3 py-2 text-xs sm:text-sm text-[#2E2E2E] placeholder:text-[#2E2E2E]/25 focus:outline-none focus:border-[#2E2E2E]/30 font-mono resize-none transition-colors"
         />
      </div>
   );
}