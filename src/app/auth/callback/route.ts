import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
   const { searchParams, origin } = new URL(request.url);
   const code = searchParams.get("code");
   const next = searchParams.get("next") ?? "/home";

   if (code) {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
         return NextResponse.redirect(`${origin}${next}`);
      }
   }

   // Redireciona para página de erro em caso de falha
   return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}