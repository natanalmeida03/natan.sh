"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Save, Trash2 } from "lucide-react";
import { deleteDailyNote, getDailyNote, saveDailyNote } from "@/lib/daily-notes";
import type { HomeDailyNote } from "@/types/home";

type Mood = "great" | "good" | "neutral" | "bad" | "awful";

const MOODS: { value: Mood; emoji: string; label: string }[] = [
    { value: "awful", emoji: "\u{1F61E}", label: "Awful" },
    { value: "bad", emoji: "\u{1F615}", label: "Bad" },
    { value: "neutral", emoji: "\u{1F610}", label: "Neutral" },
    { value: "good", emoji: "\u{1F642}", label: "Good" },
    { value: "great", emoji: "\u{1F604}", label: "Great" },
];

interface DailyNoteProps {
    initialNote?: HomeDailyNote | null;
}

export default function DailyNote({ initialNote }: DailyNoteProps) {
    const hasInitialData = initialNote !== undefined;
    const [content, setContent] = useState(initialNote?.content || "");
    const [mood, setMood] = useState<Mood | null>(initialNote?.mood || null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [hasNote, setHasNote] = useState(
        hasInitialData ? initialNote !== null : false
    );
    const [loading, setLoading] = useState(!hasInitialData);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (hasInitialData) {
            return;
        }

        async function load() {
            const res = await getDailyNote();

            if (res.data) {
                setContent(res.data.content || "");
                setMood(res.data.mood as Mood | null);
                setHasNote(true);
            }

            setLoading(false);
        }

        void load();
    }, [hasInitialData]);

    useEffect(() => {
        if (loading || (!content && !mood)) {
            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

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
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [content, mood, loading]);

    async function handleSaveNow() {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

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
            <div className="border border-foreground/15 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-foreground/10 rounded w-32 mb-3" />
                <div className="h-20 bg-foreground/5 rounded" />
            </div>
        );
    }

    return (
        <div className="border border-foreground/15 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                        Note for Today
                    </h3>
                    <p className="text-[10px] sm:text-xs text-foreground/40 font-mono capitalize">
                        {today}
                    </p>
                </div>

                <div className="flex items-center gap-1.5">
                    {saving && (
                        <span className="text-[10px] text-foreground/40 font-mono">
                            saving...
                        </span>
                    )}
                    {saved && !saving && (
                        <span className="text-[10px] text-green-500 font-mono flex items-center gap-0.5">
                            <Check size={10} /> saved
                        </span>
                    )}

                    {(content || mood) && (
                        <button
                            onClick={handleSaveNow}
                            disabled={saving}
                            className="p-1 text-foreground/30 hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                            title="Save now"
                        >
                            <Save size={14} />
                        </button>
                    )}

                    {hasNote && (
                        <button
                            onClick={handleDelete}
                            className="p-1 text-foreground/30 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete note"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 mb-2.5">
                {MOODS.map((entry) => (
                    <button
                        key={entry.value}
                        onClick={() => setMood(mood === entry.value ? null : entry.value)}
                        className={`flex flex-col items-center px-2 py-1 rounded-md transition-all cursor-pointer ${
                            mood === entry.value
                                ? "bg-foreground/10 scale-110"
                                : "hover:bg-foreground/5"
                        }`}
                        title={entry.label}
                    >
                        <span className="text-base sm:text-lg">{entry.emoji}</span>
                        <span
                            className={`text-[8px] sm:text-[9px] font-mono mt-0.5 ${
                                mood === entry.value
                                    ? "text-foreground"
                                    : "text-foreground/30"
                            }`}
                        >
                            {entry.label}
                        </span>
                    </button>
                ))}
            </div>

            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="How was your day? What happened well? What do you want to focus on tomorrow?"
                rows={3}
                className="w-full bg-foreground/2 border border-foreground/10 rounded-lg px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-foreground/30 font-mono resize-none transition-colors"
            />
        </div>
    );
}
