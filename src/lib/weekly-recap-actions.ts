"use server";

import type { WeeklyRecapRecord } from "@/types/weekly-recaps";
import { generateWeeklyRecapForCurrentUser } from "@/lib/weekly-recaps";

type WeeklyRecapActionResult =
    | { data: WeeklyRecapRecord; setup_required?: false }
    | { error: string; setup_required?: boolean };

export async function generateWeeklyRecapAction(
    weekEnd?: string
): Promise<WeeklyRecapActionResult> {
    return generateWeeklyRecapForCurrentUser(weekEnd);
}
