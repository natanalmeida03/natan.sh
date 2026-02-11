"use server";
import { createClient } from "@/utils/supabase/server";
import {
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
} from "@/lib/calendar";
import { supabaseAdmin } from "@/utils/supabase/admin";

interface ReminderInput {
    title: string;
    description?: string | null;
    category_id?: string | null;
    due_at: string; // ISO string
    recurrence_rule?: string | null;
    recurrence_end_at?: string | null;
    notify_email?: boolean;
}

// ─── Helpers de recorrência ──────────────────────────────────────────────

const ICAL_DAY_TO_JS: Record<string, number> = {
    SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
};

function getNextOccurrence(currentDue: Date, rule: string): Date | null {
    const next = new Date(currentDue);

    if (rule.includes("FREQ=DAILY")) {
        next.setDate(next.getDate() + 1);
        return next;
    }

    if (rule.includes("FREQ=MONTHLY")) {
        next.setMonth(next.getMonth() + 1);
        return next;
    }

    if (rule.includes("FREQ=YEARLY")) {
        next.setFullYear(next.getFullYear() + 1);
        return next;
    }

    // FREQ=WEEKLY with optional BYDAY
    const byDayMatch = rule.match(/BYDAY=([A-Z,]+)/);
    if (byDayMatch) {
        const targetDays = byDayMatch[1].split(",").map((d) => ICAL_DAY_TO_JS[d]).filter((d) => d !== undefined).sort((a, b) => a - b);
        if (targetDays.length === 0) return null;

        const currentDay = next.getDay();
        // Find next target day after current
        const nextDay = targetDays.find((d) => d > currentDay);
        if (nextDay !== undefined) {
            next.setDate(next.getDate() + (nextDay - currentDay));
        } else {
            // Wrap to first day of next week
            next.setDate(next.getDate() + (7 - currentDay + targetDays[0]));
        }
        return next;
    }

    if (rule.includes("FREQ=WEEKLY")) {
        next.setDate(next.getDate() + 7);
        return next;
    }

    return null;
}

/** Check if a recurring reminder should appear on a specific date */
function matchesRecurrence(dueAt: Date, rule: string, targetDate: string, endAt?: string | null): boolean {
    const target = new Date(targetDate + "T12:00:00");
    const dueDate = new Date(dueAt.getFullYear(), dueAt.getMonth(), dueAt.getDate());
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());

    // Target must be on or after the original due date
    if (targetDay < dueDate) return false;

    // Check recurrence_end_at
    if (endAt) {
        const end = new Date(endAt);
        if (targetDay > end) return false;
    }

    // Exact match with due_at date
    if (targetDay.getTime() === dueDate.getTime()) return true;

    if (rule.includes("FREQ=DAILY")) {
        return true;
    }

    if (rule.includes("FREQ=MONTHLY")) {
        return target.getDate() === dueAt.getDate();
    }

    if (rule.includes("FREQ=YEARLY")) {
        return target.getDate() === dueAt.getDate() && target.getMonth() === dueAt.getMonth();
    }

    // FREQ=WEEKLY with BYDAY
    const byDayMatch = rule.match(/BYDAY=([A-Z,]+)/);
    if (byDayMatch) {
        const targetDays = byDayMatch[1].split(",").map((d) => ICAL_DAY_TO_JS[d]).filter((d) => d !== undefined);
        return targetDays.includes(target.getDay());
    }

    if (rule.includes("FREQ=WEEKLY")) {
        return target.getDay() === dueAt.getDay();
    }

    return false;
}

/** Get all dates in a month range that a recurring reminder would appear on */
function getRecurrenceDatesInMonth(dueAt: Date, rule: string, year: number, month: number, endAt?: string | null): string[] {
    const dates: string[] = [];
    const lastDay = new Date(year, month, 0).getDate();

    for (let d = 1; d <= lastDay; d++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (matchesRecurrence(dueAt, rule, dateStr, endAt)) {
            dates.push(dateStr);
        }
    }

    return dates;
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
            notify_email: input.notify_email ?? false,
        })
        .select("*, categories(id, name, color, icon)")
        .single();

    if (error) {
        return { error: error.message };
    }

    // Best-effort Google Calendar sync
    try {
        const eventId = await createCalendarEvent(user.id, {
            title: input.title.trim(),
            description: input.description,
            due_at: input.due_at,
            recurrence_rule: input.recurrence_rule,
            recurrence_end_at: input.recurrence_end_at,
        });
        if (eventId && data) {
            await supabaseAdmin
                .from("reminders")
                .update({ google_calendar_event_id: eventId })
                .eq("id", data.id);
            data.google_calendar_event_id = eventId;
        }
    } catch {
        // Silent fail — Calendar sync is best-effort
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
    if (input.notify_email !== undefined)
        updates.notify_email = input.notify_email;

    // Reset notified_at when due_at or notify_email changes so the user gets notified again
    if (input.due_at !== undefined || input.notify_email !== undefined) {
        updates.notified_at = null;
    }

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

    // Best-effort Google Calendar sync
    if (data) {
        try {
            const calendarInput = {
                title: data.title,
                description: data.description,
                due_at: data.due_at,
                recurrence_rule: data.recurrence_rule,
                recurrence_end_at: data.recurrence_end_at,
            };
            if (data.google_calendar_event_id) {
                await updateCalendarEvent(
                    user.id,
                    data.google_calendar_event_id,
                    calendarInput
                );
            } else {
                const eventId = await createCalendarEvent(
                    user.id,
                    calendarInput
                );
                if (eventId) {
                    await supabaseAdmin
                        .from("reminders")
                        .update({ google_calendar_event_id: eventId })
                        .eq("id", data.id);
                    data.google_calendar_event_id = eventId;
                }
            }
        } catch {
            // Silent fail — Calendar sync is best-effort
        }
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

    // Busca o estado atual incluindo recurrence_rule
    const { data: current, error: fetchError } = await supabase
        .from("reminders")
        .select("is_completed, recurrence_rule, recurrence_end_at, due_at")
        .eq("id", reminderId)
        .eq("user_id", user.id)
        .single();

    if (fetchError || !current) {
        return { error: fetchError?.message || "Reminder not found" };
    }

    const newStatus = !current.is_completed;

    // Se está marcando como completo E tem recorrência, avança para próxima data
    if (newStatus && current.recurrence_rule) {
        const currentDue = new Date(current.due_at);
        const nextDue = getNextOccurrence(currentDue, current.recurrence_rule);

        // Verifica se próxima ocorrência está dentro do limite
        const pastEnd = nextDue && current.recurrence_end_at
            ? nextDue > new Date(current.recurrence_end_at)
            : false;

        if (nextDue && !pastEnd) {
            // Avança due_at para próxima ocorrência, mantém pendente
            const { data, error } = await supabase
                .from("reminders")
                .update({
                    due_at: nextDue.toISOString(),
                    is_completed: false,
                    completed_at: null,
                    notified_at: null,
                })
                .eq("id", reminderId)
                .eq("user_id", user.id)
                .select()
                .single();

            if (error) {
                return { error: error.message };
            }

            return { success: true, data, advanced: true };
        }

        // Passou do limite de recorrência, marca como completo normalmente
    }

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

    // Fetch the event ID before deleting
    const { data: reminder } = await supabase
        .from("reminders")
        .select("google_calendar_event_id")
        .eq("id", reminderId)
        .eq("user_id", user.id)
        .single();

    const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", reminderId)
        .eq("user_id", user.id);

    if (error) {
        return { error: error.message };
    }

    // Best-effort Google Calendar sync
    if (reminder?.google_calendar_event_id) {
        try {
            await deleteCalendarEvent(user.id, reminder.google_calendar_event_id);
        } catch {
            // Silent fail — Calendar sync is best-effort
        }
    }

    return { success: true };
}

// ─── Novas funções para o calendário interativo ─────────────────────────

// Busca todos os lembretes de uma data específica (inclui recorrências expandidas)
export async function getRemindersByDate(date: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    // Busca lembretes com due_at nesse dia (ocorrência direta)
    const from = `${date}T00:00:00.000Z`;
    const to = `${date}T23:59:59.999Z`;

    const { data: directReminders, error: directError } = await supabase
        .from("reminders")
        .select("*, categories(id, name, color, icon)")
        .eq("user_id", user.id)
        .gte("due_at", from)
        .lte("due_at", to)
        .order("due_at", { ascending: true });

    if (directError) {
        return { error: directError.message };
    }

    // Busca todos os lembretes recorrentes do usuário (due_at <= date, não completados)
    const { data: recurringReminders, error: recurringError } = await supabase
        .from("reminders")
        .select("*, categories(id, name, color, icon)")
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .not("recurrence_rule", "is", null)
        .lte("due_at", to);

    if (recurringError) {
        return { error: recurringError.message };
    }

    const directIds = new Set((directReminders || []).map((r) => r.id));

    // Filtra recorrentes que batem com a data mas não estão já nos diretos
    const expandedRecurring = (recurringReminders || []).filter((r) => {
        if (directIds.has(r.id)) return false;
        return matchesRecurrence(
            new Date(r.due_at),
            r.recurrence_rule,
            date,
            r.recurrence_end_at
        );
    });

    return { data: [...(directReminders || []), ...expandedRecurring] };
}

// Busca todas as datas do mês que possuem pelo menos um lembrete (inclui recorrências)
export async function getRemindersForMonth(year: number, month: number) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const from = `${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}T23:59:59.999Z`;

    // Lembretes diretos no mês
    const { data: directData, error: directError } = await supabase
        .from("reminders")
        .select("due_at")
        .eq("user_id", user.id)
        .gte("due_at", from)
        .lte("due_at", to);

    if (directError) {
        return { error: directError.message };
    }

    const uniqueDates = new Set(
        (directData || []).map((r) => (r.due_at as string).split("T")[0])
    );

    // Lembretes recorrentes que começaram antes ou durante o mês
    const { data: recurringData, error: recurringError } = await supabase
        .from("reminders")
        .select("due_at, recurrence_rule, recurrence_end_at")
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .not("recurrence_rule", "is", null)
        .lte("due_at", to);

    if (recurringError) {
        return { error: recurringError.message };
    }

    // Expande recorrências para cada dia do mês
    (recurringData || []).forEach((r) => {
        const expanded = getRecurrenceDatesInMonth(
            new Date(r.due_at),
            r.recurrence_rule,
            year,
            month,
            r.recurrence_end_at
        );
        expanded.forEach((d) => uniqueDates.add(d));
    });

    return { data: [...uniqueDates] };
}