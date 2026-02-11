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
         if (provider_token && provider_refresh_token && user) {
            try {
               await supabaseAdmin.from("google_tokens").upsert(
                  {
                     user_id: user.id,
                     access_token: provider_token,
                     refresh_token: provider_refresh_token,
                     token_expires_at: new Date(
                        Date.now() + 3600 * 1000
                     ).toISOString(),
                     updated_at: new Date().toISOString(),
                  },
                  { onConflict: "user_id" }
               );
            } catch {
               // Best-effort: don't block login if token save fails
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
