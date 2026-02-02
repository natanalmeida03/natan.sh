"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Flame, Bell, Target, RotateCw } from "lucide-react";
import DailyNote from "@/components/DailyNote";
import QuickHabits from "@/components/QuickHabits";
import UpcomingReminders from "@/components/UpcomingReminders";
import HomeCalendar from "@/components/HomeCalendar";
import { getDashboardStats } from "@/lib/stats";
import { getHabits, logHabit, unlogHabit, isHabitLoggedToday, getHabitLogsByDate, getHabitLogsForMonth } from "@/lib/habits";
import { getUpcomingReminders, getReminders, getRemindersByDate, getRemindersForMonth } from "@/lib/reminders";
import { getTodayRoutines } from "@/lib/routines";
import { getProfile } from "@/lib/profile";
import { getDailyNoteByDate, getNotesForMonth } from "@/lib/daily-notes";
import Header from "@/components/Header";

interface Habit {
  id: string;
  title: string;
  icon?: string | null;
  color?: string | null;
}

interface Streak {
  habit_id: string;
  current_streak: number;
  best_streak: number;
}

interface Reminder {
  id: string;
  title: string;
  due_at: string;
  is_completed: boolean;
  categories?: { name: string; color?: string | null } | null;
}

interface Routine {
  id: string;
  title: string;
  scheduled_time?: string | null;
  routine_steps?: { id: string }[];
}

interface GoalData {
  goal_id: string;
  title: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  progress_pct: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function HomePage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loggedToday, setLoggedToday] = useState<Record<string, boolean>>({});
  const [streaks, setStreaks] = useState<Record<string, Streak>>({});
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [stats, setStats] = useState({
    pending_reminders: 0,
    active_habits: 0,
    habits_completed_today: 0,
    today_routines: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    const [
      profileRes,
      dashRes,
      habitsRes,
      remindersRes,
      overdueRes,
      routinesRes,
    ] = await Promise.all([
      getProfile(),
      getDashboardStats(),
      getHabits({ active_only: true }),
      getUpcomingReminders(5),
      getReminders({ completed: false }),
      getTodayRoutines(),
    ]);

    // Profile
    if (profileRes.data) {
      setUsername(profileRes.data.username || "");
    }

    // Dashboard stats
    if (dashRes.data) {
      setStats({
        pending_reminders: dashRes.data.pending_reminders,
        active_habits: dashRes.data.active_habits,
        habits_completed_today: dashRes.data.habits_completed_today,
        today_routines: dashRes.data.today_routines,
      });

      // Streaks
      const streakMap: Record<string, Streak> = {};
      (dashRes.data.streaks as Streak[]).forEach((s) => {
        streakMap[s.habit_id] = s;
      });
      setStreaks(streakMap);

      // Goals
      setGoals(dashRes.data.goals as GoalData[]);
    }

    // Habits
    if (habitsRes.data) {
      const list = habitsRes.data as Habit[];
      setHabits(list);

      const todayChecks = await Promise.all(
        list.map(async (h) => {
          const res = await isHabitLoggedToday(h.id);
          return { id: h.id, logged: res.logged ?? false };
        })
      );
      const todayMap: Record<string, boolean> = {};
      todayChecks.forEach((c) => (todayMap[c.id] = c.logged));
      setLoggedToday(todayMap);
    }

    // Reminders
    if (remindersRes.data) {
      setReminders(remindersRes.data as Reminder[]);
    }
    if (overdueRes.data) {
      const now = new Date();
      const overdue = (overdueRes.data as Reminder[]).filter(
        (r) => new Date(r.due_at) < now
      );
      setOverdueCount(overdue.length);
    }

    // Routines
    if (routinesRes.data) {
      setRoutines(routinesRes.data as Routine[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLog(habitId: string) {
    const res = await logHabit(habitId);
    if (!res.error) {
      setLoggedToday((prev) => ({ ...prev, [habitId]: true }));
      setStats((prev) => ({
        ...prev,
        habits_completed_today: prev.habits_completed_today + 1,
      }));
    }
  }

  async function handleUnlog(habitId: string) {
    const res = await unlogHabit(habitId);
    if (!res.error) {
      setLoggedToday((prev) => ({ ...prev, [habitId]: false }));
      setStats((prev) => ({
        ...prev,
        habits_completed_today: Math.max(0, prev.habits_completed_today - 1),
      }));
    }
  }

  const handleDateSelect = useCallback(
    async (dateStr: string) => {
      const [noteRes, remindersRes, habitLogsRes] = await Promise.all([
        getDailyNoteByDate(dateStr).catch(() => ({ data: null })),
        getRemindersByDate(dateStr).catch(() => ({ data: [] })),
        getHabitLogsByDate(dateStr).catch(() => ({ data: [] })),
      ]);

      const logEntries = (habitLogsRes.data || []) as { habit_id: string }[];
      const dayHabits = habits.map((h) => ({
        id: h.id,
        title: h.title,
        icon: h.icon,
        logged: logEntries.some((l) => l.habit_id === h.id),
      }));

      return {
        note: noteRes.data
          ? { content: noteRes.data.content || "", mood: noteRes.data.mood || null }
          : null,
        reminders: (remindersRes.data || []) as Reminder[],
        habits: dayHabits,
      };
    },
    [habits]
  );

  const handleMonthChange = useCallback(
    async (year: number, month: number) => {
      const [notesRes, remindersRes, habitsRes] = await Promise.all([
        getNotesForMonth(year, month).catch(() => ({ data: [] })),
        getRemindersForMonth(year, month).catch(() => ({ data: [] })),
        getHabitLogsForMonth(year, month).catch(() => ({ data: [] })),
      ]);

      const noteDates = new Set((notesRes.data || []) as string[]);
      const reminderDates = new Set((remindersRes.data || []) as string[]);
      const habitDates = new Set((habitsRes.data || []) as string[]);

      const allDates = new Set([...noteDates, ...reminderDates, ...habitDates]);

      const markers: Record<string, { hasNote?: boolean; hasReminder?: boolean; hasHabit?: boolean }> = {};
      allDates.forEach((date) => {
        markers[date] = {
          hasNote: noteDates.has(date) || undefined,
          hasReminder: reminderDates.has(date) || undefined,
          hasHabit: habitDates.has(date) || undefined,
        };
      });

      return markers;
    },
    []
  );

  const today = new Date().toLocaleDateString("en-us", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  if (loading) {
    return (
      <div className="relative mt-4 lg:mt-16 w-full flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#2E2E2E]/20 border-t-[#2E2E2E] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#F8F4EE] min-h-dvh flex">
      <div className="bg-[#F8F4EE] w-full max-w-[95%] sm:max-w-10/12 xl:max-w-6xl mx-auto flex flex-col py-6 sm:py-16">
        <div className="mb-5 sm:mb-6">
          <Header />
          <p className="text-gray-700 mb-4 mt-5">{today}</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3 mb-5 sm:mb-6">
          <button
            onClick={() => router.push("/habits")}
            className="border border-[#2E2E2E]/15 rounded-lg px-3 py-2.5 text-center hover:border-[#2E2E2E]/30 transition-colors cursor-pointer"
          >
            <p className="text-lg sm:text-xl font-bold text-[#2E2E2E]">
              {stats.habits_completed_today}/{stats.active_habits}
            </p>
            <p className="text-[10px] sm:text-xs text-[#2E2E2E]/50 font-mono flex items-center justify-center gap-1">
              <Flame size={11} className="text-orange-400" />
              habits
            </p>
          </button>

          <button
            onClick={() => router.push("/reminders")}
            className="border border-[#2E2E2E]/15 rounded-lg px-3 py-2.5 text-center hover:border-[#2E2E2E]/30 transition-colors cursor-pointer"
          >
            <p
              className={`text-lg sm:text-xl font-bold ${
                stats.pending_reminders > 0
                  ? "text-[#2E2E2E]"
                  : "text-[#2E2E2E]/30"
              }`}
            >
              {stats.pending_reminders}
            </p>
            <p className="text-[10px] sm:text-xs text-[#2E2E2E]/50 font-mono flex items-center justify-center gap-1">
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
            />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-5 order-2 lg:order-2">
            <DailyNote />
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-5 order-3">
            <UpcomingReminders
              reminders={reminders}
              overdueCount={overdueCount}
            />
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