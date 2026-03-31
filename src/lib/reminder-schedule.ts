interface ReminderScheduleLike {
    due_at: string;
    is_completed: boolean;
    recurrence_rule?: string | null;
    recurrence_end_at?: string | null;
}

const ICAL_DAY_TO_JS: Record<string, number> = {
    SU: 0,
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6,
};

export function getNextOccurrence(currentDue: Date, rule: string): Date | null {
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

    const byDayMatch = rule.match(/BYDAY=([A-Z,]+)/);
    if (byDayMatch) {
        const targetDays = byDayMatch[1]
            .split(",")
            .map((day) => ICAL_DAY_TO_JS[day])
            .filter((day) => day !== undefined)
            .sort((a, b) => a - b);

        if (targetDays.length === 0) {
            return null;
        }

        const currentDay = next.getDay();
        const nextDay = targetDays.find((day) => day > currentDay);

        if (nextDay !== undefined) {
            next.setDate(next.getDate() + (nextDay - currentDay));
        } else {
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

export function getNextOccurrenceAfter(
    currentDue: Date,
    rule: string,
    after: Date,
    endAt?: string | null
): Date | null {
    let next = new Date(currentDue);
    const end = endAt ? new Date(endAt) : null;

    for (let i = 0; i < 2000; i++) {
        const candidate = getNextOccurrence(next, rule);

        if (!candidate) {
            return null;
        }

        if (end && candidate > end) {
            return null;
        }

        if (candidate > after) {
            return candidate;
        }

        next = candidate;
    }

    return null;
}

export function getEffectiveReminderDueAt(
    reminder: ReminderScheduleLike,
    referenceDate: Date = new Date()
): string | null {
    const dueDate = new Date(reminder.due_at);

    if (Number.isNaN(dueDate.getTime())) {
        return null;
    }

    if (reminder.is_completed || dueDate >= referenceDate) {
        return dueDate.toISOString();
    }

    if (!reminder.recurrence_rule) {
        return null;
    }

    const nextOccurrence = getNextOccurrenceAfter(
        dueDate,
        reminder.recurrence_rule,
        referenceDate,
        reminder.recurrence_end_at
    );

    return nextOccurrence ? nextOccurrence.toISOString() : null;
}

export function normalizeReminderForDisplay<T extends ReminderScheduleLike>(
    reminder: T,
    referenceDate: Date = new Date()
): T | null {
    const effectiveDueAt = getEffectiveReminderDueAt(reminder, referenceDate);

    if (!effectiveDueAt) {
        return reminder.is_completed ? reminder : null;
    }

    if (effectiveDueAt === reminder.due_at) {
        return reminder;
    }

    return {
        ...reminder,
        due_at: effectiveDueAt,
    };
}

export function getActiveRemindersForDisplay<T extends ReminderScheduleLike>(
    reminders: T[],
    referenceDate: Date = new Date()
): T[] {
    return reminders
        .map((reminder) => normalizeReminderForDisplay(reminder, referenceDate))
        .filter((reminder): reminder is T => reminder !== null)
        .sort(
            (left, right) =>
                new Date(left.due_at).getTime() - new Date(right.due_at).getTime()
        );
}

export function isReminderPassed(
    reminder: ReminderScheduleLike,
    referenceDate: Date = new Date()
): boolean {
    if (reminder.is_completed) {
        return false;
    }

    return getEffectiveReminderDueAt(reminder, referenceDate) === null;
}
