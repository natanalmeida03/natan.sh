"use server"
import { createClient } from "@/utils/supabase/server"; 
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function login(formData: FormData) {
   const supabase = await createClient();

   const { error } = await supabase.auth.signInWithPassword({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
   });

   if (error) {
      return { error: error.message };
   }

   return { success: true }
}

export async function loginWithGoogle() {
   const supabase = await createClient();
   const headersList = await headers();
   const origin = headersList.get("origin") || headersList.get("host");
   
   const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
         redirectTo: `${origin}/auth/callback`,
         queryParams: {
            access_type: "offline",
            prompt: "consent",
         },
      },
   });

   if (error) {
      return { error: error.message };
   }

   if (data.url) {
      redirect(data.url);
   }

   return { error: "Failed to get redirect URL" };
}

export async function signup(formData: FormData) {
   const supabase = await createClient();

   const email = formData.get("email") as string;
   const password = formData.get("password") as string;
   const username = formData.get("username") as string;

   const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
         data: { username },
      },
   });

   if (error) {
      return { error: error.message };
   }

   return { success: true }
}

export async function logout() {
   const supabase = await createClient();
   await supabase.auth.signOut();
   return { success: true }
}