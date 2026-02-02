"use server";
import { createClient } from "@/utils/supabase/server";

// Streaks de todos os hábitos ativos
export async function getHabitStreaks() {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const { data, error } = await supabase
        .from("v_habit_streaks")
        .select("*")
        .eq("user_id", user.id);

    if (error) {
        return { error: error.message };
    }

    return { data };
}

// Estatísticas semanais de hábitos
export async function getHabitWeeklyStats(options?: {
    habit_id?: string;
    from?: string;
    to?: string;
}) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    let query = supabase
        .from("v_habit_weekly_stats")
        .select("*")
        .eq("user_id", user.id)
        .order("week_start", { ascending: false });

    if (options?.habit_id) {
        query = query.eq("habit_id", options.habit_id);
    }

    if (options?.from) {
        query = query.gte("week_start", options.from);
    }

    if (options?.to) {
        query = query.lte("week_start", options.to);
    }

    const { data, error } = await query;

    if (error) {
        return { error: error.message };
    }

    return { data };
}

export async function getRoutineCompletion(options?: {
    routine_id?: string;
    from?: string;
    to?: string;
}) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    let query = supabase
        .from("v_routine_completion")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_date", { ascending: false });

    if (options?.routine_id) {
        query = query.eq("routine_id", options.routine_id);
    }

    if (options?.from) {
        query = query.gte("logged_date", options.from);
    }

    if (options?.to) {
        query = query.lte("logged_date", options.to);
    }

    const { data, error } = await query;

    if (error) {
        return { error: error.message };
    }

    return { data };
}

export async function getDashboardStats() {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const today = new Date().toISOString().split("T")[0];
    const dayOfWeek = new Date().getDay();

    // Executa tudo em paralelo
    const [
        remindersResult,
        habitsResult,
        todayLogsResult,
        streaksResult,
        routinesResult,
        goalsResult,
    ] = await Promise.all([
        // Lembretes pendentes para hoje
        supabase
            .from("reminders")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_completed", false)
            .lte("due_at", new Date().toISOString()),

        // Total de hábitos ativos
        supabase
            .from("habits")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_active", true),

        // Hábitos completados hoje
        supabase
            .from("habit_logs")
            .select("id, habits!inner(user_id)")
            .eq("habits.user_id", user.id)
            .eq("logged_date", today),

        // Streaks
        supabase
            .from("v_habit_streaks")
            .select("*")
            .eq("user_id", user.id),

        // Rotinas de hoje
        supabase
            .from("routines")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_active", true)
            .contains("days_of_week", [dayOfWeek]),

        // Metas ativas
        supabase
            .from("v_goal_progress")
            .select("*")
            .eq("user_id", user.id),
    ]);

    return {
        data: {
            pending_reminders: remindersResult.count || 0,
            active_habits: habitsResult.count || 0,
            habits_completed_today: todayLogsResult.data?.length || 0,
            streaks: streaksResult.data || [],
            today_routines: routinesResult.count || 0,
            goals: goalsResult.data || [],
        },
    };
}