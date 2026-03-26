"use client";
import { useState, useRef, useMemo } from "react";
import { X, ChevronDown } from "lucide-react";
import { Category, HabitFormData } from "@/types";


interface HabitFormProps {
   initialData?: Partial<HabitFormData>;
   categories: Category[];
   onSubmit: (data: HabitFormData) => Promise<{ error?: string }>;
   onCancel: () => void;
   submitLabel?: string;
}

const ICONS: { emoji: string; tags: string[] }[] = [
   // Health & Body
   { emoji: "💧", tags: ["water", "drink", "hydration", "agua"] },
   { emoji: "💤", tags: ["sleep", "rest", "nap", "dormir"] },
   { emoji: "💊", tags: ["medicine", "vitamin", "supplement", "remedio"] },
   { emoji: "🩺", tags: ["health", "doctor", "checkup", "saude"] },
   { emoji: "🧴", tags: ["skincare", "lotion", "cream", "pele"] },
   { emoji: "🦷", tags: ["teeth", "dental", "floss", "dente"] },
   // Fitness
   { emoji: "🏃", tags: ["run", "jog", "cardio", "correr"] },
   { emoji: "💪", tags: ["gym", "workout", "strength", "musculacao"] },
   { emoji: "🧘", tags: ["yoga", "meditate", "stretch", "alongamento"] },
   { emoji: "🚴", tags: ["bike", "cycle", "cycling", "bicicleta"] },
   { emoji: "🏊", tags: ["swim", "pool", "swimming", "nadar"] },
   { emoji: "⚽", tags: ["soccer", "football", "sport", "futebol"] },
   { emoji: "🎾", tags: ["tennis", "racket", "sport", "tenis"] },
   { emoji: "🧗", tags: ["climb", "rock", "boulder", "escalada"] },
   // Mind & Learning
   { emoji: "📚", tags: ["read", "book", "study", "ler", "livro"] },
   { emoji: "✍️", tags: ["write", "journal", "diary", "escrever"] },
   { emoji: "🧠", tags: ["brain", "think", "learn", "aprender"] },
   { emoji: "🎯", tags: ["target", "focus", "foco", "meta"] },
   { emoji: "📝", tags: ["note", "todo", "task", "tarefa"] },
   { emoji: "🗣️", tags: ["speak", "language", "talk", "falar", "idioma"] },
   // Creative
   { emoji: "🎵", tags: ["music", "instrument", "practice", "musica"] },
   { emoji: "🎨", tags: ["art", "paint", "draw", "pintar", "desenhar"] },
   { emoji: "📸", tags: ["photo", "camera", "picture", "foto"] },
   { emoji: "🎬", tags: ["video", "film", "movie", "filme"] },
   { emoji: "🎹", tags: ["piano", "keyboard", "keys", "teclado"] },
   { emoji: "🎸", tags: ["guitar", "strings", "rock", "violao"] },
   // Food & Nutrition
   { emoji: "🥗", tags: ["salad", "eat", "healthy", "food", "comida"] },
   { emoji: "🍎", tags: ["fruit", "apple", "snack", "fruta"] },
   { emoji: "🥤", tags: ["smoothie", "juice", "shake", "suco"] },
   { emoji: "🧑‍🍳", tags: ["cook", "recipe", "kitchen", "cozinhar"] },
   { emoji: "☕", tags: ["coffee", "tea", "morning", "cafe"] },
   // Productivity & Work
   { emoji: "💻", tags: ["code", "program", "work", "computador"] },
   { emoji: "📧", tags: ["email", "inbox", "mail", "correio"] },
   { emoji: "📊", tags: ["data", "chart", "report", "relatorio"] },
   { emoji: "⏰", tags: ["time", "alarm", "wake", "acordar"] },
   { emoji: "📅", tags: ["calendar", "plan", "schedule", "agenda"] },
   // Home & Life
   { emoji: "🧹", tags: ["clean", "sweep", "tidy", "limpar"] },
   { emoji: "🌱", tags: ["plant", "garden", "grow", "planta"] },
   { emoji: "🐕", tags: ["dog", "pet", "walk", "cachorro"] },
   { emoji: "🐈", tags: ["cat", "pet", "feed", "gato"] },
   { emoji: "🛒", tags: ["shop", "grocery", "buy", "compras"] },
   // Social & Emotional
   { emoji: "📞", tags: ["call", "phone", "family", "ligar", "familia"] },
   { emoji: "🤝", tags: ["connect", "friend", "social", "amigo"] },
   { emoji: "😊", tags: ["gratitude", "happy", "smile", "gratidao"] },
   { emoji: "🙏", tags: ["pray", "faith", "spiritual", "orar"] },
   // Finance
   { emoji: "💰", tags: ["money", "save", "finance", "dinheiro"] },
   { emoji: "📈", tags: ["invest", "stock", "growth", "investir"] },
   // Misc
   { emoji: "🚿", tags: ["shower", "bath", "hygiene", "banho"] },
   { emoji: "👔", tags: ["dress", "outfit", "clothes", "roupa"] },
   { emoji: "🧳", tags: ["travel", "trip", "pack", "viagem"] },
   { emoji: "♻️", tags: ["recycle", "eco", "green", "reciclar"] },
   { emoji: "🌅", tags: ["morning", "sunrise", "manha"] },
   { emoji: "🌙", tags: ["night", "evening", "bedtime", "noite"] },
];

const COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#E91E63", "#9C27B0", "#00BCD4", "#FF5722", "#607D8B"];

export default function HabitForm({
   initialData,
   categories,
   onSubmit,
   onCancel,
   submitLabel="> Create a habit",
}: HabitFormProps) {
   const [form, setForm] = useState<HabitFormData>({
      title: initialData?.title || "",
      description: initialData?.description || "",
      category_id: initialData?.category_id || "",
      icon: initialData?.icon || "",
      color: initialData?.color || "",
      frequency_type: initialData?.frequency_type || "daily",
      frequency_target: initialData?.frequency_target || 1,
   });

   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [iconOpen, setIconOpen] = useState(false);
   const [colorOpen, setColorOpen] = useState(false);
   const [iconSearch, setIconSearch] = useState("");
   const colorInputRef = useRef<HTMLInputElement>(null);

   const filteredIcons = useMemo(() => {
      if (!iconSearch.trim()) return ICONS;
      const q = iconSearch.toLowerCase().trim();
      return ICONS.filter(
         (i) =>
            i.tags.some((t) => t.includes(q)) ||
            i.emoji.includes(q)
      );
   }, [iconSearch]);

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

   function updateField<K extends keyof HabitFormData>(key: K, value: HabitFormData[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
   }

   return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-80">
         {/* Error */}
         {error && (
            <div className="p-2.5 sm:p-3 rounded-md flex items-center justify-between border border-red-400 bg-red-50">
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
         <fieldset className="border border-foreground rounded-md px-3 pb-2 pt-0">
            <legend className="text-xs text-foreground px-1">Title *</legend>
            <input
               type="text"
               required
               placeholder="ex: Drink water"
               value={form.title}
               onChange={(e) => updateField("title", e.target.value)}
               className="w-full bg-transparent text-foreground focus:outline-none py-1 font-mono text-sm"
            />
         </fieldset>

         {/* Description */}
         <fieldset className="border border-foreground rounded-md px-3 pb-2 pt-0">
            <legend className="text-xs text-foreground px-1">Description</legend>
            <textarea
               placeholder="optional"
               value={form.description}
               onChange={(e) => updateField("description", e.target.value)}
               rows={2}
               className="w-full bg-transparent text-foreground focus:outline-none py-1 font-mono text-sm resize-none"
            />
         </fieldset>

         {/* Frequency */}
         <div className="flex flex-col sm:flex-row gap-3">
            <fieldset className="border border-foreground rounded-md px-3 pb-2 pt-0 flex-1">
               <legend className="text-xs text-foreground px-1">Frequency *</legend>
               <select
                  value={form.frequency_type}
                  onChange={(e) =>
                     updateField("frequency_type", e.target.value as HabitFormData["frequency_type"])
                  }
                  className="w-full bg-transparent text-foreground focus:outline-none py-1 font-mono text-sm cursor-pointer"
               >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
               </select>
            </fieldset>

            {form.frequency_type !== "daily" && (
               <fieldset className="border border-foreground rounded-md px-3 pb-2 pt-0 w-full sm:w-32">
                  <legend className="text-xs text-foreground px-1">
                     times/{form.frequency_type === "weekly" ? "week" : "month"}
                  </legend>
                  <input
                     type="number"
                     min={1}
                     max={form.frequency_type === "weekly" ? 7 : 31}
                     value={form.frequency_target}
                     onChange={(e) => updateField("frequency_target", parseInt(e.target.value) || 1)}
                     className="w-full bg-transparent text-foreground focus:outline-none py-1 font-mono text-sm"
                  />
               </fieldset>
            )}
         </div>

         {/* Category */}
         {categories.length > 0 && (
            <fieldset className="border border-foreground rounded-md px-3 pb-2 pt-0">
               <legend className="text-xs text-foreground px-1">category</legend>
               <select
                  value={form.category_id}
                  onChange={(e) => updateField("category_id", e.target.value)}
                  className="w-full bg-transparent text-foreground focus:outline-none py-1 font-mono text-sm cursor-pointer"
               >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                     <option key={cat.id} value={cat.id}>
                        {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                     </option>
                  ))}
               </select>
            </fieldset>
         )}

         {/* Icon picker — collapsible */}
         <div className="rounded-md overflow-hidden">
            <button
               type="button"
               onClick={() => setIconOpen((v) => !v)}
               className="w-full flex items-center justify-between px-3 py-2.5 cursor-pointer"
            >
               <span className="text-xs text-foreground flex items-center gap-2">
                  Icon
                  {form.icon && (
                     <span className="text-base leading-none">{form.icon}</span>
                  )}
               </span>
               <ChevronDown
                  size={16}
                  className={`text-foreground transition-transform duration-200 ${
                     iconOpen ? "rotate-180" : ""
                  }`}
               />
            </button>

            <div
               className={`grid transition-all duration-200 ease-in-out ${
                  iconOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
               }`}
            >
               <div className="overflow-hidden">
                  <div className="px-3 pb-3 flex flex-col gap-2.5 ">
                     {/* Search */}
                     <div className="relative ">
                        <input
                           type="text"
                           placeholder="Search... (ex: water, read, gym)"
                           value={iconSearch}
                           onChange={(e) => setIconSearch(e.target.value)}
                           className="w-full bg-foreground/5 text-foreground rounded-md px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-foreground/30 placeholder:text-foreground/40"
                        />
                        {iconSearch && (
                           <button
                              type="button"
                              onClick={() => setIconSearch("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground cursor-pointer"
                           >
                              <X size={12} />
                           </button>
                        )}
                     </div>

                     {/* Grid */}
                     <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
                        {filteredIcons.length > 0 ? (
                           filteredIcons.map((icon) => (
                              <button
                                 key={icon.emoji}
                                 type="button"
                                 onClick={() =>
                                    updateField("icon", form.icon === icon.emoji ? "" : icon.emoji)
                                 }
                                 className={`w-9 h-9 rounded-md flex items-center justify-center text-lg transition-all cursor-pointer ${
                                    form.icon === icon.emoji
                                       ? "bg-foreground scale-110"
                                       : "bg-foreground/5 hover:bg-foreground/10"
                                 }`}
                              >
                                 {icon.emoji}
                              </button>
                           ))
                        ) : (
                           <span className="text-xs text-foreground/50 font-mono py-2 px-1">
                              No icons found for &quot;{iconSearch}&quot;
                           </span>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Color picker — collapsible */}
         <div className="ounded-lg overflow-hidden">
            <button
               type="button"
               onClick={() => setColorOpen((v) => !v)}
               className="w-full flex items-center justify-between px-3 py-2.5 cursor-pointer "
            >
               <span className="text-xs text-foreground flex items-center gap-2">
                  Color
                  {form.color && (
                     <span
                        className="w-3.5 h-3.5 rounded-full inline-block border border-foreground/20"
                        style={{ backgroundColor: form.color }}
                     />
                  )}
               </span>
               <ChevronDown
                  size={16}
                  className={`text-foreground transition-transform duration-200 ${
                     colorOpen ? "rotate-180" : ""
                  }`}
               />
            </button>

            <div
               className={`grid transition-all duration-200 ease-in-out ${
                  colorOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
               }`}
            >
               <div className="overflow-hidden">
                  <div className="px-3 pb-3">
                     <div className="flex flex-wrap gap-2 items-center">
                        {COLORS.map((color) => (
                           <button
                              key={color}
                              type="button"
                              onClick={() =>
                                 updateField("color", form.color === color ? "" : color)
                              }
                              className={`w-8 h-8 rounded-full transition-all cursor-pointer ${
                                 form.color === color
                                    ? "ring-2 ring-offset-2 ring-foreground scale-110"
                                    : "hover:scale-110"
                              }`}
                              style={{ backgroundColor: color }}
                           />
                        ))}

                        {/* Custom color picker */}
                        <div className="relative">
                           <input
                              ref={colorInputRef}
                              type="color"
                              value={
                                 form.color && !COLORS.includes(form.color)
                                    ? form.color
                                    : "#888888"
                              }
                              onChange={(e) => updateField("color", e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                           />
                           <button
                              type="button"
                              onClick={() => colorInputRef.current?.click()}
                              className={`w-8 h-8 rounded-full transition-all cursor-pointer border-2 border-dashed border-foreground/30 hover:border-foreground/60 flex items-center justify-center ${
                                 form.color && !COLORS.includes(form.color)
                                    ? "ring-2 ring-offset-2 ring-foreground scale-110"
                                    : "hover:scale-110"
                              }`}
                              style={
                                 form.color && !COLORS.includes(form.color)
                                    ? { backgroundColor: form.color }
                                    : undefined
                              }
                           >
                              {(!form.color || COLORS.includes(form.color)) && (
                                 <span className="text-foreground/40 text-xs font-bold">+</span>
                              )}
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Actions */}
         <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <button
               type="button"
               onClick={onCancel}
               className="flex-1 px-4 py-2 border-2 border-foreground text-foreground rounded-md font-medium text-xs sm:text-sm hover:bg-foreground hover:text-background transition-colors cursor-pointer"
            >
               Cancel
            </button>
            <button
               type="submit"
               disabled={loading}
               className="flex-2 px-4 py-2 bg-foreground text-background rounded-md font-medium text-xs sm:text-sm hover:bg-accent transition-colors cursor-pointer disabled:opacity-50"
            >
               {loading ? "Saving..." : submitLabel}
            </button>
         </div>
      </form>
   );
}
