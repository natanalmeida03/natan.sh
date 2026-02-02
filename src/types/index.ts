export interface Habit {
    id: string;
    title: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    frequency_type: string;
    frequency_target: number;
    is_active: boolean;
    categories?: { id: string; name: string; color?: string | null; icon?: string | null } | null;
}

export interface Streak {
    habit_id: string;
    current_streak: number;
    best_streak: number;
}

export interface Category {
   id: string;
   name: string;
   color?: string | null;
   icon?: string | null;
}

export interface HabitFormData {
   title: string;
   description: string;
   category_id: string;
   icon: string;
   color: string;
   frequency_type: "daily" | "weekly" | "monthly";
   frequency_target: number;
}

