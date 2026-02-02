"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Flame, Filter } from "lucide-react";
import HabitCard from "@/components/HabitCard";
import {
   getHabits,
   logHabit,
   unlogHabit,
   deleteHabit,
   toggleHabitActive,
   isHabitLoggedToday,
} from "@/lib/habits";
import { getHabitStreaks } from "@/lib/stats";
import { Habit, Streak } from "@/types";
import Header from "@/components/Header";

export default function HabitsPage() {
    const router = useRouter();

    const [habits, setHabits] = useState<Habit[]>([]);
    const [loggedToday, setLoggedToday] = useState<Record<string, boolean>>({});
    const [streaks, setStreaks] = useState<Record<string, Streak>>({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"active" | "paused" | "all">("active");

    const loadData = useCallback(async () => {
        setLoading(true);

        const activeOnly = filter === "active" ? true : filter === "paused" ? false : undefined;
        const [habitsRes, streaksRes] = await Promise.all([
            getHabits({ active_only: activeOnly !== undefined ? activeOnly : undefined }),
            getHabitStreaks(),
        ]);

        if (habitsRes.data) {
            const habitList = habitsRes.data as Habit[];

            // Filtra pausados se necessário
            const filtered =
                filter === "paused"
                ? habitList.filter((h) => !h.is_active)
                : filter === "all"
                ? habitList
                : habitList;

            setHabits(filtered);

            const todayChecks = await Promise.all(
                filtered.map(async (h) => {
                const res = await isHabitLoggedToday(h.id);
                return { id: h.id, logged: res.logged ?? false };
                })
            );

            const todayMap: Record<string, boolean> = {};
            todayChecks.forEach((c) => {
                todayMap[c.id] = c.logged;
            });
            setLoggedToday(todayMap);
        }

        if (streaksRes.data) {
            const streakMap: Record<string, Streak> = {};
            (streaksRes.data as Streak[]).forEach((s) => {
                streakMap[s.habit_id] = s;
            });
            setStreaks(streakMap);
        }

        setLoading(false);
    }, [filter]);

    useEffect(() => {
        const fetchData = async () => {
            await loadData();
        };
        fetchData();
    }, [loadData]);

    async function handleLog(habitId: string) {
        const res = await logHabit(habitId);
        if (!res.error) {
            setLoggedToday((prev) => ({ ...prev, [habitId]: true }));
        }
    }

    async function handleUnlog(habitId: string) {
        const res = await unlogHabit(habitId);
        if (!res.error) {
            setLoggedToday((prev) => ({ ...prev, [habitId]: false }));
        }
    }

    async function handleDelete(habitId: string) {
        const res = await deleteHabit(habitId);
        if (!res.error) {
            setHabits((prev) => prev.filter((h) => h.id !== habitId));
        }
    }

    async function handleToggleActive(habitId: string) {
        const res = await toggleHabitActive(habitId);
        if (!res.error) {
            await loadData();
        }
    }

    const totalActive = habits.filter((h) => h.is_active).length;
    const doneToday = Object.values(loggedToday).filter(Boolean).length;
    const bestStreak = Math.max(0, ...Object.values(streaks).map((s) => s.current_streak));

    return (
        <div className="bg-[#F8F4EE] min-h-dvh flex">
            <div className="bg-[#F8F4EE] w-full max-w-[95%] sm:max-w-10/12 mx-auto flex flex-col py-6 sm:py-16">
                <Header />
                {/* Stats bar */}
                { (
                <div className="flex gap-3 mb-4 sm:mb-5">
                    <div className="flex-1 border border-[#2E2E2E]/15 rounded-md px-3 py-2 text-center">
                        <p className="text-lg sm:text-xl font-bold text-[#2E2E2E]">
                            {doneToday?doneToday:"0"}/{totalActive?totalActive:"0"}
                        </p>
                        <p className="text-[10px] sm:text-xs text-[#2E2E2E]/50 font-mono">Today</p>
                    </div>
                    <div className="flex-1 border border-[#2E2E2E]/15 rounded-md px-3 py-2 text-center">
                        <p className="text-lg sm:text-xl font-bold text-orange-500 flex items-center justify-center gap-1">
                            <Flame size={18} />
                            {bestStreak?bestStreak:0}
                        </p>
                        <p className="text-[10px] sm:text-xs text-[#2E2E2E]/50 font-mono">
                            Best streak
                        </p>
                    </div>
                    <div className="flex-1 border border-[#2E2E2E]/15 rounded-md px-3 py-2 text-center">
                        <p className="text-lg sm:text-xl font-bold text-[#2E2E2E]">
                            {totalActive?totalActive:"0"}
                        </p>
                        <p className="text-[10px] sm:text-xs text-[#2E2E2E]/50 font-mono">actives</p>
                    </div>
                </div>
                )}

                {/* Filter tabs */}
                <div className="flex items-center gap-3 mb-4 p-1 justify-between ">
                    <div className="flex items-center gap-3 p-1">
                        {(["active", "paused", "all"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`py-1.5 rounded-md text-sm cursor-pointer ${
                                    filter === f
                                    ? "font-bold"
                                    : "hover:font-bold "
                                }`}
                            >
                                {f === "active" ? "Actives" : f === "paused" ? "Paused" : "All"}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => router.push("/habits/new")}
                        className="px-4 py-2 bg-[#2E2E2E] text-[#F8F4EE] rounded-md font-medium text-xs sm:text-sm hover:bg-[#1a1a1a] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        Create new habit
                    </button>
                </div>

                {/* List */}
                {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-[#2E2E2E]/20 border-t-[#2E2E2E] rounded-full animate-spin" />
                </div>
                ) : habits.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <p className="text-sm sm:text-base text-[#2E2E2E]/70 mb-1">
                        No {filter !== "all" ? ` ${filter === "active" ? "active" : "paused"}` : ""} habits
                    </p>
                    <p className="text-xs text-[#2E2E2E]/40 mb-4">
                        Start by creating your first habit.
                    </p>
                    <button
                        onClick={() => router.push("/habits/new")}
                        className="px-4 py-2 bg-[#2E2E2E] text-[#F8F4EE] rounded-md font-medium text-xs sm:text-sm hover:bg-[#1a1a1a] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        {"> "}
                        Create habit
                    </button>
                </div>
                ) : (
                <div className="flex flex-col gap-2 sm:gap-3">
                    {habits.map((habit) => (
                        <HabitCard
                            key={habit.id}
                            habit={habit}
                            isLoggedToday={loggedToday[habit.id] || false}
                            currentStreak={streaks[habit.id]?.current_streak}
                            onLog={handleLog}
                            onUnlog={handleUnlog}
                            onEdit={(id) => router.push(`/habits/${id}`)}
                            onDelete={handleDelete}
                            onToggleActive={handleToggleActive}
                        />
                    ))}
                </div>
                )}
            </div>
        </div>
    );
}