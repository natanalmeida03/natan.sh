import { NextResponse } from "next/server";
import { generateWeeklyRecapsForAllUsers } from "@/lib/weekly-recaps";

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekEnd = searchParams.get("weekEnd") || undefined;
    const result = await generateWeeklyRecapsForAllUsers(weekEnd);

    if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
}
