"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Lock, NotebookText, Plus, Search } from "lucide-react";
import Header from "@/components/Header";
import NoteCard from "@/components/NoteCard";
import { getNotes } from "@/lib/notes";
import type { NoteListItem } from "@/types/notes";

export default function NotesPage() {
    const router = useRouter();
    const [notes, setNotes] = useState<NoteListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState<string>("all");
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void (async () => {
                const res = await getNotes();

                if (res.data) {
                    setNotes(res.data as NoteListItem[]);
                }

                if (res.error) {
                    setError(res.error);
                }

                setLoading(false);
            })();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, []);

    const normalizedQuery = query.trim().toLowerCase();
    const allTags = [...new Set(notes.flatMap((note) => note.tags))].sort((left, right) =>
        left.localeCompare(right)
    );
    const visibleNotes = notes.filter((note) => {
        if (!showArchived && note.is_archived) {
            return false;
        }

        if (selectedTag !== "all" && !note.tags.includes(selectedTag)) {
            return false;
        }

        if (!normalizedQuery) {
            return true;
        }

        return [note.title, note.excerpt || "", note.tags.join(" ")]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
    });

    const activeCount = notes.filter((note) => !note.is_archived).length;
    const archivedCount = notes.filter((note) => note.is_archived).length;
    const protectedCount = notes.filter((note) => note.is_protected).length;

    return (
        <div className="bg-background min-h-dvh flex">
            <div className="bg-background w-full max-w-[95%] sm:max-w-10/12 xl:max-w-6xl mx-auto flex flex-col py-6 sm:py-16">
                <Header />

                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-foreground/15 px-4 py-3">
                        <p className="text-lg font-bold text-foreground">{activeCount}</p>
                        <p className="text-[11px] font-mono text-foreground/45">active notes</p>
                    </div>
                    <div className="rounded-xl border border-foreground/15 px-4 py-3">
                        <p className="text-lg font-bold text-foreground">{protectedCount}</p>
                        <p className="text-[11px] font-mono text-foreground/45">protected</p>
                    </div>
                    <div className="rounded-xl border border-foreground/15 px-4 py-3">
                        <p className="text-lg font-bold text-foreground">{archivedCount}</p>
                        <p className="text-[11px] font-mono text-foreground/45">archived</p>
                    </div>
                </div>

                <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-foreground/12 bg-foreground/2 p-3 sm:p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative w-full lg:max-w-md">
                            <Search
                                size={16}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30"
                            />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search title, excerpt or tags"
                                className="w-full rounded-lg border border-foreground/12 bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/25 focus:border-foreground/25"
                            />
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => setShowArchived((prev) => !prev)}
                                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer sm:text-sm ${
                                    showArchived
                                        ? "border-foreground bg-foreground text-background"
                                        : "border-foreground/12 bg-background text-foreground/65 hover:text-foreground"
                                }`}
                            >
                                <Archive size={14} />
                                {showArchived ? "Hide archived" : "Show archived"}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push("/notes/new")}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2 text-xs font-medium text-background transition-colors cursor-pointer hover:bg-accent sm:text-sm"
                            >
                                <Plus size={14} />
                                New note
                            </button>
                        </div>
                    </div>

                    {allTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedTag("all")}
                                className={`rounded-full px-3 py-1 text-[11px] font-mono transition-colors cursor-pointer ${
                                    selectedTag === "all"
                                        ? "bg-foreground text-background"
                                        : "border border-foreground/12 bg-background text-foreground/55 hover:text-foreground"
                                }`}
                            >
                                all tags
                            </button>
                            {allTags.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setSelectedTag(tag)}
                                    className={`rounded-full px-3 py-1 text-[11px] font-mono transition-colors cursor-pointer ${
                                        selectedTag === tag
                                            ? "bg-foreground text-background"
                                            : "border border-foreground/12 bg-background text-foreground/55 hover:text-foreground"
                                    }`}
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-300 bg-red-50 px-6 py-10 text-center">
                        <p className="text-base text-red-700">Unable to load notes</p>
                        <p className="mt-1 text-sm text-red-700/80">{error}</p>
                    </div>
                ) : visibleNotes.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/15 px-6 py-16 text-center">
                        <NotebookText size={34} className="mb-3 text-foreground/25" />
                        <p className="text-base text-foreground/75">
                            {notes.length === 0
                                ? "No notes yet"
                                : "No notes match the current filters"}
                        </p>
                        <p className="mt-1 text-sm text-foreground/40">
                            {notes.length === 0
                                ? "Create your first note with Markdown, tags and optional password protection."
                                : "Try another search, tag or archive filter."}
                        </p>
                        {notes.length === 0 && (
                            <button
                                type="button"
                                onClick={() => router.push("/notes/new")}
                                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors cursor-pointer hover:bg-accent"
                            >
                                <Plus size={15} />
                                Create note
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        {visibleNotes.map((note) => (
                            <div key={note.id} className="relative">
                                <NoteCard
                                    note={note}
                                    onOpen={(id) => router.push(`/notes/${id}`)}
                                />
                                {note.is_protected && (
                                    <div className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-mono text-rose-600">
                                        <Lock size={11} />
                                        password
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
