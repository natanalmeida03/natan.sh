"use client";

import { useState } from "react";
import { Eye, PencilLine, Shield, X } from "lucide-react";
import MarkdownPreview from "@/components/MarkdownPreview";

export interface NoteFormValues {
    title: string;
    content: string;
    tags: string[];
    accent_color: string;
    icon: string;
    is_pinned: boolean;
    is_archived: boolean;
    is_protected: boolean;
    password: string;
    confirm_password: string;
}

interface NoteFormProps {
    initialData?: Partial<NoteFormValues>;
    onSubmit: (data: NoteFormValues) => Promise<{ error?: string }>;
    onCancel: () => void;
    submitLabel?: string;
    initialProtected?: boolean;
}

const NOTE_COLORS = [
    "#F59E0B",
    "#F97316",
    "#EF4444",
    "#10B981",
    "#06B6D4",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
];
const PASSWORD_MIN_LENGTH = 10;

function parseTags(tags: string[]): string {
    return tags.join(", ");
}

function normalizeTags(raw: string): string[] {
    return [...new Set(raw.split(",").map((tag) => tag.trim()).filter(Boolean))];
}

function Toggle({
    checked,
    label,
    description,
    onChange,
}: {
    checked: boolean;
    label: string;
    description: string;
    onChange: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onChange}
            className="flex items-center justify-between gap-3 rounded-lg border border-foreground/12 bg-foreground/2 px-3 py-2 text-left"
        >
            <div>
                <p className="text-sm text-foreground">{label}</p>
                <p className="text-[11px] font-mono text-foreground/45">{description}</p>
            </div>
            <div
                className={`relative h-5 w-9 rounded-full transition-colors ${
                    checked ? "bg-foreground" : "bg-foreground/20"
                }`}
            >
                <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${
                        checked ? "translate-x-4" : "translate-x-0.5"
                    }`}
                />
            </div>
        </button>
    );
}

export default function NoteForm({
    initialData,
    onSubmit,
    onCancel,
    submitLabel = "Save note",
    initialProtected = false,
}: NoteFormProps) {
    const [form, setForm] = useState<NoteFormValues>({
        title: initialData?.title || "",
        content: initialData?.content || "",
        tags: initialData?.tags || [],
        accent_color: initialData?.accent_color || NOTE_COLORS[0],
        icon: initialData?.icon || "",
        is_pinned: initialData?.is_pinned || false,
        is_archived: initialData?.is_archived || false,
        is_protected: initialData?.is_protected || false,
        password: "",
        confirm_password: "",
    });
    const [tagsInput, setTagsInput] = useState(parseTags(initialData?.tags || []));
    const [mode, setMode] = useState<"write" | "preview">("write");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function updateField<K extends keyof NoteFormValues>(
        key: K,
        value: NoteFormValues[K]
    ) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const tags = normalizeTags(tagsInput);
        const password = form.password.trim();
        const confirmPassword = form.confirm_password.trim();

        if (!form.title.trim()) {
            setError("Title is required");
            return;
        }

        if (form.is_protected && !initialProtected && password.length < PASSWORD_MIN_LENGTH) {
            setError(`Add a password with at least ${PASSWORD_MIN_LENGTH} characters`);
            return;
        }

        if (form.is_protected && password && password.length < PASSWORD_MIN_LENGTH) {
            setError(`Passwords need at least ${PASSWORD_MIN_LENGTH} characters`);
            return;
        }

        if (form.is_protected && password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        const result = await onSubmit({
            ...form,
            title: form.title.trim(),
            icon: form.icon.trim(),
            tags,
            password,
            confirm_password: confirmPassword,
        });

        if (result?.error) {
            setError(result.error);
            setLoading(false);
            return;
        }

        setLoading(false);
    }

    const parsedTags = normalizeTags(tagsInput);

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-start justify-between gap-3">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="cursor-pointer text-red-500 hover:text-red-700"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="flex flex-col gap-4">
                    <fieldset className="rounded-lg border border-foreground px-3 pb-2 pt-0">
                        <legend className="px-1 text-xs text-foreground">Title *</legend>
                        <input
                            type="text"
                            required
                            value={form.title}
                            onChange={(e) => updateField("title", e.target.value)}
                            placeholder="ex: Idea backlog"
                            className="w-full bg-transparent py-1 font-mono text-sm text-foreground outline-none"
                        />
                    </fieldset>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[110px_minmax(0,1fr)]">
                        <fieldset className="rounded-lg border border-foreground px-3 pb-2 pt-0">
                            <legend className="px-1 text-xs text-foreground">Icon</legend>
                            <input
                                type="text"
                                value={form.icon}
                                onChange={(e) => updateField("icon", e.target.value)}
                                placeholder="📝"
                                maxLength={4}
                                className="w-full bg-transparent py-1 text-center text-xl outline-none"
                            />
                        </fieldset>

                        <fieldset className="rounded-lg border border-foreground px-3 pb-2 pt-0">
                            <legend className="px-1 text-xs text-foreground">Tags</legend>
                            <input
                                type="text"
                                value={tagsInput}
                                onChange={(e) => setTagsInput(e.target.value)}
                                placeholder="work, ideas, private"
                                className="w-full bg-transparent py-1 font-mono text-sm text-foreground outline-none"
                            />
                        </fieldset>
                    </div>

                    <div className="rounded-lg border border-foreground/12 bg-foreground/2 p-3">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-foreground">
                                    Markdown editor
                                </p>
                                <p className="text-[11px] font-mono text-foreground/45">
                                    Supports headings, lists, quotes, code, links and inline styles.
                                </p>
                            </div>
                            <div className="inline-flex rounded-lg border border-foreground/12 bg-background p-1">
                                <button
                                    type="button"
                                    onClick={() => setMode("write")}
                                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                        mode === "write"
                                            ? "bg-foreground text-background"
                                            : "text-foreground/55 hover:text-foreground"
                                    }`}
                                >
                                    <PencilLine size={13} />
                                    Write
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode("preview")}
                                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                        mode === "preview"
                                            ? "bg-foreground text-background"
                                            : "text-foreground/55 hover:text-foreground"
                                    }`}
                                >
                                    <Eye size={13} />
                                    Preview
                                </button>
                            </div>
                        </div>

                        {mode === "write" ? (
                            <textarea
                                value={form.content}
                                onChange={(e) => updateField("content", e.target.value)}
                                rows={16}
                                placeholder={`# Title

- key point
- next step

> quote or note

\`\`\`ts
const hello = "world"
\`\`\``}
                                className="min-h-[360px] w-full resize-y rounded-lg border border-foreground/10 bg-background px-3 py-3 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-foreground/25 focus:border-foreground/25"
                            />
                        ) : (
                            <div className="min-h-[360px] rounded-lg border border-foreground/10 bg-background px-4 py-4">
                                <MarkdownPreview
                                    content={form.content}
                                    emptyMessage="Start writing Markdown to see the preview."
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="rounded-lg border border-foreground/12 bg-foreground/2 p-3">
                        <p className="mb-2 text-sm font-semibold text-foreground">
                            Note style
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {NOTE_COLORS.map((color) => {
                                const selected = form.accent_color === color;
                                return (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => updateField("accent_color", color)}
                                        className={`h-8 w-8 rounded-full border-2 transition-transform cursor-pointer ${
                                            selected
                                                ? "scale-110 border-foreground"
                                                : "border-transparent"
                                        }`}
                                        style={{ backgroundColor: color }}
                                        aria-label={`Choose ${color}`}
                                    />
                                );
                            })}
                        </div>
                        <div className="mt-3 rounded-lg border border-foreground/10 bg-background px-3 py-3">
                            <div className="flex items-start gap-3">
                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
                                    style={{
                                        backgroundColor: `${form.accent_color}20`,
                                        color: form.accent_color,
                                    }}
                                >
                                    {form.icon || "🗒️"}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                        {form.title || "Untitled note"}
                                    </p>
                                    <p className="mt-1 text-xs text-foreground/45">
                                        {form.is_protected
                                            ? "Protected note"
                                            : "Preview of how the card will look in the list."}
                                    </p>
                                </div>
                            </div>
                            {parsedTags.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {parsedTags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full border border-foreground/10 px-2 py-1 text-[10px] font-mono text-foreground/60"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <Toggle
                            checked={form.is_pinned}
                            label="Pinned"
                            description="Keep this note at the top of the notes tab."
                            onChange={() => updateField("is_pinned", !form.is_pinned)}
                        />
                        <Toggle
                            checked={form.is_archived}
                            label="Archived"
                            description="Hide it from the main workflow without deleting it."
                            onChange={() => updateField("is_archived", !form.is_archived)}
                        />
                        <Toggle
                            checked={form.is_protected}
                            label="Protected"
                            description="Ask for a password before opening or editing this note."
                            onChange={() => updateField("is_protected", !form.is_protected)}
                        />
                    </div>

                    {form.is_protected && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                            <div className="mb-2 flex items-center gap-2 text-amber-700">
                                <Shield size={15} />
                                <p className="text-sm font-semibold">Password protection</p>
                            </div>
                            <p className="mb-3 text-xs text-amber-700/80">
                                {initialProtected
                                    ? "Leave the fields blank to keep the current password."
                                    : "Use a strong password with at least 10 characters. Common passwords are rejected."}
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                                <fieldset className="rounded-lg border border-amber-300 bg-white px-3 pb-2 pt-0">
                                    <legend className="px-1 text-xs text-amber-700">
                                        Password
                                    </legend>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={(e) => updateField("password", e.target.value)}
                                        placeholder={
                                            initialProtected
                                                ? "Keep current or enter a new password"
                                                : "At least 10 characters"
                                        }
                                        className="w-full bg-transparent py-1 font-mono text-sm text-foreground outline-none"
                                    />
                                </fieldset>
                                <fieldset className="rounded-lg border border-amber-300 bg-white px-3 pb-2 pt-0">
                                    <legend className="px-1 text-xs text-amber-700">
                                        Confirm password
                                    </legend>
                                    <input
                                        type="password"
                                        value={form.confirm_password}
                                        onChange={(e) =>
                                            updateField("confirm_password", e.target.value)
                                        }
                                        placeholder="Repeat the password"
                                        className="w-full bg-transparent py-1 font-mono text-sm text-foreground outline-none"
                                    />
                                </fieldset>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 rounded-lg border-2 border-foreground px-4 py-2 text-xs font-medium text-foreground transition-colors cursor-pointer hover:bg-foreground hover:text-background sm:text-sm"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-foreground px-4 py-2 text-xs font-medium text-background transition-colors cursor-pointer hover:bg-accent disabled:opacity-50 sm:text-sm"
                >
                    {loading ? "Saving..." : submitLabel}
                </button>
            </div>
        </form>
    );
}
