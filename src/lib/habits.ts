"use server";
import { createClient } from "@/utils/supabase/server";

interface HabitInput {
    title: string;
    description?: string | null;
    category_id?: string | null;
    icon?: string | null;
    color?: string | null;
    frequency_type: "daily" | "weekly" | "monthly";
    frequency_target?: number;
}

export async function getHabits(options?: {
    active_only?: boolean;
    category_id?: string;
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
        .from("habits")
        .select("*, categories(id, name, color, icon)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (options?.active_only !== false) {
        query = query.eq("is_active", true);
    }

    if (options?.category_id) {
        query = query.eq("category_id", options.category_id);
    }

    const { data, error } = await query;

    if (error) {
        return { error: error.message };
    }

    return { data };
}

export async function getHabitById(habitId: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const { data, error } = await supabase
        .from("habits")
        .select("*, categories(id, name, color, icon)")
        .eq("id", habitId)
        .eq("user_id", user.id)
        .single();

    if (error) {
        return { error: error.message };
    }

    return { data };
}

export async function createHabit(input: HabitInput) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    if (!input.title || input.title.trim().length === 0) {
        return { error: "Title is required" };
    }

    const validTypes = ["daily", "weekly", "monthly"];
    if (!validTypes.includes(input.frequency_type)) {
        return { error: "Invalid frequency type" };
    }

    const { data, error } = await supabase
        .from("habits")
        .insert({
            user_id: user.id,
            title: input.title.trim(),
            description: input.description || null,
            category_id: input.category_id || null,
            icon: input.icon || null,
            color: input.color || null,
            frequency_type: input.frequency_type,
            frequency_target: input.frequency_target || 1,
        })
        .select("*, categories(id, name, color, icon)")
        .single();

    if (error) {
        return { error: error.message };
    }

    return { success: true, data };
}

export async function updateHabit(habitId: string, input: Partial<HabitInput>) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const updates: Record<string, unknown> = {};

    if (input.title !== undefined) updates.title = input.title.trim();
    if (input.description !== undefined) updates.description = input.description;
    if (input.category_id !== undefined) updates.category_id = input.category_id;
    if (input.icon !== undefined) updates.icon = input.icon;
    if (input.color !== undefined) updates.color = input.color;
    if (input.frequency_type !== undefined)
        updates.frequency_type = input.frequency_type;
    if (input.frequency_target !== undefined)
        updates.frequency_target = input.frequency_target;

    if (Object.keys(updates).length === 0) {
        return { error: "Nothing to update" };
    }

    const { data, error } = await supabase
        .from("habits")
        .update(updates)
        .eq("id", habitId)
        .eq("user_id", user.id)
        .select("*, categories(id, name, color, icon)")
        .single();

    if (error) {
        return { error: error.message };
    }

    return { success: true, data };
}

export async function toggleHabitActive(habitId: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const { data: current, error: fetchError } = await supabase
        .from("habits")
        .select("is_active")
        .eq("id", habitId)
        .eq("user_id", user.id)
        .single();

    if (fetchError || !current) {
        return { error: fetchError?.message || "Habit not found" };
    }

    const { data, error } = await supabase
        .from("habits")
        .update({ is_active: !current.is_active })
        .eq("id", habitId)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    return { success: true, data };
}

export async function deleteHabit(habitId: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const { error } = await supabase
        .from("habits")
        .delete()
        .eq("id", habitId)
        .eq("user_id", user.id);

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function logHabit(habitId: string, notes?: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    // Verifica se o hábito pertence ao usuário
    const { data: habit, error: habitError } = await supabase
        .from("habits")
        .select("id")
        .eq("id", habitId)
        .eq("user_id", user.id)
        .single();

    if (habitError || !habit) {
        return { error: "Habit not found" };
    }

    const { data, error } = await supabase
        .from("habit_logs")
        .insert({
            habit_id: habitId,
            logged_at: new Date().toISOString(),
            notes: notes || null,
        })
        .select()
        .single();

    if (error) {
        // Unique constraint: já logado hoje
        if (error.code === "23505") {
            return { error: "Habit already logged today" };
        }
        return { error: error.message };
    }

    return { success: true, data };
}

export async function unlogHabit(habitId: string, date?: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    // Verifica se o hábito pertence ao usuário
    const { data: habit, error: habitError } = await supabase
        .from("habits")
        .select("id")
        .eq("id", habitId)
        .eq("user_id", user.id)
        .single();

    if (habitError || !habit) {
        return { error: "Habit not found" };
    }

    const targetDate = date || new Date().toISOString().split("T")[0];

    const { error } = await supabase
        .from("habit_logs")
        .delete()
        .eq("habit_id", habitId)
        .eq("logged_date", targetDate);

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function getHabitLogs(
    habitId: string,
    options?: { from?: string; to?: string; limit?: number }
) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    let query = supabase
        .from("habit_logs")
        .select("*")
        .eq("habit_id", habitId)
        .order("logged_at", { ascending: false });

    if (options?.from) {
        query = query.gte("logged_date", options.from);
    }

    if (options?.to) {
        query = query.lte("logged_date", options.to);
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
        return { error: error.message };
    }

    return { data };
}

// Verifica se o hábito foi completado hoje
export async function isHabitLoggedToday(habitId: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
        .from("habit_logs")
        .select("id")
        .eq("habit_id", habitId)
        .eq("logged_date", today)
        .maybeSingle();

    if (error) {
        return { error: error.message };
    }

    return { logged: !!data };
}

// ─── Novas funções para o calendário interativo ─────────────────────────

// Busca todos os logs de hábitos do usuário para uma data específica
export async function getHabitLogsByDate(date: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    // Busca os IDs dos hábitos do usuário para filtrar os logs
    const { data: userHabits, error: habitsError } = await supabase
        .from("habits")
        .select("id")
        .eq("user_id", user.id);

    if (habitsError) {
        return { error: habitsError.message };
    }

    if (!userHabits || userHabits.length === 0) {
        return { data: [] };
    }

    const habitIds = userHabits.map((h) => h.id);

    const { data, error } = await supabase
        .from("habit_logs")
        .select("*, habits(id, title, icon, color)")
        .in("habit_id", habitIds)
        .eq("logged_date", date)
        .order("logged_at", { ascending: true });

    if (error) {
        return { error: error.message };
    }

    return { data: data || [] };
}

// Busca todas as datas do mês que possuem pelo menos um log de hábito
export async function getHabitLogsForMonth(year: number, month: number) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    // Busca os IDs dos hábitos do usuário
    const { data: userHabits, error: habitsError } = await supabase
        .from("habits")
        .select("id")
        .eq("user_id", user.id);

    if (habitsError) {
        return { error: habitsError.message };
    }

    if (!userHabits || userHabits.length === 0) {
        return { data: [] };
    }

    const habitIds = userHabits.map((h) => h.id);

    const { data, error } = await supabase
        .from("habit_logs")
        .select("logged_date")
        .in("habit_id", habitIds)
        .gte("logged_date", from)
        .lte("logged_date", to);

    if (error) {
        return { error: error.message };
    }

    // Retorna datas únicas
    const uniqueDates = [...new Set((data || []).map((l) => l.logged_date as string))];
    return { data: uniqueDates };
}