"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Download,
    ExternalLink,
    LoaderCircle,
    RefreshCw,
    Share2,
    Sparkles,
} from "lucide-react";
import { generateWeeklyRecapAction } from "@/lib/weekly-recap-actions";
import type {
    WeeklyRecapHomeState,
    WeeklyRecapRecord,
    WeeklyRecapStoryPalette,
} from "@/types/weekly-recaps";

interface WeeklyRecapSectionProps {
    initialState: WeeklyRecapHomeState;
}

const DEFAULT_STORY_PALETTE: WeeklyRecapStoryPalette = {
    background: "#F8F4EE",
    surface: "#F5F5F0",
    border: "#D0C9C0",
    foreground: "#2E2E2E",
    muted: "#6B6B6B",
    accent: "#1A1A1A",
};

function formatWeekRange(weekStart: string, weekEnd: string) {
    const start = new Date(`${weekStart}T12:00:00.000Z`);
    const end = new Date(`${weekEnd}T12:00:00.000Z`);

    return `${start.toLocaleDateString("en-us", {
        month: "short",
        day: "2-digit",
    })} - ${end.toLocaleDateString("en-us", {
        month: "short",
        day: "2-digit",
    })}`;
}

function shiftDateKey(dateKey: string, days: number) {
    const value = new Date(`${dateKey}T12:00:00.000Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().split("T")[0];
}

function normalizeHexColor(value?: string | null) {
    if (!value) {
        return null;
    }

    const trimmed = value.trim();

    if (/^#([0-9a-f]{6})$/i.test(trimmed)) {
        return trimmed;
    }

    if (/^#([0-9a-f]{3})$/i.test(trimmed)) {
        const [, group] = trimmed.match(/^#([0-9a-f]{3})$/i) || [];

        if (!group) {
            return null;
        }

        return `#${group
            .split("")
            .map((char) => `${char}${char}`)
            .join("")}`;
    }

    return null;
}

function readStoryThemePalette(): WeeklyRecapStoryPalette | null {
    if (typeof window === "undefined") {
        return null;
    }

    const styles = window.getComputedStyle(document.documentElement);

    return {
        background:
            normalizeHexColor(styles.getPropertyValue("--background1")) ||
            DEFAULT_STORY_PALETTE.background,
        surface:
            normalizeHexColor(styles.getPropertyValue("--surface1")) ||
            DEFAULT_STORY_PALETTE.surface,
        border:
            normalizeHexColor(styles.getPropertyValue("--border1")) ||
            DEFAULT_STORY_PALETTE.border,
        foreground:
            normalizeHexColor(styles.getPropertyValue("--foreground1")) ||
            DEFAULT_STORY_PALETTE.foreground,
        muted:
            normalizeHexColor(styles.getPropertyValue("--muted1")) ||
            DEFAULT_STORY_PALETTE.muted,
        accent:
            normalizeHexColor(styles.getPropertyValue("--accent1")) ||
            DEFAULT_STORY_PALETTE.accent,
    };
}

function getStoryUrl(
    summary: WeeklyRecapRecord,
    palette?: WeeklyRecapStoryPalette | null
) {
    const params = new URLSearchParams({
        v: summary.updated_at,
    });

    if (palette) {
        params.set("background", palette.background);
        params.set("surface", palette.surface);
        params.set("border", palette.border);
        params.set("foreground", palette.foreground);
        params.set("muted", palette.muted);
        params.set("accent", palette.accent);
    }

    return `/api/weekly-recaps/${summary.id}/story?${params.toString()}`;
}

export default function WeeklyRecapSection({ initialState }: WeeklyRecapSectionProps) {
    const [summaries, setSummaries] = useState(initialState.summaries);
    const [selectedSummaryId, setSelectedSummaryId] = useState(
        initialState.summaries[0]?.id ?? null
    );
    const [feedback, setFeedback] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [assetAction, setAssetAction] = useState<"share" | "download" | null>(null);
    const [storyPalette, setStoryPalette] =
        useState<WeeklyRecapStoryPalette | null>(null);
    const [isGenerating, startGenerationTransition] = useTransition();
    const autoGenerationAttemptedRef = useRef(false);
    const isSunday = new Date().getDay() === 0;

    useEffect(() => {
        const syncPalette = () => {
            setStoryPalette(readStoryThemePalette());
        };

        syncPalette();

        if (typeof window === "undefined") {
            return;
        }

        const observer = new MutationObserver(syncPalette);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme", "style"],
        });

        window.addEventListener("storage", syncPalette);

        return () => {
            observer.disconnect();
            window.removeEventListener("storage", syncPalette);
        };
    }, []);

    useEffect(() => {
        if (!selectedSummaryId && summaries[0]) {
            setSelectedSummaryId(summaries[0].id);
            return;
        }

        if (
            selectedSummaryId &&
            !summaries.some((summary) => summary.id === selectedSummaryId)
        ) {
            setSelectedSummaryId(summaries[0]?.id ?? null);
        }
    }, [selectedSummaryId, summaries]);

    async function handleGenerate(weekEnd?: string) {
        setError(null);
        setFeedback(null);
        const result = await generateWeeklyRecapAction(weekEnd);

        if ("error" in result) {
            setError(result.error);
            return;
        }

        setSummaries((prev) => {
            const next = [
                result.data,
                ...prev.filter((summary) => summary.id !== result.data.id),
            ].sort((left, right) => right.week_end.localeCompare(left.week_end));

            return next.slice(0, 6);
        });
        setSelectedSummaryId(result.data.id);
        setFeedback("Weekly recap generated.");
    }

    useEffect(() => {
        const hasCurrentWeekSummary = summaries.some(
            (summary) => summary.week_end === initialState.current_week_end
        );

        if (
            !isSunday ||
            initialState.setup_required ||
            hasCurrentWeekSummary ||
            autoGenerationAttemptedRef.current
        ) {
            return;
        }

        autoGenerationAttemptedRef.current = true;
        startGenerationTransition(() => {
            void handleGenerate(initialState.current_week_end);
        });
    }, [
        initialState.current_week_end,
        initialState.setup_required,
        isSunday,
        summaries,
    ]);

    async function getStoryPngFile(summary: WeeklyRecapRecord) {
        const response = await fetch(getStoryUrl(summary, storyPalette), {
            credentials: "include",
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error("Unable to load the weekly story asset.");
        }

        const svgText = await response.text();
        const svgBlob = new Blob([svgText], {
            type: "image/svg+xml;charset=utf-8",
        });
        const svgUrl = URL.createObjectURL(svgBlob);

        try {
            const image = await new Promise<HTMLImageElement>((resolve, reject) => {
                const nextImage = new window.Image();
                nextImage.onload = () => resolve(nextImage);
                nextImage.onerror = () =>
                    reject(new Error("Unable to render the weekly story asset."));
                nextImage.src = svgUrl;
            });

            const canvas = document.createElement("canvas");
            canvas.width = 1080;
            canvas.height = 1920;
            const context = canvas.getContext("2d");

            if (!context) {
                throw new Error("Canvas is not available in this browser.");
            }

            context.drawImage(image, 0, 0, canvas.width, canvas.height);

            const pngBlob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error("Unable to export the weekly story image."));
                        return;
                    }

                    resolve(blob);
                }, "image/png");
            });

            return new File([pngBlob], `natan-weekly-recap-${summary.week_end}.png`, {
                type: "image/png",
            });
        } finally {
            URL.revokeObjectURL(svgUrl);
        }
    }

    async function handleShareOrDownload(mode: "share" | "download") {
        const selectedSummary = summaries.find((summary) => summary.id === selectedSummaryId);

        if (!selectedSummary) {
            return;
        }

        setAssetAction(mode);
        setError(null);
        setFeedback(null);

        try {
            const file = await getStoryPngFile(selectedSummary);

            if (
                mode === "share" &&
                typeof navigator !== "undefined" &&
                "share" in navigator &&
                "canShare" in navigator &&
                navigator.canShare({ files: [file] })
            ) {
                await navigator.share({
                    files: [file],
                    title: "Weekly Recap",
                    text: "My week in one story.",
                });
                setFeedback("Share sheet opened.");
            } else {
                const downloadUrl = URL.createObjectURL(file);
                const anchor = document.createElement("a");
                anchor.href = downloadUrl;
                anchor.download = file.name;
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
                URL.revokeObjectURL(downloadUrl);
                setFeedback(
                    mode === "share"
                        ? "PNG downloaded. Use it in your stories."
                        : "PNG downloaded."
                );
            }
        } catch (actionError) {
            setError(
                actionError instanceof Error
                    ? actionError.message
                    : "Unable to export the weekly story."
            );
        } finally {
            setAssetAction(null);
        }
    }

    if (initialState.setup_required) {
        return (
            <section className="rounded-lg border border-foreground/15 bg-surface px-4 py-4">
                <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 text-accent" size={16} />
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            Weekly recap needs one SQL setup step
                        </p>
                        <p className="mt-1 text-xs text-foreground/50 font-mono">
                            {initialState.setup_message ||
                                "Create the weekly_summaries table and reload the app."}
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    const selectedSummary =
        summaries.find((summary) => summary.id === selectedSummaryId) || null;
    const selectedStoryUrl = selectedSummary
        ? getStoryUrl(selectedSummary, storyPalette)
        : null;
    const latestClosedWeekEnd = shiftDateKey(initialState.current_week_end, -7);
    const generationTargetWeekEnd = isSunday
        ? initialState.current_week_end
        : latestClosedWeekEnd;
    const hasGenerationTargetSummary = summaries.some(
        (summary) => summary.week_end === generationTargetWeekEnd
    );
    const canGenerateTargetWeek = !hasGenerationTargetSummary;
    const generateButtonLabel = isSunday
        ? "Generate this week"
        : "Generate last week";
    const strongestHabit = selectedSummary?.payload.habit_stats.strongest_habit || null;
    const topCategory = selectedSummary?.payload.reminder_stats.top_category || null;

    return (
        <section className="rounded-lg border border-foreground/15 px-3 py-4 sm:px-4">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                            Weekly recap
                        </h3>
                        <p className="mt-1 text-[10px] sm:text-xs text-foreground/40 font-mono">
                            {isSunday
                                ? "Story-ready summary using your current theme."
                                : "You can generate the latest closed week now to test the story."}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {canGenerateTargetWeek && (
                            <button
                                onClick={() =>
                                    startGenerationTransition(() => {
                                        void handleGenerate(generationTargetWeekEnd);
                                    })
                                }
                                disabled={isGenerating}
                                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-xs sm:text-sm font-medium text-background transition-colors hover:bg-accent disabled:opacity-60 cursor-pointer"
                            >
                                {isGenerating ? (
                                    <LoaderCircle size={15} className="animate-spin" />
                                ) : (
                                        <Sparkles size={15} />
                                    )}
                                {generateButtonLabel}
                            </button>
                        )}

                        {selectedSummary && (
                            <button
                                onClick={() =>
                                    startGenerationTransition(() => {
                                        void handleGenerate(selectedSummary.week_end);
                                    })
                                }
                                disabled={isGenerating}
                                className="inline-flex items-center gap-2 rounded-lg border border-foreground/15 px-4 py-2 text-xs sm:text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-60 cursor-pointer"
                            >
                                {isGenerating ? (
                                    <LoaderCircle size={15} className="animate-spin" />
                                ) : (
                                    <RefreshCw size={15} />
                                )}
                                Regenerate
                            </button>
                        )}
                    </div>
                </div>

                {feedback && <p className="text-xs sm:text-sm text-accent">{feedback}</p>}
                {error && <p className="text-xs sm:text-sm text-red-500">{error}</p>}

                {selectedSummary ? (
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
                        <div className="rounded-lg border border-foreground/15 bg-foreground/[0.02] p-2 sm:p-3">
                            <Image
                                src={selectedStoryUrl || getStoryUrl(selectedSummary)}
                                alt={`Weekly recap for ${formatWeekRange(selectedSummary.week_start, selectedSummary.week_end)}`}
                                width={1080}
                                height={1920}
                                unoptimized
                                className="w-full rounded-md border border-foreground/10 bg-surface object-cover"
                            />
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="rounded-lg border border-foreground/15 p-4">
                                <p className="text-[10px] sm:text-xs text-foreground/40 font-mono">
                                    Selected recap
                                </p>
                                <h4 className="mt-1 text-base sm:text-lg font-semibold text-foreground">
                                    {formatWeekRange(
                                        selectedSummary.week_start,
                                        selectedSummary.week_end
                                    )}
                                </h4>

                                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                    <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-3">
                                        <p className="text-[10px] text-foreground/40 font-mono">
                                            Habits
                                        </p>
                                        <p className="mt-1 text-2xl font-semibold text-foreground">
                                            {selectedSummary.payload.habit_stats.completion_rate ?? 0}%
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-3">
                                        <p className="text-[10px] text-foreground/40 font-mono">
                                            Done
                                        </p>
                                        <p className="mt-1 text-2xl font-semibold text-foreground">
                                            {selectedSummary.payload.reminder_stats.completed}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-3">
                                        <p className="text-[10px] text-foreground/40 font-mono">
                                            Mood
                                        </p>
                                        <p className="mt-1 text-2xl font-semibold text-foreground">
                                            {selectedSummary.payload.mood_stats.average ?? "\u2014"}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {strongestHabit && (
                                        <span
                                            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] sm:text-xs font-mono"
                                            style={{
                                                backgroundColor: strongestHabit.color
                                                    ? `${strongestHabit.color}20`
                                                    : "color-mix(in srgb, var(--foreground1) 10%, transparent)",
                                                color:
                                                    strongestHabit.color ||
                                                    "var(--foreground1)",
                                            }}
                                        >
                                            Strongest:{" "}
                                            {strongestHabit.icon
                                                ? `${strongestHabit.icon} `
                                                : ""}
                                            {strongestHabit.title}
                                        </span>
                                    )}

                                    {topCategory && (
                                        <span
                                            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] sm:text-xs font-mono"
                                            style={{
                                                backgroundColor: topCategory.color
                                                    ? `${topCategory.color}20`
                                                    : "color-mix(in srgb, var(--foreground1) 10%, transparent)",
                                                color:
                                                    topCategory.color ||
                                                    "var(--foreground1)",
                                            }}
                                        >
                                            Top category: {topCategory.name}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-4 flex flex-col gap-1.5">
                                    {selectedSummary.payload.highlights
                                        .slice(0, 3)
                                        .map((highlight) => (
                                            <p
                                                key={highlight.id}
                                                className="text-xs sm:text-sm text-foreground/70"
                                            >
                                                <span className="font-mono text-foreground/40">
                                                    {highlight.label.toLowerCase()}:
                                                </span>{" "}
                                                {highlight.value}
                                            </p>
                                        ))}
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    <Link
                                        href={selectedStoryUrl || getStoryUrl(selectedSummary)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-lg border border-foreground/15 px-4 py-2 text-xs sm:text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
                                    >
                                        <ExternalLink size={15} />
                                        Open story
                                    </Link>
                                    <button
                                        onClick={() => void handleShareOrDownload("share")}
                                        disabled={assetAction !== null}
                                        className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-xs sm:text-sm font-medium text-background transition-colors hover:bg-accent disabled:opacity-60 cursor-pointer"
                                    >
                                        {assetAction === "share" ? (
                                            <LoaderCircle size={15} className="animate-spin" />
                                        ) : (
                                            <Share2 size={15} />
                                        )}
                                        Share
                                    </button>
                                    <button
                                        onClick={() => void handleShareOrDownload("download")}
                                        disabled={assetAction !== null}
                                        className="inline-flex items-center gap-2 rounded-lg border border-foreground/15 px-4 py-2 text-xs sm:text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-60 cursor-pointer"
                                    >
                                        {assetAction === "download" ? (
                                            <LoaderCircle size={15} className="animate-spin" />
                                        ) : (
                                            <Download size={15} />
                                        )}
                                        Download PNG
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-lg border border-foreground/15 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] sm:text-xs text-foreground/40 font-mono">
                                            Archive
                                        </p>
                                        <h4 className="mt-1 text-base font-semibold text-foreground">
                                            Past recaps
                                        </h4>
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-foreground/40 font-mono">
                                        {summaries.length} saved
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-col gap-2">
                                    {summaries.map((summary) => {
                                        const isSelected =
                                            summary.id === selectedSummary?.id;

                                        return (
                                            <button
                                                key={summary.id}
                                                onClick={() => setSelectedSummaryId(summary.id)}
                                                className={`rounded-lg border px-3 py-3 text-left transition-colors cursor-pointer ${
                                                    isSelected
                                                        ? "border-foreground/25 bg-foreground/[0.04]"
                                                        : "border-foreground/10 hover:bg-foreground/[0.03]"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {formatWeekRange(
                                                                summary.week_start,
                                                                summary.week_end
                                                            )}
                                                        </p>
                                                        <p className="mt-1 text-[10px] sm:text-xs text-foreground/40 font-mono">
                                                            {
                                                                summary.payload.habit_stats
                                                                    .total_checkins
                                                            }{" "}
                                                            habit check-ins |{" "}
                                                            {
                                                                summary.payload
                                                                    .reminder_stats.completed
                                                            }{" "}
                                                            reminders done
                                                        </p>
                                                    </div>
                                                    <span className="text-xs">
                                                        {
                                                            summary.payload.mood_stats
                                                                .average_emoji
                                                        }
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-foreground/15 px-4 py-10 text-center">
                        <p className="text-sm sm:text-base font-medium text-foreground">
                            No weekly recap yet
                        </p>
                        <p className="mt-2 text-xs sm:text-sm text-foreground/50">
                            {isSunday
                                ? "Generate today's story to lock in your week."
                                : "Your next recap will unlock on Sunday after the week closes."}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
