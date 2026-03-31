"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/HeaderSecondary";
import NoteForm, { type NoteFormValues } from "@/components/NoteForm";
import { createNote } from "@/lib/notes";

export default function NewNotePage() {
    const router = useRouter();

    async function handleSubmit(data: NoteFormValues) {
        const res = await createNote({
            title: data.title,
            content: data.content,
            tags: data.tags,
            accent_color: data.accent_color || null,
            icon: data.icon || null,
            is_pinned: data.is_pinned,
            is_archived: data.is_archived,
            is_protected: data.is_protected,
            password: data.password || null,
        });

        if (res.error) {
            return { error: res.error };
        }

        router.push(`/notes/${res.data?.id || ""}`);
        return {};
    }

    return (
        <div className="bg-background min-h-dvh flex">
            <div className="bg-background w-full max-w-[95%] sm:max-w-10/12 xl:max-w-6xl mx-auto flex flex-col py-6 sm:py-16">
                <Header backRoute={() => router.push("/notes")} />
                <p className="mb-4 text-sm text-foreground/55">
                    Create a new note with Markdown, tags, custom color and optional password protection.
                </p>

                <NoteForm
                    onSubmit={handleSubmit}
                    onCancel={() => router.push("/notes")}
                    submitLabel="Create note"
                />
            </div>
        </div>
    );
}
