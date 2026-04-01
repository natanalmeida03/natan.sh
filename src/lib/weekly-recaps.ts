import type { DailyMood } from "@/types/home";
import type {
    WeeklyRecapHabitLeader,
    WeeklyRecapHomeState,
    WeeklyRecapMoodStats,
    WeeklyRecapPayload,
    WeeklyRecapRecord,
    WeeklyRecapStoryPalette,
} from "@/types/weekly-recaps";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

type WeeklyRecapRow = {
    id: string;
    user_id: string;
    week_start: string;
    week_end: string;
    story_theme: "terminal-premium" | "app-theme";
    payload: WeeklyRecapPayload;
    created_at: string;
    updated_at: string;
};

type ProfileRow = {
    username?: string | null;
};

type HabitRow = {
    id: string;
    title: string;
    icon?: string | null;
    color?: string | null;
    created_at?: string | null;
};

type HabitWeeklyStatRow = {
    habit_id: string;
    week_start: string;
    times_completed: number | null;
    completion_pct: number | null;
};

type ReminderCategoryLike =
    | {
          name: string;
          color?: string | null;
      }
    | Array<{
          name: string;
          color?: string | null;
      }>
    | null;

type ReminderRow = {
    id: string;
    title: string;
    due_at: string;
    is_completed: boolean;
    completed_at?: string | null;
    recurrence_rule?: string | null;
    recurrence_end_at?: string | null;
    categories?: ReminderCategoryLike;
};

type ReminderCompletionLogRow = {
    reminder_id: string;
    occurred_on: string;
    completed_at?: string | null;
};

type DailyNoteMoodRow = {
    note_date: string;
    mood: DailyMood | null;
};

type ReminderOccurrence = {
    reminder_id: string;
    date: string;
    is_completed: boolean;
    category_name?: string;
    category_color?: string | null;
};

type WeeklyRecapGenerationResult =
    | { data: WeeklyRecapRecord; setup_required?: false }
    | { error: string; setup_required?: boolean };

const ICAL_DAY_TO_JS: Record<string, number> = {
    SU: 0,
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6,
};

const DEFAULT_ACCENT = "#66d9ef";
const DEFAULT_STORY_THEME_PALETTE: WeeklyRecapStoryPalette = {
    background: "#F8F4EE",
    surface: "#F5F5F0",
    border: "#D0C9C0",
    foreground: "#2E2E2E",
    muted: "#6B6B6B",
    accent: "#1A1A1A",
};
const MOOD_WEIGHTS: Record<DailyMood, number> = {
    awful: 1,
    bad: 2,
    neutral: 3,
    good: 4,
    great: 5,
};

function isMissingRelationError(error: { code?: string } | null | undefined) {
    return error?.code === "42P01";
}

function getUtcDate(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function getDateKey(date: Date) {
    return getUtcDate(date).toISOString().split("T")[0];
}

export function getWeekEndDateKey(referenceDate: Date = new Date()) {
    const value = getUtcDate(referenceDate);
    const day = value.getUTCDay();
    const diff = (7 - day) % 7;
    value.setUTCDate(value.getUTCDate() + diff);
    return getDateKey(value);
}

export function getWeekRangeFromEnd(weekEnd: string) {
    const end = new Date(`${weekEnd}T00:00:00.000Z`);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 6);

    return {
        weekStart: getDateKey(start),
        weekEnd,
    };
}

function getDateKeysInRange(start: string, end: string) {
    const keys: string[] = [];
    const current = new Date(`${start}T00:00:00.000Z`);
    const target = new Date(`${end}T00:00:00.000Z`);

    while (current <= target) {
        keys.push(getDateKey(current));
        current.setUTCDate(current.getUTCDate() + 1);
    }

    return keys;
}

function getFriendlyTableMissingMessage() {
    return "Weekly recap storage is not ready yet. Create the weekly_summaries table first.";
}

function normalizeWeeklyRecapRow(value: unknown) {
    return value as WeeklyRecapRow;
}

function getReminderDateKey(dueAt: string) {
    const parsed = new Date(dueAt);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed.toISOString().split("T")[0];
}

function normalizeReminderCategory(category?: ReminderCategoryLike) {
    if (!category) {
        return null;
    }

    if (Array.isArray(category)) {
        return category[0] ?? null;
    }

    return category;
}

function matchesRecurrence(
    dueAt: Date,
    rule: string,
    targetDate: string,
    endAt?: string | null
) {
    const target = new Date(`${targetDate}T12:00:00.000Z`);
    const dueDate = new Date(Date.UTC(dueAt.getUTCFullYear(), dueAt.getUTCMonth(), dueAt.getUTCDate()));
    const targetDay = new Date(
        Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate())
    );

    if (targetDay < dueDate) {
        return false;
    }

    if (endAt) {
        const end = new Date(endAt);
        const endDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

        if (targetDay > endDay) {
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
        return target.getUTCDate() === dueAt.getUTCDate();
    }

    if (rule.includes("FREQ=YEARLY")) {
        return (
            target.getUTCDate() === dueAt.getUTCDate() &&
            target.getUTCMonth() === dueAt.getUTCMonth()
        );
    }

    const byDayMatch = rule.match(/BYDAY=([A-Z,]+)/);

    if (byDayMatch) {
        const targetDays = byDayMatch[1]
            .split(",")
            .map((day) => ICAL_DAY_TO_JS[day])
            .filter((day) => day !== undefined);

        return targetDays.includes(target.getUTCDay());
    }

    if (rule.includes("FREQ=WEEKLY")) {
        return target.getUTCDay() === dueAt.getUTCDay();
    }

    return false;
}

function sanitizeColor(color?: string | null) {
    if (!color) {
        return DEFAULT_ACCENT;
    }

    const trimmed = color.trim();
    const fullHex = /^#([0-9a-f]{6})$/i;
    const shortHex = /^#([0-9a-f]{3})$/i;

    if (fullHex.test(trimmed)) {
        return trimmed;
    }

    if (shortHex.test(trimmed)) {
        const [, group] = trimmed.match(shortHex) || [];

        if (!group) {
            return DEFAULT_ACCENT;
        }

        return `#${group
            .split("")
            .map((char) => `${char}${char}`)
            .join("")}`;
    }

    return DEFAULT_ACCENT;
}

function withOpacity(hexColor: string, opacityHex: string) {
    return `${sanitizeColor(hexColor)}${opacityHex}`;
}

function formatWeekRangeLabel(weekStart: string, weekEnd: string) {
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

function pickMoodLabel(average: number | null): Pick<
    WeeklyRecapMoodStats,
    "average_label" | "average_emoji"
> {
    if (average === null) {
        return {
            average_label: "No mood data",
            average_emoji: "\u2014",
        };
    }

    if (average >= 4.5) {
        return { average_label: "Locked in", average_emoji: "\u{1F604}" };
    }

    if (average >= 3.6) {
        return { average_label: "Upbeat", average_emoji: "\u{1F642}" };
    }

    if (average >= 2.6) {
        return { average_label: "Balanced", average_emoji: "\u{1F610}" };
    }

    if (average >= 1.6) {
        return { average_label: "Heavy week", average_emoji: "\u{1F615}" };
    }

    return { average_label: "Rough patch", average_emoji: "\u{1F61E}" };
}

function buildMoodStats(entries: DailyNoteMoodRow[]): WeeklyRecapMoodStats {
    const counts: Record<DailyMood, number> = {
        awful: 0,
        bad: 0,
        neutral: 0,
        good: 0,
        great: 0,
    };

    const validEntries = entries.filter((entry): entry is DailyNoteMoodRow & { mood: DailyMood } =>
        !!entry.mood
    );
    let total = 0;

    validEntries.forEach((entry) => {
        counts[entry.mood] += 1;
        total += MOOD_WEIGHTS[entry.mood];
    });

    const average = validEntries.length > 0 ? Number((total / validEntries.length).toFixed(1)) : null;
    const moodSummary = pickMoodLabel(average);

    return {
        average,
        average_label: moodSummary.average_label,
        average_emoji: moodSummary.average_emoji,
        entries: validEntries.length,
        counts,
    };
}

function buildHabitLeader(
    stats: HabitWeeklyStatRow[],
    habitMap: Map<string, HabitRow>
) {
    const sorted = [...stats].sort((left, right) => {
        const leftPct = left.completion_pct ?? -1;
        const rightPct = right.completion_pct ?? -1;

        if (leftPct !== rightPct) {
            return rightPct - leftPct;
        }

        return (right.times_completed ?? 0) - (left.times_completed ?? 0);
    });

    const winner = sorted[0];

    if (!winner) {
        return null;
    }

    const habit = habitMap.get(winner.habit_id);

    return {
        id: winner.habit_id,
        title: habit?.title || "Habit",
        icon: habit?.icon || null,
        color: habit?.color || null,
        times_completed: winner.times_completed ?? 0,
        completion_pct: winner.completion_pct,
    } satisfies WeeklyRecapHabitLeader;
}

function buildReminderOccurrences(
    reminders: ReminderRow[],
    completionLogs: ReminderCompletionLogRow[],
    dateKeys: string[],
    weekEnd: string
) {
    const completionMap = new Map<string, ReminderCompletionLogRow[]>();
    const completionKeys = new Set<string>();
    const reminderMap = new Map(reminders.map((reminder) => [reminder.id, reminder]));

    completionLogs.forEach((log) => {
        const key = `${log.reminder_id}:${log.occurred_on}`;
        completionKeys.add(key);
        const list = completionMap.get(log.occurred_on) || [];
        list.push(log);
        completionMap.set(log.occurred_on, list);
    });

    const occurrences: ReminderOccurrence[] = [];

    dateKeys.forEach((dateKey) => {
        reminders.forEach((reminder) => {
            const reminderDateKey = getReminderDateKey(reminder.due_at);
            const completionKey = `${reminder.id}:${dateKey}`;
            const category = normalizeReminderCategory(reminder.categories);

            if (reminderDateKey === dateKey) {
                if (reminder.recurrence_rule && completionKeys.has(completionKey)) {
                    return;
                }

                occurrences.push({
                    reminder_id: reminder.id,
                    date: dateKey,
                    is_completed: reminder.is_completed,
                    category_name: category?.name,
                    category_color: category?.color || null,
                });
                return;
            }

            if (
                reminder.recurrence_rule &&
                !reminder.is_completed &&
                !completionKeys.has(completionKey) &&
                new Date(reminder.due_at) <= new Date(`${weekEnd}T23:59:59.999Z`) &&
                matchesRecurrence(
                    new Date(reminder.due_at),
                    reminder.recurrence_rule,
                    dateKey,
                    reminder.recurrence_end_at
                )
            ) {
                occurrences.push({
                    reminder_id: reminder.id,
                    date: dateKey,
                    is_completed: false,
                    category_name: category?.name,
                    category_color: category?.color || null,
                });
            }
        });

        (completionMap.get(dateKey) || []).forEach((log) => {
            const reminder = reminderMap.get(log.reminder_id);
            const category = normalizeReminderCategory(reminder?.categories);

            occurrences.push({
                reminder_id: log.reminder_id,
                date: dateKey,
                is_completed: true,
                category_name: category?.name,
                category_color: category?.color || null,
            });
        });
    });

    return occurrences;
}

function truncateText(value: string, maxLength: number) {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, Math.max(maxLength - 3, 0)).trimEnd()}...`;
}

function buildHighlights(payload: {
    habitCompletionRate: number | null;
    habitStats: WeeklyRecapPayload["habit_stats"];
    reminderStats: WeeklyRecapPayload["reminder_stats"];
    moodStats: WeeklyRecapMoodStats;
}) {
    const highlights = [];

    if (payload.habitStats.tracked_habits === 0) {
        highlights.push({
            id: "habits",
            label: "Habits",
            value: "No active habits tracked this week.",
        });
    } else if ((payload.habitCompletionRate ?? 0) >= 85) {
        highlights.push({
            id: "habits",
            label: "Habits",
            value: `${payload.habitCompletionRate}% of your weekly habit targets got checked off.`,
        });
    } else if ((payload.habitCompletionRate ?? 0) >= 55) {
        highlights.push({
            id: "habits",
            label: "Habits",
            value: `Steady pace: ${payload.habitCompletionRate}% habit completion across ${payload.habitStats.tracked_habits} habits.`,
        });
    } else {
        highlights.push({
            id: "habits",
            label: "Habits",
            value: `${payload.habitStats.total_checkins} check-ins this week. A reset is within reach next Sunday.`,
        });
    }

    if (payload.reminderStats.total === 0) {
        highlights.push({
            id: "reminders",
            label: "Reminders",
            value: "No reminders landed on your week, so the board stayed clear.",
        });
    } else {
        const reminderLine = `${payload.reminderStats.completed}/${payload.reminderStats.total} reminders completed`;
        const backlogLine =
            payload.reminderStats.overdue > 0
                ? ` with ${payload.reminderStats.overdue} left overdue.`
                : payload.reminderStats.pending > 0
                  ? ` and ${payload.reminderStats.pending} still open on Sunday.`
                  : ".";

        highlights.push({
            id: "reminders",
            label: "Reminders",
            value: `${reminderLine}${backlogLine}`,
        });
    }

    if (payload.moodStats.entries === 0) {
        highlights.push({
            id: "mood",
            label: "Mood",
            value: "No mood check-ins this week. A few daily notes will make the next recap richer.",
        });
    } else {
        highlights.push({
            id: "mood",
            label: "Mood",
            value: `${payload.moodStats.average_emoji} ${payload.moodStats.average_label} with an average mood of ${payload.moodStats.average}/5 across ${payload.moodStats.entries} days.`,
        });
    }

    return highlights.map((highlight) => ({
        ...highlight,
        value: truncateText(highlight.value, 88),
    }));
}

function buildStoryPalette(accentInput?: string | null) {
    const accent = sanitizeColor(accentInput);

    return {
        accent,
        accent_soft: withOpacity(accent, "22"),
        accent_strong: withOpacity(accent, "CC"),
    };
}

async function buildWeeklyRecapPayload(userId: string, weekEnd: string) {
    const { weekStart } = getWeekRangeFromEnd(weekEnd);
    const dateKeys = getDateKeysInRange(weekStart, weekEnd);
    const weekEndIso = `${weekEnd}T23:59:59.999Z`;

    const [
        profileResult,
        habitsResult,
        habitWeeklyStatsResult,
        remindersResult,
        reminderLogsResult,
        notesResult,
    ] = await Promise.all([
        supabaseAdmin
            .from("profiles")
            .select("username")
            .eq("id", userId)
            .maybeSingle(),

        supabaseAdmin
            .from("habits")
            .select("id, title, icon, color, created_at")
            .eq("user_id", userId)
            .lte("created_at", weekEndIso),

        supabaseAdmin
            .from("v_habit_weekly_stats")
            .select("habit_id, week_start, times_completed, completion_pct")
            .eq("user_id", userId)
            .eq("week_start", weekStart),

        supabaseAdmin
            .from("reminders")
            .select(
                "id, title, due_at, is_completed, completed_at, recurrence_rule, recurrence_end_at, categories(name, color)"
            )
            .eq("user_id", userId)
            .lte("due_at", weekEndIso),

        supabaseAdmin
            .from("reminder_completion_logs")
            .select("reminder_id, occurred_on, completed_at")
            .eq("user_id", userId)
            .gte("occurred_on", weekStart)
            .lte("occurred_on", weekEnd),

        supabaseAdmin
            .from("daily_notes")
            .select("note_date, mood")
            .eq("user_id", userId)
            .gte("note_date", weekStart)
            .lte("note_date", weekEnd)
            .not("mood", "is", null),
    ]);

    const profile = (profileResult.data || null) as ProfileRow | null;
    const habits = (habitsResult.data || []) as HabitRow[];
    const habitStats = (habitWeeklyStatsResult.data || []) as HabitWeeklyStatRow[];
    const reminders = ((remindersResult.data || []) as ReminderRow[]).map((reminder) => ({
        ...reminder,
        recurrence_rule: reminder.recurrence_rule ?? null,
        recurrence_end_at: reminder.recurrence_end_at ?? null,
    }));
    const reminderLogs = (reminderLogsResult.data || []) as ReminderCompletionLogRow[];
    const moodEntries = (notesResult.data || []) as DailyNoteMoodRow[];
    const habitMap = new Map(habits.map((habit) => [habit.id, habit]));
    const trackedHabits = habits.filter((habit) => {
        if (!habit.created_at) {
            return true;
        }

        return new Date(habit.created_at) <= new Date(weekEndIso);
    });
    const totalCheckins = habitStats.reduce(
        (sum, entry) => sum + (entry.times_completed ?? 0),
        0
    );
    const completionValues = habitStats
        .map((entry) => entry.completion_pct)
        .filter((value): value is number => typeof value === "number");
    const habitCompletionRate =
        completionValues.length > 0
            ? Math.round(
                  completionValues.reduce((sum, value) => sum + value, 0) /
                      completionValues.length
              )
            : trackedHabits.length > 0
              ? 0
              : null;
    const strongestHabit = buildHabitLeader(habitStats, habitMap);
    const occurrences = buildReminderOccurrences(reminders, reminderLogs, dateKeys, weekEnd);
    const reminderCategoryCounts = new Map<
        string,
        { name: string; color?: string | null; count: number }
    >();
    const reminderStats = occurrences.reduce(
        (acc, occurrence) => {
            acc.total += 1;

            if (occurrence.is_completed) {
                acc.completed += 1;

                if (occurrence.category_name) {
                    const key = occurrence.category_name;
                    const current = reminderCategoryCounts.get(key) || {
                        name: occurrence.category_name,
                        color: occurrence.category_color,
                        count: 0,
                    };

                    current.count += 1;
                    reminderCategoryCounts.set(key, current);
                }

                return acc;
            }

            if (occurrence.date === weekEnd) {
                acc.pending += 1;
            } else {
                acc.overdue += 1;
            }

            return acc;
        },
        {
            total: 0,
            completed: 0,
            overdue: 0,
            pending: 0,
            top_category: null as WeeklyRecapPayload["reminder_stats"]["top_category"],
        }
    );
    const topCategory = [...reminderCategoryCounts.values()].sort(
        (left, right) => right.count - left.count
    )[0];
    const moodStats = buildMoodStats(moodEntries);
    const palette = buildStoryPalette(
        strongestHabit?.color || topCategory?.color || DEFAULT_ACCENT
    );
    const payload = {
        username: truncateText(profile?.username?.toUpperCase() || "USER", 18),
        headline: "WEEKLY RECAP",
        week_start: weekStart,
        week_end: weekEnd,
        habit_stats: {
            tracked_habits: trackedHabits.length,
            total_checkins: totalCheckins,
            completion_rate: habitCompletionRate,
            strongest_habit: strongestHabit,
        },
        reminder_stats: {
            ...reminderStats,
            top_category: topCategory || null,
        },
        mood_stats: moodStats,
        highlights: [] as WeeklyRecapPayload["highlights"],
        palette,
    } satisfies WeeklyRecapPayload;

    payload.highlights = buildHighlights({
        habitCompletionRate,
        habitStats: payload.habit_stats,
        reminderStats: payload.reminder_stats,
        moodStats,
    });

    return payload;
}

async function saveWeeklyRecapRecord(userId: string, payload: WeeklyRecapPayload) {
    const { data, error } = await supabaseAdmin
        .from("weekly_summaries")
        .upsert(
            {
                user_id: userId,
                week_start: payload.week_start,
                week_end: payload.week_end,
                story_theme: "app-theme",
                payload,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: "user_id,week_end",
            }
        )
        .select("*")
        .single();

    if (error) {
        if (isMissingRelationError(error)) {
            return {
                error: getFriendlyTableMissingMessage(),
                setup_required: true,
            } satisfies WeeklyRecapGenerationResult;
        }

        return { error: error.message } satisfies WeeklyRecapGenerationResult;
    }

    return {
        data: normalizeWeeklyRecapRow(data),
    } satisfies WeeklyRecapGenerationResult;
}

export async function generateWeeklyRecapForUser(
    userId: string,
    weekEnd: string = getWeekEndDateKey()
) {
    const payload = await buildWeeklyRecapPayload(userId, weekEnd);
    return saveWeeklyRecapRecord(userId, payload);
}

export async function listWeeklyRecapsForUserId(userId: string, limit: number = 6) {
    const { data, error } = await supabaseAdmin
        .from("weekly_summaries")
        .select("*")
        .eq("user_id", userId)
        .order("week_end", { ascending: false })
        .limit(limit);

    if (error) {
        if (isMissingRelationError(error)) {
            return {
                data: [] as WeeklyRecapRecord[],
                setup_required: true,
                message: getFriendlyTableMissingMessage(),
            };
        }

        return {
            data: [] as WeeklyRecapRecord[],
            message: error.message,
        };
    }

    return {
        data: (data || []).map(normalizeWeeklyRecapRow),
        setup_required: false,
    };
}

export async function getWeeklyRecapByIdForUser(
    summaryId: string,
    userId: string
) {
    const { data, error } = await supabaseAdmin
        .from("weekly_summaries")
        .select("*")
        .eq("id", summaryId)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        if (isMissingRelationError(error)) {
            return {
                error: getFriendlyTableMissingMessage(),
                setup_required: true,
            };
        }

        return { error: error.message };
    }

    if (!data) {
        return { error: "Weekly recap not found" };
    }

    return { data: normalizeWeeklyRecapRow(data) };
}

export async function getWeeklyRecapHomeStateForUser(userId: string): Promise<WeeklyRecapHomeState> {
    const currentWeekEnd = getWeekEndDateKey();
    const result = await listWeeklyRecapsForUserId(userId, 6);

    return {
        summaries: result.data,
        current_week_end: currentWeekEnd,
        setup_required: !!result.setup_required,
        setup_message: result.message,
    };
}

export async function generateWeeklyRecapForCurrentUser(weekEnd?: string) {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" } satisfies WeeklyRecapGenerationResult;
    }

    return generateWeeklyRecapForUser(user.id, weekEnd);
}

export async function generateWeeklyRecapsForAllUsers(weekEnd: string = getWeekEndDateKey()) {
    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id");

    if (error) {
        return { error: error.message };
    }

    const userIds = (data || [])
        .map((entry) => entry.id as string)
        .filter(Boolean);
    const results = await Promise.all(
        userIds.map(async (userId) => {
            const result = await generateWeeklyRecapForUser(userId, weekEnd);
            return {
                userId,
                ok: "data" in result,
                error: "error" in result ? result.error : null,
            };
        })
    );

    return {
        week_end: weekEnd,
        processed: userIds.length,
        generated: results.filter((result) => result.ok).length,
        failed: results.filter((result) => !result.ok),
    };
}

function escapeXml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

function formatPercent(value: number | null) {
    if (value === null) {
        return "\u2014";
    }

    return `${Math.round(value)}%`;
}

function formatMoodValue(value: number | null) {
    if (value === null) {
        return "\u2014";
    }

    return `${value.toFixed(1)}/5`;
}

function resolveStoryThemePalette(
    overrides?: Partial<WeeklyRecapStoryPalette>
): WeeklyRecapStoryPalette {
    return {
        background: sanitizeColor(
            overrides?.background || DEFAULT_STORY_THEME_PALETTE.background
        ),
        surface: sanitizeColor(overrides?.surface || DEFAULT_STORY_THEME_PALETTE.surface),
        border: sanitizeColor(overrides?.border || DEFAULT_STORY_THEME_PALETTE.border),
        foreground: sanitizeColor(
            overrides?.foreground || DEFAULT_STORY_THEME_PALETTE.foreground
        ),
        muted: sanitizeColor(overrides?.muted || DEFAULT_STORY_THEME_PALETTE.muted),
        accent: sanitizeColor(overrides?.accent || DEFAULT_STORY_THEME_PALETTE.accent),
    };
}

function splitTextIntoLines(value: string, maxCharsPerLine: number, maxLines: number) {
    const words = value.split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return [""];
    }

    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
        const nextLine = currentLine ? `${currentLine} ${word}` : word;

        if (nextLine.length <= maxCharsPerLine) {
            currentLine = nextLine;
            return;
        }

        if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
            return;
        }

        lines.push(word.slice(0, maxCharsPerLine));
        currentLine = word.slice(maxCharsPerLine);
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    if (lines.length <= maxLines) {
        return lines;
    }

    const trimmed = lines.slice(0, maxLines);
    const lastLine = trimmed[maxLines - 1] || "";
    trimmed[maxLines - 1] = truncateText(lastLine, maxCharsPerLine);
    return trimmed;
}

function renderMultilineText(options: {
    text: string;
    x: number;
    y: number;
    fill: string;
    fontSize: number;
    lineHeight: number;
    maxCharsPerLine: number;
    maxLines: number;
    fontWeight?: string | number;
    letterSpacing?: number;
}) {
    const lines = splitTextIntoLines(
        options.text,
        options.maxCharsPerLine,
        options.maxLines
    );

    return `
        <text x="${options.x}" y="${options.y}" fill="${options.fill}" font-size="${options.fontSize}" ${options.fontWeight ? `font-weight="${options.fontWeight}"` : ""} ${options.letterSpacing ? `letter-spacing="${options.letterSpacing}"` : ""} font-family="'Fira Code', monospace">
            ${lines
                .map((line, index) => {
                    const dy = index === 0 ? 0 : options.lineHeight;
                    return `<tspan x="${options.x}" dy="${dy}">${escapeXml(line)}</tspan>`;
                })
                .join("")}
        </text>
    `;
}

function buildMoodBar(
    payload: WeeklyRecapPayload,
    themePalette: WeeklyRecapStoryPalette,
    mood: DailyMood,
    x: number,
    y: number,
    width: number
) {
    const maxCount = Math.max(...Object.values(payload.mood_stats.counts), 1);
    const count = payload.mood_stats.counts[mood];
    const fillWidth = Math.max((count / maxCount) * width, count > 0 ? 12 : 0);
    const emojiMap: Record<DailyMood, string> = {
        awful: "\u{1F61E}",
        bad: "\u{1F615}",
        neutral: "\u{1F610}",
        good: "\u{1F642}",
        great: "\u{1F604}",
    };

    return `
        <text x="${x}" y="${y}" fill="${themePalette.foreground}" font-size="28" font-family="'Fira Code', monospace">${emojiMap[mood]}</text>
        <rect x="${x + 44}" y="${y - 22}" width="${width}" height="14" rx="7" fill="${withOpacity(themePalette.foreground, "14")}" />
        <rect x="${x + 44}" y="${y - 22}" width="${fillWidth}" height="14" rx="7" fill="${themePalette.accent}" />
        <text x="${x + width + 70}" y="${y - 8}" fill="${themePalette.muted}" font-size="22" font-family="'Fira Code', monospace">${count}</text>
    `;
}

export function renderWeeklyRecapStorySvg(
    record: WeeklyRecapRecord,
    themePaletteOverrides?: Partial<WeeklyRecapStoryPalette>
) {
    const { payload } = record;
    const themePalette = resolveStoryThemePalette(themePaletteOverrides);
    const dataAccent = sanitizeColor(payload.palette.accent);
    const highlightMarkup = payload.highlights
        .slice(0, 3)
        .map((highlight, index) => {
            const top = 916 + index * 172;

            return `
                <rect x="72" y="${top}" width="936" height="148" rx="28" fill="${themePalette.surface}" stroke="${themePalette.border}" />
                <rect x="96" y="${top + 24}" width="4" height="100" rx="2" fill="${themePalette.accent}" />
                <text x="120" y="${top + 50}" fill="${themePalette.muted}" font-size="22" letter-spacing="2.5" font-family="'Fira Code', monospace">${escapeXml(highlight.label.toUpperCase())}</text>
                ${renderMultilineText({
                    text: highlight.value,
                    x: 120,
                    y: top + 88,
                    fill: themePalette.foreground,
                    fontSize: 28,
                    lineHeight: 34,
                    maxCharsPerLine: 48,
                    maxLines: 2,
                })}
            `;
        })
        .join("");
    const strongestHabit = payload.habit_stats.strongest_habit;
    const strongestHabitLabel = strongestHabit
        ? `${strongestHabit.icon ? `${strongestHabit.icon} ` : ""}${strongestHabit.title}`
        : "No standout habit";
    const strongestHabitMeta = strongestHabit
        ? `${strongestHabit.times_completed} check-ins - ${formatPercent(strongestHabit.completion_pct)} hit rate`
        : "Your next standout week starts here.";
    const openReminderCount =
        payload.reminder_stats.overdue + payload.reminder_stats.pending;
    const topCategoryLabel = payload.reminder_stats.top_category
        ? `${payload.reminder_stats.top_category.name} - ${payload.reminder_stats.top_category.count} completed`
        : "Built from habits, reminders, and mood check-ins.";

    return `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1080" height="1920" fill="${themePalette.background}" />
    <rect x="54" y="54" width="972" height="1812" rx="42" fill="${themePalette.background}" stroke="${themePalette.border}" stroke-width="2" />

    <rect x="72" y="92" width="140" height="6" rx="3" fill="${themePalette.accent}" />
    <text x="72" y="138" fill="${themePalette.muted}" font-size="22" letter-spacing="3" font-family="'Fira Code', monospace">NATAN.SH</text>
    <text x="72" y="226" fill="${themePalette.foreground}" font-size="88" font-weight="700" font-family="'Fira Code', monospace">${escapeXml(payload.headline)}</text>
    <text x="72" y="276" fill="${themePalette.muted}" font-size="26" font-family="'Fira Code', monospace">@${escapeXml(payload.username)} - ${escapeXml(formatWeekRangeLabel(payload.week_start, payload.week_end))}</text>

    <rect x="72" y="332" width="936" height="248" rx="32" fill="${themePalette.surface}" stroke="${themePalette.border}" />
    <text x="108" y="382" fill="${themePalette.muted}" font-size="22" letter-spacing="2.5" font-family="'Fira Code', monospace">HABIT COMPLETION</text>
    <text x="108" y="520" fill="${themePalette.foreground}" font-size="164" font-weight="700" font-family="'Fira Code', monospace">${escapeXml(formatPercent(payload.habit_stats.completion_rate))}</text>
    <text x="108" y="558" fill="${themePalette.muted}" font-size="24" font-family="'Fira Code', monospace">${escapeXml(payload.habit_stats.total_checkins.toString())} check-ins across ${escapeXml(payload.habit_stats.tracked_habits.toString())} habits</text>

    <rect x="672" y="364" width="300" height="170" rx="24" fill="${withOpacity(dataAccent, "14")}" stroke="${themePalette.border}" />
    <text x="704" y="408" fill="${themePalette.muted}" font-size="20" letter-spacing="2.5" font-family="'Fira Code', monospace">STRONGEST HABIT</text>
    ${renderMultilineText({
        text: strongestHabitLabel,
        x: 704,
        y: 454,
        fill: themePalette.foreground,
        fontSize: 34,
        lineHeight: 38,
        maxCharsPerLine: 18,
        maxLines: 2,
        fontWeight: 600,
    })}
    <text x="704" y="532" fill="${themePalette.muted}" font-size="22" font-family="'Fira Code', monospace">${escapeXml(strongestHabitMeta)}</text>

    <rect x="72" y="620" width="296" height="170" rx="28" fill="${themePalette.surface}" stroke="${themePalette.border}" />
    <rect x="392" y="620" width="296" height="170" rx="28" fill="${themePalette.surface}" stroke="${themePalette.border}" />
    <rect x="712" y="620" width="296" height="170" rx="28" fill="${themePalette.surface}" stroke="${themePalette.border}" />

    <text x="108" y="666" fill="${themePalette.muted}" font-size="20" letter-spacing="2.5" font-family="'Fira Code', monospace">DONE</text>
    <text x="108" y="742" fill="${themePalette.foreground}" font-size="88" font-weight="700" font-family="'Fira Code', monospace">${escapeXml(payload.reminder_stats.completed.toString())}</text>
    <text x="108" y="774" fill="${themePalette.muted}" font-size="22" font-family="'Fira Code', monospace">reminders closed</text>

    <text x="428" y="666" fill="${themePalette.muted}" font-size="20" letter-spacing="2.5" font-family="'Fira Code', monospace">OPEN</text>
    <text x="428" y="742" fill="${themePalette.foreground}" font-size="88" font-weight="700" font-family="'Fira Code', monospace">${escapeXml(openReminderCount.toString())}</text>
    <text x="428" y="774" fill="${themePalette.muted}" font-size="22" font-family="'Fira Code', monospace">overdue + Sunday open</text>

    <text x="748" y="666" fill="${themePalette.muted}" font-size="20" letter-spacing="2.5" font-family="'Fira Code', monospace">MOOD</text>
    <text x="748" y="734" fill="${themePalette.foreground}" font-size="60" font-weight="700" font-family="'Fira Code', monospace">${escapeXml(payload.mood_stats.average_emoji)} ${escapeXml(formatMoodValue(payload.mood_stats.average))}</text>
    <text x="748" y="774" fill="${themePalette.muted}" font-size="22" font-family="'Fira Code', monospace">${escapeXml(payload.mood_stats.average_label)}</text>

    <rect x="72" y="822" width="936" height="62" rx="22" fill="${themePalette.surface}" stroke="${themePalette.border}" />
    <circle cx="106" cy="853" r="8" fill="${dataAccent}" />
    <text x="126" y="861" fill="${themePalette.foreground}" font-size="22" font-family="'Fira Code', monospace">${escapeXml(truncateText(topCategoryLabel, 62))}</text>

    ${highlightMarkup}

    <rect x="72" y="1452" width="936" height="272" rx="32" fill="${themePalette.surface}" stroke="${themePalette.border}" />
    <text x="108" y="1502" fill="${themePalette.muted}" font-size="22" letter-spacing="2.5" font-family="'Fira Code', monospace">MOOD BREAKDOWN</text>
    <text x="108" y="1540" fill="${themePalette.foreground}" font-size="24" font-family="'Fira Code', monospace">${escapeXml(
        payload.mood_stats.entries > 0
            ? `${payload.mood_stats.entries} mood check-ins recorded this week.`
            : "No mood check-ins recorded this week."
    )}</text>

    <g transform="translate(108 1080)">
        ${buildMoodBar(payload, themePalette, "great", 0, 510, 240)}
        ${buildMoodBar(payload, themePalette, "good", 330, 510, 240)}
        ${buildMoodBar(payload, themePalette, "neutral", 0, 570, 240)}
        ${buildMoodBar(payload, themePalette, "bad", 330, 570, 240)}
        ${buildMoodBar(payload, themePalette, "awful", 660, 570, 120)}
    </g>

    <text x="72" y="1810" fill="${themePalette.muted}" font-size="20" font-family="'Fira Code', monospace">Rendered with your current app theme for easy story sharing.</text>
    <text x="848" y="1810" fill="${themePalette.accent}" font-size="20" letter-spacing="3" font-family="'Fira Code', monospace">SHARE</text>
</svg>
    `.trim();
}
