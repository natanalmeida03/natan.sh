import type { WeeklyRecapHomeState } from "@/types/weekly-recaps";

export type DailyMood = "great" | "good" | "neutral" | "bad" | "awful";

export interface HomeHabit {
    id: string;
    title: string;
    icon?: string | null;
    color?: string | null;
    frequency_type?: "daily" | "weekly" | "monthly" | null;
    is_active?: boolean;
    created_at?: string | null;
}

export interface HomeHabitStreak {
    habit_id: string;
    current_streak: number;
    best_streak: number;
}

export interface HomeReminderCategory {
    name: string;
    color?: string | null;
}

export interface HomeReminder {
    id: string;
    title: string;
    due_at: string;
    is_completed: boolean;
    recurrence_rule?: string | null;
    recurrence_end_at?: string | null;
    categories?: HomeReminderCategory | null;
}

export interface HomeStats {
    pending_reminders: number;
    active_habits: number;
    habits_completed_today: number;
}

export interface HomeDailyNote {
    content: string;
    mood: DailyMood | null;
}

export interface HomeMarkedDateFlags {
    hasNote?: boolean;
    hasReminder?: boolean;
    hasHabit?: boolean;
}

export type HomeMarkedDates = Record<string, HomeMarkedDateFlags>;

export interface HomeInitialData {
    habits: HomeHabit[];
    loggedToday: Record<string, boolean>;
    streaks: Record<string, HomeHabitStreak>;
    reminders: HomeReminder[];
    stats: HomeStats;
    note: HomeDailyNote | null;
    monthMarkers: HomeMarkedDates;
    weeklyRecap: WeeklyRecapHomeState;
}
