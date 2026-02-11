"use server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const TOKEN_BUFFER_MS = 5 * 60 * 1000; // 5 minutes buffer before expiry
const DEFAULT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface CalendarEventInput {
   title: string;
   description?: string | null;
   due_at: string;
   recurrence_rule?: string | null;
   recurrence_end_at?: string | null;
}

// ─── Token Management ────────────────────────────────────────────────────

async function getValidAccessToken(userId: string): Promise<string | null> {
   const { data: tokens, error } = await supabaseAdmin
      .from("google_tokens")
      .select("access_token, refresh_token, token_expires_at")
      .eq("user_id", userId)
      .single();

   if (error || !tokens) {
      console.log("[calendar] No tokens found for user:", userId, error?.message);
      return null;
   }

   const expiresAt = new Date(tokens.token_expires_at).getTime();
   if (Date.now() + TOKEN_BUFFER_MS < expiresAt) {
      console.log("[calendar] Using existing access token for user:", userId);
      return tokens.access_token;
   }

   if (!tokens.refresh_token) {
      console.log("[calendar] Token expired and no refresh_token available for user:", userId);
      return null;
   }

   console.log("[calendar] Token expired, refreshing for user:", userId);
   return refreshAccessToken(userId, tokens.refresh_token);
}

async function refreshAccessToken(
   userId: string,
   refreshToken: string
): Promise<string | null> {
   try {
      const res = await fetch("https://oauth2.googleapis.com/token", {
         method: "POST",
         headers: { "Content-Type": "application/x-www-form-urlencoded" },
         body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
         }),
      });

      if (!res.ok) {
         // Token revoked or invalid — clean up
         if (res.status === 400 || res.status === 401) {
            await supabaseAdmin
               .from("google_tokens")
               .delete()
               .eq("user_id", userId);
         }
         return null;
      }

      const data = await res.json();
      await supabaseAdmin
         .from("google_tokens")
         .update({
            access_token: data.access_token,
            token_expires_at: new Date(
               Date.now() + data.expires_in * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
         })
         .eq("user_id", userId);

      return data.access_token;
   } catch {
      return null;
   }
}

// ─── Recurrence Helpers ──────────────────────────────────────────────────

function buildRecurrence(
   rule: string,
   endAt?: string | null
): string[] | undefined {
   if (!rule) return undefined;

   let rrule = rule.startsWith("RRULE:") ? rule : `RRULE:${rule}`;

   if (endAt && !rrule.includes("UNTIL=")) {
      const until = new Date(endAt)
         .toISOString()
         .replace(/[-:]/g, "")
         .replace(/\.\d{3}/, "");
      rrule += `;UNTIL=${until}`;
   }

   return [rrule];
}

// ─── Calendar CRUD ───────────────────────────────────────────────────────

export async function createCalendarEvent(
   userId: string,
   input: CalendarEventInput
): Promise<string | null> {
   const accessToken = await getValidAccessToken(userId);
   if (!accessToken) return null;

   try {
      const startTime = new Date(input.due_at);
      const endTime = new Date(startTime.getTime() + DEFAULT_DURATION_MS);

      const event: Record<string, unknown> = {
         summary: input.title,
         description: input.description || undefined,
         start: {
            dateTime: startTime.toISOString(),
            timeZone: "UTC",
         },
         end: {
            dateTime: endTime.toISOString(),
            timeZone: "UTC",
         },
         reminders: {
            useDefault: false,
            overrides: [{ method: "popup", minutes: 10 }],
         },
      };

      const recurrence = buildRecurrence(
         input.recurrence_rule || "",
         input.recurrence_end_at
      );
      if (recurrence) {
         event.recurrence = recurrence;
      }

      const res = await fetch(
         `${GOOGLE_CALENDAR_API}/calendars/primary/events`,
         {
            method: "POST",
            headers: {
               Authorization: `Bearer ${accessToken}`,
               "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
         }
      );

      if (!res.ok) {
         const errBody = await res.text();
         console.error("[calendar] Failed to create event:", res.status, errBody);
         return null;
      }

      const data = await res.json();
      console.log("[calendar] Event created:", data.id);
      return data.id as string;
   } catch (e) {
      console.error("[calendar] Exception creating event:", e);
      return null;
   }
}

export async function updateCalendarEvent(
   userId: string,
   eventId: string,
   input: CalendarEventInput
): Promise<boolean> {
   const accessToken = await getValidAccessToken(userId);
   if (!accessToken) return false;

   try {
      const startTime = new Date(input.due_at);
      const endTime = new Date(startTime.getTime() + DEFAULT_DURATION_MS);

      const event: Record<string, unknown> = {
         summary: input.title,
         description: input.description || undefined,
         start: {
            dateTime: startTime.toISOString(),
            timeZone: "UTC",
         },
         end: {
            dateTime: endTime.toISOString(),
            timeZone: "UTC",
         },
         reminders: {
            useDefault: false,
            overrides: [{ method: "popup", minutes: 10 }],
         },
      };

      const recurrence = buildRecurrence(
         input.recurrence_rule || "",
         input.recurrence_end_at
      );
      if (recurrence) {
         event.recurrence = recurrence;
      }

      const res = await fetch(
         `${GOOGLE_CALENDAR_API}/calendars/primary/events/${encodeURIComponent(eventId)}`,
         {
            method: "PUT",
            headers: {
               Authorization: `Bearer ${accessToken}`,
               "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
         }
      );

      return res.ok;
   } catch {
      return false;
   }
}

export async function deleteCalendarEvent(
   userId: string,
   eventId: string
): Promise<boolean> {
   const accessToken = await getValidAccessToken(userId);
   if (!accessToken) return false;

   try {
      const res = await fetch(
         `${GOOGLE_CALENDAR_API}/calendars/primary/events/${encodeURIComponent(eventId)}`,
         {
            method: "DELETE",
            headers: {
               Authorization: `Bearer ${accessToken}`,
            },
         }
      );

      return res.ok || res.status === 404;
   } catch {
      return false;
   }
}

// ─── User-facing helpers ─────────────────────────────────────────────────

export async function hasCalendarConnected(): Promise<boolean> {
   const supabase = await createClient();
   const {
      data: { user },
   } = await supabase.auth.getUser();
   if (!user) return false;

   const { data } = await supabaseAdmin
      .from("google_tokens")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

   return !!data;
}

export async function disconnectCalendar(): Promise<{ success: boolean }> {
   const supabase = await createClient();
   const {
      data: { user },
   } = await supabase.auth.getUser();
   if (!user) return { success: false };

   await supabaseAdmin
      .from("google_tokens")
      .delete()
      .eq("user_id", user.id);

   return { success: true };
}
