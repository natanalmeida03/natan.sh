"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Flame } from "lucide-react";
import DailyNote from "@/components/DailyNote";
import Header from "@/components/Header";
import HomeCalendar from "@/components/HomeCalendar";
import QuickHabits from "@/components/QuickHabits";
import UpcomingReminders from "@/components/UpcomingReminders";
import { getDailyNoteByDate, getNotesForMonth } from "@/lib/daily-notes";
import {
    getHabitLogsByDate,
    getHabitLogsForMonth,
    logHabit,
    unlogHabit,
} from "@/lib/habits";
import { getRemindersByDate, getRemindersForMonth } from "@/lib/reminders";
import type { HomeInitialData, HomeReminder } from "@/types/home";

interface HomePageClientProps {
    initialData: HomeInitialData;
}

export default function HomePageClient({ initialData }: HomePageClientProps) {
    const router = useRouter();
    const now = new Date();
    const habits = initialData.habits;
    const streaks = initialData.streaks;
    const reminders = initialData.reminders;
    const [loggedToday, setLoggedToday] = useState(initialData.loggedToday);
    const [stats, setStats] = useState(initialData.stats);

    const handleLog = useCallback(async (habitId: string) => {
        const res = await logHabit(habitId);

        if (!res.error) {
            setLoggedToday((prev) => ({ ...prev, [habitId]: true }));
            setStats((prev) => ({
                ...prev,
                habits_completed_today: prev.habits_completed_today + 1,
            }));
        }
    }, []);

    const handleUnlog = useCallback(async (habitId: string) => {
        const res = await unlogHabit(habitId);

        if (!res.error) {
            setLoggedToday((prev) => ({ ...prev, [habitId]: false }));
            setStats((prev) => ({
                ...prev,
                habits_completed_today: Math.max(0, prev.habits_completed_today - 1),
            }));
        }
    }, []);

    const handleDateSelect = useCallback(
        async (dateStr: string) => {
            const [noteRes, remindersRes, habitLogsRes] = await Promise.all([
                getDailyNoteByDate(dateStr).catch(() => ({ data: null })),
                getRemindersByDate(dateStr).catch(() => ({ data: [] })),
                getHabitLogsByDate(dateStr).catch(() => ({ data: [] })),
            ]);

            const logEntries = (habitLogsRes.data || []) as Array<{ habit_id: string }>;
            const targetDate = new Date(`${dateStr}T12:00:00`);

            const dayHabits = habits
                .filter((habit) => {
                    if (habit.created_at && new Date(habit.created_at) > targetDate) {
                        return false;
                    }

                    return true;
                })
                .map((habit) => ({
                    id: habit.id,
                    title: habit.title,
                    icon: habit.icon,
                    logged: logEntries.some((entry) => entry.habit_id === habit.id),
                }));

            return {
                note: noteRes.data
                    ? {
                          content: noteRes.data.content || "",
                          mood: noteRes.data.mood || null,
                      }
                    : null,
                reminders: (remindersRes.data || []) as HomeReminder[],
                habits: dayHabits,
            };
        },
        [habits]
    );

    const handleMonthChange = useCallback(
        async (year: number, month: number) => {
            const [notesRes, remindersRes, habitLogsRes] = await Promise.all([
                getNotesForMonth(year, month).catch(() => ({ data: [] })),
                getRemindersForMonth(year, month).catch(() => ({ data: [] })),
                getHabitLogsForMonth(year, month).catch(() => ({ data: [] })),
            ]);

            const noteDates = new Set((notesRes.data || []) as string[]);
            const reminderDates = new Set((remindersRes.data || []) as string[]);
            const habitLogDates = new Set((habitLogsRes.data || []) as string[]);
            const habitDates = new Set<string>();

            if (habits.length > 0) {
                const lastDay = new Date(year, month, 0).getDate();

                for (let day = 1; day <= lastDay; day += 1) {
                    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    habitDates.add(dateStr);
                }
            }

            habitLogDates.forEach((date) => habitDates.add(date));

            const allDates = new Set([...noteDates, ...reminderDates, ...habitDates]);
            const markers: Record<
                string,
                { hasNote?: boolean; hasReminder?: boolean; hasHabit?: boolean }
            > = {};

            allDates.forEach((date) => {
                markers[date] = {
                    hasNote: noteDates.has(date) || undefined,
                    hasReminder: reminderDates.has(date) || undefined,
                    hasHabit: habitDates.has(date) || undefined,
                };
            });

            return markers;
        },
        [habits]
    );

    const today = now.toLocaleDateString("en-us", {
        weekday: "long",
        day: "2-digit",
        month: "long",
    });

    return (
        <div className="bg-background min-h-dvh flex">
            <div className="bg-background w-full max-w-[95%] sm:max-w-10/12 xl:max-w-6xl mx-auto flex flex-col py-6 sm:py-16">
                <div className="mb-5 sm:mb-6">
                    <Header />
                    <p className="text-accent mb-4 mt-5">{today}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3 mb-5 sm:mb-6">
                    <button
                        onClick={() => router.push("/habits")}
                        className="border border-foreground/15 rounded-lg px-3 py-2.5 text-center hover:border-foreground/30 transition-colors cursor-pointer"
                    >
                        <p className="text-lg sm:text-xl font-bold text-foreground">
                            {stats.habits_completed_today}/{stats.active_habits}
                        </p>
                        <p className="text-[10px] sm:text-xs text-foreground/50 font-mono flex items-center justify-center gap-1">
                            <Flame size={11} className="text-orange-400" />
                            habits
                        </p>
                    </button>

                    <button
                        onClick={() => router.push("/reminders")}
                        className="border border-foreground/15 rounded-lg px-3 py-2.5 text-center hover:border-foreground/30 transition-colors cursor-pointer"
                    >
                        <p
                            className={`text-lg sm:text-xl font-bold ${
                                stats.pending_reminders > 0
                                    ? "text-foreground"
                                    : "text-foreground/30"
                            }`}
                        >
                            {stats.pending_reminders}
                        </p>
                        <p className="text-[10px] sm:text-xs text-foreground/50 font-mono flex items-center justify-center gap-1">
                            <Bell size={11} />
                            reminders
                        </p>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                    <div className="lg:col-span-4 order-1 lg:order-1">
                        <HomeCalendar
                            onDateSelect={handleDateSelect}
                            onMonthChange={handleMonthChange}
                            initialMarkedDates={initialData.monthMarkers}
                            initialYear={now.getFullYear()}
                            initialMonth={now.getMonth()}
                        />
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-5 order-2 lg:order-2">
                        <DailyNote initialNote={initialData.note} />
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-5 order-3">
                        <UpcomingReminders reminders={reminders} />
                        <QuickHabits
                            habits={habits}
                            loggedToday={loggedToday}
                            streaks={streaks}
                            onLog={handleLog}
                            onUnlog={handleUnlog}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
