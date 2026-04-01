"use server";

import { getActiveRemindersForDisplay } from "@/lib/reminder-schedule";
import type {
    HomeDailyNote,
    HomeHabit,
    HomeHabitStreak,
    HomeInitialData,
    HomeMarkedDates,
    HomeReminder,
    HomeReminderCategory,
} from "@/types/home";
import { createClient } from "@/utils/supabase/server";

type ReminderRow = {
    id: string;
    title: string;
    due_at: string;
    is_completed: boolean;
    recurrence_rule?: string | null;
    recurrence_end_at?: string | null;
    categories?: HomeReminderCategory | HomeReminderCategory[] | null;
};

const ICAL_DAY_TO_JS: Record<string, number> = {
    SU: 0,
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6,
};

function getEmptyHomeInitialData(): HomeInitialData {
    return {
        habits: [],
        loggedToday: {},
        streaks: {},
        reminders: [],
        stats: {
            pending_reminders: 0,
            active_habits: 0,
            habits_completed_today: 0,
        },
        note: null,
        monthMarkers: {},
    };
}

function shiftDateKey(date: string, days: number): string {
    const [year, month, day] = date.split("-").map(Number);
    const shifted = new Date(Date.UTC(year, month - 1, day));
    shifted.setUTCDate(shifted.getUTCDate() + days);
    return shifted.toISOString().split("T")[0];
}

function getReminderDateKey(dueAt: string): string | null {
    const parsed = new Date(dueAt);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed.toISOString().split("T")[0];
}

function matchesRecurrence(
    dueAt: Date,
    rule: string,
    targetDate: string,
    endAt?: string | null
): boolean {
    const target = new Date(`${targetDate}T12:00:00`);
    const dueDate = new Date(dueAt.getFullYear(), dueAt.getMonth(), dueAt.getDate());
    const targetDay = new Date(
        target.getFullYear(),
        target.getMonth(),
        target.getDate()
    );

    if (targetDay < dueDate) {
        return false;
    }

    if (endAt) {
        const end = new Date(endAt);

        if (targetDay > end) {
            return false;
        }
    }

    if (targetDay.getTime() === dueDate.getTime()) {
        return true;
    }

    if (rule.includes("FREQ=DAILY")) {
        return true;
    }

    if (rule.includes("FREQ=MONTHLY")) {
        return target.getDate() === dueAt.getDate();
    }

    if (rule.includes("FREQ=YEARLY")) {
        return (
            target.getDate() === dueAt.getDate() &&
            target.getMonth() === dueAt.getMonth()
        );
    }

    const byDayMatch = rule.match(/BYDAY=([A-Z,]+)/);

    if (byDayMatch) {
        const targetDays = byDayMatch[1]
            .split(",")
            .map((day) => ICAL_DAY_TO_JS[day])
            .filter((day) => day !== undefined);

        return targetDays.includes(target.getDay());
    }

    if (rule.includes("FREQ=WEEKLY")) {
        return target.getDay() === dueAt.getDay();
    }

    return false;
}

function getRecurrenceDatesInMonth(
    dueAt: Date,
    rule: string,
    year: number,
    month: number,
    endAt?: string | null
): string[] {
    const dates: string[] = [];
    const lastDay = new Date(year, month, 0).getDate();

    for (let day = 1; day <= lastDay; day += 1) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        if (matchesRecurrence(dueAt, rule, dateStr, endAt)) {
            dates.push(dateStr);
        }
    }

    return dates;
}

function normalizeReminderCategory(
    category: HomeReminderCategory | HomeReminderCategory[] | null | undefined
): HomeReminderCategory | null {
    if (!category) {
        return null;
    }

    if (Array.isArray(category)) {
        return category[0] ?? null;
    }

    return category;
}

function normalizeReminder(reminder: ReminderRow): HomeReminder {
    return {
        id: reminder.id,
        title: reminder.title,
        due_at: reminder.due_at,
        is_completed: reminder.is_completed,
        recurrence_rule: reminder.recurrence_rule ?? null,
        recurrence_end_at: reminder.recurrence_end_at ?? null,
        categories: normalizeReminderCategory(reminder.categories),
    };
}

function buildMonthMarkers(input: {
    year: number;
    month: number;
    noteDates: string[];
    reminders: ReminderRow[];
    completionDates: string[];
    habitLogDates: string[];
    hasActiveHabits: boolean;
}): HomeMarkedDates {
    const monthStart = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
    const lastDay = new Date(input.year, input.month, 0).getDate();
    const monthEnd = `${input.year}-${String(input.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const paddedTo = `${shiftDateKey(monthEnd, 1)}T23:59:59.999Z`;

    const noteDates = new Set(input.noteDates);
    const reminderDates = new Set<string>();
    const habitDates = new Set(input.habitLogDates);

    if (input.hasActiveHabits) {
        for (let day = 1; day <= lastDay; day += 1) {
            const dateStr = `${input.year}-${String(input.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            habitDates.add(dateStr);
        }
    }

    input.reminders.forEach((reminder) => {
        const dateKey = getReminderDateKey(reminder.due_at);

        if (dateKey && dateKey >= monthStart && dateKey <= monthEnd) {
            reminderDates.add(dateKey);
        }

        if (
            reminder.recurrence_rule &&
            !reminder.is_completed &&
            reminder.due_at <= paddedTo
        ) {
            const recurrenceDates = getRecurrenceDatesInMonth(
                new Date(reminder.due_at),
                reminder.recurrence_rule,
                input.year,
                input.month,
                reminder.recurrence_end_at
            );

            recurrenceDates.forEach((date) => reminderDates.add(date));
        }
    });

    input.completionDates.forEach((date) => {
        if (date >= monthStart && date <= monthEnd) {
            reminderDates.add(date);
        }
    });

    const allDates = new Set([
        ...noteDates,
        ...reminderDates,
        ...habitDates,
    ]);
    const markers: HomeMarkedDates = {};

    allDates.forEach((date) => {
        markers[date] = {
            hasNote: noteDates.has(date) || undefined,
            hasReminder: reminderDates.has(date) || undefined,
            hasHabit: habitDates.has(date) || undefined,
        };
    });

    return markers;
}

export async function getHomeInitialData(
    year: number,
    month: number
): Promise<HomeInitialData> {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return getEmptyHomeInitialData();
    }

    const today = new Date().toISOString().split("T")[0];
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const [
        habitsResult,
        todayLogsResult,
        streaksResult,
        remindersResult,
        todayNoteResult,
        monthNotesResult,
        completionLogsResult,
        monthHabitLogsResult,
    ] = await Promise.all([
        supabase
            .from("habits")
            .select("id, title, icon, color, frequency_type, is_active, created_at")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false }),

        supabase
            .from("habit_logs")
            .select("habit_id, habits!inner(user_id)")
            .eq("habits.user_id", user.id)
            .eq("logged_date", today),

        supabase
            .from("v_habit_streaks")
            .select("habit_id, current_streak, best_streak")
            .eq("user_id", user.id),

        supabase
            .from("reminders")
            .select(
                "id, title, due_at, is_completed, recurrence_rule, recurrence_end_at, categories(name, color)"
            )
            .eq("user_id", user.id)
            .eq("is_completed", false)
            .order("due_at", { ascending: true }),

        supabase
            .from("daily_notes")
            .select("content, mood")
            .eq("user_id", user.id)
            .eq("note_date", today)
            .maybeSingle(),

        supabase
            .from("daily_notes")
            .select("note_date")
            .eq("user_id", user.id)
            .gte("note_date", monthStart)
            .lte("note_date", monthEnd),

        supabase
            .from("reminder_completion_logs")
            .select("occurred_on")
            .eq("user_id", user.id)
            .gte("occurred_on", monthStart)
            .lte("occurred_on", monthEnd),

        supabase
            .from("habit_logs")
            .select("logged_date, habits!inner(user_id)")
            .eq("habits.user_id", user.id)
            .gte("logged_date", monthStart)
            .lte("logged_date", monthEnd),
    ]);

    const habits = ((habitsResult.data || []) as HomeHabit[]).map((habit) => ({
        ...habit,
        frequency_type: habit.frequency_type ?? "daily",
    }));
    const todayLogs = (todayLogsResult.data || []) as Array<{ habit_id: string }>;
    const loggedToday = todayLogs.reduce<Record<string, boolean>>((acc, log) => {
        acc[log.habit_id] = true;
        return acc;
    }, {});
    const streaks = ((streaksResult.data || []) as HomeHabitStreak[]).reduce<
        Record<string, HomeHabitStreak>
    >((acc, streak) => {
        acc[streak.habit_id] = streak;
        return acc;
    }, {});
    const reminderRows = (remindersResult.data || []) as ReminderRow[];
    const activeReminders = getActiveRemindersForDisplay(reminderRows).map(
        normalizeReminder
    );
    const note = todayNoteResult.data
        ? ({
              content: todayNoteResult.data.content || "",
              mood: (todayNoteResult.data.mood || null) as HomeDailyNote["mood"],
          } satisfies HomeDailyNote)
        : null;
    const monthMarkers = buildMonthMarkers({
        year,
        month,
        noteDates: ((monthNotesResult.data || []) as Array<{ note_date: string }>).map(
            (noteEntry) => noteEntry.note_date
        ),
        reminders: reminderRows,
        completionDates: (
            (completionLogsResult.data || []) as Array<{ occurred_on: string | null }>
        )
            .map((entry) => entry.occurred_on)
            .filter((date): date is string => !!date),
        habitLogDates: (
            (monthHabitLogsResult.data || []) as Array<{ logged_date: string }>
        ).map((log) => log.logged_date),
        hasActiveHabits: habits.length > 0,
    });

    return {
        habits,
        loggedToday,
        streaks,
        reminders: activeReminders.slice(0, 5),
        stats: {
            pending_reminders: activeReminders.length,
            active_habits: habits.length,
            habits_completed_today: todayLogs.length,
        },
        note,
        monthMarkers,
    };
}
