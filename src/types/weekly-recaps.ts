import type { DailyMood } from "@/types/home";

export type WeeklyRecapTheme = "terminal-premium" | "app-theme";

export interface WeeklyRecapHighlight {
    id: string;
    label: string;
    value: string;
}

export interface WeeklyRecapPalette {
    accent: string;
    accent_soft: string;
    accent_strong: string;
}

export interface WeeklyRecapStoryPalette {
    background: string;
    surface: string;
    border: string;
    foreground: string;
    muted: string;
    accent: string;
}

export interface WeeklyRecapHabitLeader {
    id: string;
    title: string;
    icon?: string | null;
    color?: string | null;
    times_completed: number;
    completion_pct: number | null;
}

export interface WeeklyRecapHabitStats {
    tracked_habits: number;
    total_checkins: number;
    completion_rate: number | null;
    strongest_habit: WeeklyRecapHabitLeader | null;
}

export interface WeeklyRecapReminderCategory {
    name: string;
    color?: string | null;
    count: number;
}

export interface WeeklyRecapReminderStats {
    total: number;
    completed: number;
    overdue: number;
    pending: number;
    top_category: WeeklyRecapReminderCategory | null;
}

export interface WeeklyRecapMoodStats {
    average: number | null;
    average_label: string;
    average_emoji: string;
    entries: number;
    counts: Record<DailyMood, number>;
}

export interface WeeklyRecapPayload {
    username: string;
    headline: string;
    week_start: string;
    week_end: string;
    habit_stats: WeeklyRecapHabitStats;
    reminder_stats: WeeklyRecapReminderStats;
    mood_stats: WeeklyRecapMoodStats;
    highlights: WeeklyRecapHighlight[];
    palette: WeeklyRecapPalette;
}

export interface WeeklyRecapRecord {
    id: string;
    user_id: string;
    week_start: string;
    week_end: string;
    story_theme: WeeklyRecapTheme;
    payload: WeeklyRecapPayload;
    created_at: string;
    updated_at: string;
}

export interface WeeklyRecapHomeState {
    summaries: WeeklyRecapRecord[];
    current_week_end: string;
    setup_required: boolean;
    setup_message?: string;
}
