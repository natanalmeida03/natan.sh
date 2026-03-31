"use client";

import { Archive, Lock, Pin, Tag } from "lucide-react";
import type { NoteListItem } from "@/types/notes";

interface NoteCardProps {
    note: NoteListItem;
    onOpen: (id: string) => void;
}

function formatUpdatedAt(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
        return "updated just now";
    }

    if (diffHours < 24) {
        return `updated ${diffHours}h ago`;
    }

    return `updated ${date.toLocaleDateString("en-us", {
        day: "2-digit",
        month: "short",
    })}`;
}

export default function NoteCard({ note, onOpen }: NoteCardProps) {
    return (
        <button
            type="button"
            onClick={() => onOpen(note.id)}
            className="w-full rounded-xl border border-foreground/15 bg-background p-4 text-left transition-all cursor-pointer hover:border-foreground/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.05)]"
        >
            <div className="flex items-start gap-3">
                <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{
                        backgroundColor: note.accent_color
                            ? `${note.accent_color}20`
                            : "color-mix(in srgb, var(--foreground1) 8%, transparent)",
                        color: note.accent_color || "var(--foreground1)",
                    }}
                >
                    {note.icon || "🗒️"}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-foreground">
                                {note.title}
                            </h3>
                            <p className="mt-1 text-[11px] font-mono text-foreground/40">
                                {formatUpdatedAt(note.updated_at)}
                            </p>
                        </div>

                        <div className="flex items-center gap-1.5 text-foreground/35">
                            {note.is_pinned && <Pin size={14} className="text-amber-500" />}
                            {note.is_archived && (
                                <Archive size={14} className="text-foreground/45" />
                            )}
                            {note.is_protected && (
                                <Lock size={14} className="text-rose-500" />
                            )}
                        </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-foreground/65">
                        {note.is_protected && note.is_locked
                            ? "Protected note. Open it and unlock with the note password to read or edit the content."
                            : note.excerpt || "Empty note"}
                    </p>

                    {note.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {note.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 rounded-full border border-foreground/10 px-2 py-1 text-[10px] font-mono text-foreground/55"
                                >
                                    <Tag size={10} />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
}
