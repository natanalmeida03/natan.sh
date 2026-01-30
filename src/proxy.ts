import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export async function proxy(request: NextRequest) {
   let supabaseResponse = NextResponse.next({
      request,
   });

   const supabase = createServerClient(
      supabaseUrl!,
      supabaseKey!,
      {
         cookies: {
            getAll() {
               return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
               cookiesToSet.forEach(({ name, value }) => 
                  request.cookies.set(name, value)
               );
               supabaseResponse = NextResponse.next({
                  request,
               });
               cookiesToSet.forEach(({ name, value, options }) =>
                  supabaseResponse.cookies.set(name, value, options)
               );
            },
         },
      }
   );

   // Refresh da sessão
   const { data: { user } } = await supabase.auth.getUser();

   // Rotas protegidas
   const protectedRoutes = ["/home", "/profile"];
   const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
   );

   // Redireciona para login se não estiver autenticado
   if (isProtectedRoute && !user) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
   }

   // Redireciona para home se já estiver logado e tentar acessar login/register
   const authRoutes = ["/login", "/register"];
   const isAuthRoute = authRoutes.includes(request.nextUrl.pathname);

   if (isAuthRoute && user) {
      const homeUrl = new URL("/home", request.url);
      return NextResponse.redirect(homeUrl);
   }

   return supabaseResponse;
}

export const config = {
   matcher: [
      // Rotas que o middleware deve processar
      "/home/:path*",
      "/profile",
      "/login",
      "/register",
   ],
};