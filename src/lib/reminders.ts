"use server";
import { createClient } from "@/utils/supabase/server";

interface ReminderInput {
    title: string;
    description?: string | null;
    category_id?: string | null;
    due_at: string; // ISO string
    recurrence_rule?: string | null;
    recurrence_end_at?: string | null;
}

export async function getReminders(options?: {
    completed?: boolean;
    category_id?: string;
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
        .from("reminders")
        .select("*, categories(id, name, color, icon)")
        .eq("user_id", user.id)
        .order("due_at", { ascending: true });

    if (options?.completed !== undefined) {
        query = query.eq("is_completed", options.completed);
    }

    if (options?.category_id) {
        query = query.eq("category_id", options.category_id);
    }

    if (options?.from) {
        query = query.gte("due_at", options.from);
    }

    if (options?.to) {
        query = query.lte("due_at", options.to);
    }

    const { data, error } = await query;

    if (error) {
        return { error: error.message };
    }

    return { data };
}

export async function getReminderById(reminderId: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const { data, error } = await supabase
        .from("reminders")
        .select("*, categories(id, name, color, icon)")
        .eq("id", reminderId)
        .eq("user_id", user.id)
        .single();

    if (error) {
        return { error: error.message };
    }

    return { data };
}

export async function getUpcomingReminders(limit: number = 10) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const { data, error } = await supabase
        .from("reminders")
        .select("*, categories(id, name, color, icon)")
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .gte("due_at", new Date().toISOString())
        .order("due_at", { ascending: true })
        .limit(limit);

    if (error) {
        return { error: error.message };
    }

    return { data };
}

export async function createReminder(input: ReminderInput) {
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

    if (!input.due_at) {
        return { error: "Due date is required" };
    }

    const { data, error } = await supabase
        .from("reminders")
        .insert({
            user_id: user.id,
            title: input.title.trim(),
            description: input.description || null,
            category_id: input.category_id || null,
            due_at: input.due_at,
            recurrence_rule: input.recurrence_rule || null,
            recurrence_end_at: input.recurrence_end_at || null,
        })
        .select("*, categories(id, name, color, icon)")
        .single();

    if (error) {
        return { error: error.message };
    }

    return { success: true, data };
}

export async function updateReminder(
    reminderId: string,
    input: Partial<ReminderInput>
) {
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
    if (input.due_at !== undefined) updates.due_at = input.due_at;
    if (input.recurrence_rule !== undefined)
        updates.recurrence_rule = input.recurrence_rule;
    if (input.recurrence_end_at !== undefined)
        updates.recurrence_end_at = input.recurrence_end_at;

    if (Object.keys(updates).length === 0) {
        return { error: "Nothing to update" };
    }

    const { data, error } = await supabase
        .from("reminders")
        .update(updates)
        .eq("id", reminderId)
        .eq("user_id", user.id)
        .select("*, categories(id, name, color, icon)")
        .single();

    if (error) {
        return { error: error.message };
    }

    return { success: true, data };
}

export async function toggleReminderComplete(reminderId: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    // Busca o estado atual
    const { data: current, error: fetchError } = await supabase
        .from("reminders")
        .select("is_completed")
        .eq("id", reminderId)
        .eq("user_id", user.id)
        .single();

    if (fetchError || !current) {
        return { error: fetchError?.message || "Reminder not found" };
    }

    const newStatus = !current.is_completed;

    const { data, error } = await supabase
        .from("reminders")
        .update({
            is_completed: newStatus,
            completed_at: newStatus ? new Date().toISOString() : null,
        })
        .eq("id", reminderId)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    return { success: true, data };
}

export async function deleteReminder(reminderId: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", reminderId)
        .eq("user_id", user.id);

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}