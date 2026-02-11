import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
   const { searchParams, origin } = new URL(request.url);
   const code = searchParams.get("code");
   const next = searchParams.get("next") ?? "/home";

   if (code) {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.session) {
         // Save Google OAuth tokens for Calendar integration
         const { provider_token, provider_refresh_token, user } = data.session;
         console.log("[auth/callback] provider_token:", !!provider_token, "provider_refresh_token:", !!provider_refresh_token);
         if (provider_token && user) {
            try {
               const upsertData: Record<string, unknown> = {
                  user_id: user.id,
                  access_token: provider_token,
                  token_expires_at: new Date(
                     Date.now() + 3600 * 1000
                  ).toISOString(),
                  updated_at: new Date().toISOString(),
               };
               // Only update refresh_token if Google returned one
               if (provider_refresh_token) {
                  upsertData.refresh_token = provider_refresh_token;
               }

               const { error: upsertError } = await supabaseAdmin
                  .from("google_tokens")
                  .upsert(upsertData, { onConflict: "user_id" });

               if (upsertError) {
                  console.error("[auth/callback] Failed to save tokens:", upsertError.message);
               } else {
                  console.log("[auth/callback] Tokens saved for user:", user.id);
               }
            } catch (e) {
               console.error("[auth/callback] Exception saving tokens:", e);
            }
         }

         const forwardedHost = request.headers.get("x-forwarded-host");
         const isLocalEnv = process.env.NODE_ENV === "development";

         if (isLocalEnv) {
            return NextResponse.redirect(`${origin}${next}`);
         } else if (forwardedHost) {
            return NextResponse.redirect(`https://${forwardedHost}${next}`);
         } else {
            return NextResponse.redirect(`${origin}${next}`);
         }
      }
   }

   return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
