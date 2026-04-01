import { NextResponse } from "next/server";
import {
    getWeeklyRecapByIdForUser,
    renderWeeklyRecapStorySvg,
} from "@/lib/weekly-recaps";
import { createClient } from "@/utils/supabase/server";

export async function GET(
    request: Request,
    context: { params: Promise<{ summaryId: string }> }
) {
    const { summaryId } = await context.params;
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getWeeklyRecapByIdForUser(summaryId, user.id);

    if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return new NextResponse(
        renderWeeklyRecapStorySvg(result.data, {
            background: searchParams.get("background") || undefined,
            surface: searchParams.get("surface") || undefined,
            border: searchParams.get("border") || undefined,
            foreground: searchParams.get("foreground") || undefined,
            muted: searchParams.get("muted") || undefined,
            accent: searchParams.get("accent") || undefined,
        }),
        {
        headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "private, no-store, max-age=0",
        },
        }
    );
}
