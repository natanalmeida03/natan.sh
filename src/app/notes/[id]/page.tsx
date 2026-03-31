"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Archive,
    Clock3,
    Lock,
    Pin,
    Shield,
    Tag,
} from "lucide-react";
import Header from "@/components/HeaderSecondary";
import DeleteConfirm from "@/components/DeleteConfirm";
import MarkdownPreview from "@/components/MarkdownPreview";
import NoteForm, { type NoteFormValues } from "@/components/NoteForm";
import { deleteNote, getNoteById, unlockNote, updateNote } from "@/lib/notes";
import type { Note } from "@/types/notes";

function formatFullDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-us", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export default function NoteDetailPage() {
    const router = useRouter();
    const params = useParams();
    const noteId = params.id as string;

    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [locked, setLocked] = useState(false);
    const [editing, setEditing] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [unlockPassword, setUnlockPassword] = useState("");
    const [unlockError, setUnlockError] = useState<string | null>(null);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void (async () => {
                const res = await getNoteById(noteId);

                if (res.error) {
                    setLoadError(res.error);
                    setNote(null);
                    setLocked(false);
                    setLoading(false);
                    return;
                }

                if (res.data) {
                    setNote(res.data as Note);
                    setLocked(!!res.locked);
                }

                setLoading(false);
            })();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [noteId]);

    async function handleUnlock(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setUnlockError(null);

        const res = await unlockNote(noteId, unlockPassword);

        if (res.error) {
            setUnlockError(res.error);
            setLoading(false);
            return;
        }

        if (res.locked || !res.data) {
            setUnlockError("Invalid note password");
            setLoading(false);
            return;
        }

        setNote(res.data as Note);
        setUnlockPassword("");
        setLocked(false);
        setLoading(false);
    }

    async function handleUpdate(data: NoteFormValues) {
        const res = await updateNote(
            noteId,
            {
                title: data.title,
                content: data.content,
                tags: data.tags,
                accent_color: data.accent_color || null,
                icon: data.icon || null,
                is_pinned: data.is_pinned,
                is_archived: data.is_archived,
                is_protected: data.is_protected,
                password: data.password || null,
            }
        );

        if (res.error) {
            return { error: res.error };
        }

        if (res.data) {
            setNote(res.data as Note);
            setLocked(false);
            setEditing(false);
        }

        return {};
    }

    async function handleDelete() {
        const res = await deleteNote(noteId);

        if (!res.error) {
            router.push("/notes");
        }
    }

    if (loading) {
        return (
            <div className="relative mt-4 lg:mt-16 w-full flex-1 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            </div>
        );
    }

    if (!note) {
        return (
            <div className="bg-background min-h-dvh flex">
                <div className="bg-background w-full max-w-[95%] sm:max-w-10/12 xl:max-w-4xl mx-auto flex flex-col py-6 sm:py-16">
                    <Header backRoute={() => router.push("/notes")} />
                    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-foreground/15 px-6 py-16 text-center">
                        <p className="text-base text-foreground/70">Note not found</p>
                        <p className="mt-1 text-sm text-foreground/40">
                            {loadError || "The note may have been removed or is unavailable."}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (editing) {
        return (
            <div className="bg-background min-h-dvh flex">
                <div className="bg-background w-full max-w-[95%] sm:max-w-10/12 xl:max-w-6xl mx-auto flex flex-col py-6 sm:py-16">
                    <Header backRoute={() => setEditing(false)} />
                    <p className="mb-4 text-sm text-foreground/55">
                        Update the content, organization and protection settings of this note.
                    </p>
                    <NoteForm
                        initialData={{
                            title: note.title,
                            content: note.content,
                            tags: note.tags,
                            accent_color: note.accent_color || undefined,
                            icon: note.icon || "",
                            is_pinned: note.is_pinned,
                            is_archived: note.is_archived,
                            is_protected: note.is_protected,
                        }}
                        initialProtected={note.is_protected}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditing(false)}
                        submitLabel="Save changes"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-dvh flex">
            <div className="bg-background w-full max-w-[95%] sm:max-w-10/12 xl:max-w-4xl mx-auto flex flex-col py-6 sm:py-16">
                <Header backRoute={() => router.push("/notes")} />

                <div className="mb-5 rounded-2xl border border-foreground/12 bg-foreground/2 p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                        <div
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
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
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <h1 className="truncate text-2xl font-semibold text-foreground">
                                        {note.title}
                                    </h1>
                                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono text-foreground/45">
                                        <span className="inline-flex items-center gap-1">
                                            <Clock3 size={12} />
                                            updated {formatFullDate(note.updated_at)}
                                        </span>
                                        {note.is_pinned && (
                                            <span className="inline-flex items-center gap-1 text-amber-600">
                                                <Pin size={12} />
                                                pinned
                                            </span>
                                        )}
                                        {note.is_archived && (
                                            <span className="inline-flex items-center gap-1">
                                                <Archive size={12} />
                                                archived
                                            </span>
                                        )}
                                        {note.is_protected && (
                                            <span className="inline-flex items-center gap-1 text-rose-600">
                                                <Lock size={12} />
                                                protected
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {locked ? (
                                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-mono text-amber-700">
                                        <Shield size={13} />
                                        unlock to edit
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditing(true)}
                                            className="rounded-lg border border-foreground px-4 py-2 text-xs font-medium text-foreground transition-colors cursor-pointer hover:bg-foreground hover:text-background sm:text-sm"
                                        >
                                            Edit
                                        </button>
                                        <DeleteConfirm
                                            title="Delete"
                                            message={`Delete "${note.title}" permanently?`}
                                            onConfirm={handleDelete}
                                        />
                                    </div>
                                )}
                            </div>

                            {note.tags.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {note.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-background px-2.5 py-1 text-[10px] font-mono text-foreground/60"
                                        >
                                            <Tag size={10} />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {locked ? (
                    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-amber-700">
                            <Shield size={17} />
                            <p className="text-sm font-semibold">This note is protected</p>
                        </div>
                        <p className="mb-4 text-sm text-amber-700/80">
                            Enter the note password to open and edit the content.
                        </p>

                        <form onSubmit={handleUnlock} className="flex flex-col gap-3 sm:flex-row">
                            <input
                                type="password"
                                value={unlockPassword}
                                onChange={(e) => setUnlockPassword(e.target.value)}
                                placeholder="Note password"
                                className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 font-mono text-sm text-foreground outline-none"
                            />
                            <button
                                type="submit"
                                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors cursor-pointer hover:bg-accent"
                            >
                                Unlock
                            </button>
                        </form>

                        {unlockError && (
                            <p className="mt-3 text-sm text-red-600">{unlockError}</p>
                        )}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-foreground/12 bg-background px-4 py-5 sm:px-5">
                        <MarkdownPreview
                            content={note.content}
                            emptyMessage="This note is empty. Click edit to start writing."
                            className="text-sm sm:text-[15px]"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
