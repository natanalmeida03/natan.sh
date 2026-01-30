"use server"
import { createClient } from "@/utils/supabase/server";

export async function getProfile() {
   const supabase = await createClient();

   const { data: { user }, error: authError } = await supabase.auth.getUser();

   if (authError || !user) {
      return { error: "User not authenticated" };
   }

   const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

   if (error) {
      return { error: error.message };
   }

   return { data };
}

export async function updateProfile(formData: FormData) {
   const supabase = await createClient();

   const { data: { user }, error: authError } = await supabase.auth.getUser();

   if (authError || !user) {
      return { error: "User not authenticated" };
   }

   const updates: Record<string, string> = {};

   const username = formData.get("username");

   if (username) updates.username = username as string;

   if (Object.keys(updates).length === 0) {
      return { error: "Nothing to update" };
   }

   const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

   if (error) {
      return { error: error.message };
   }

   return { success: true, data };
}

export async function updatePassword(formData: FormData) {
   const supabase = await createClient();

   const password = formData.get("password") as string;
   const confirmPassword = formData.get("confirm_password") as string;

   if (!password || !confirmPassword) {
      return { error: "Password and confirmation are required" };
   }

   if (password !== confirmPassword) {
      return { error: "The passwords must be the same" };
   }

   if (password.length < 6) {
      return { error: "Password must be at least 6 characters" };
   }

   const { error } = await supabase.auth.updateUser({ password });

   if (error) {
      return { error: error.message };
   }

   return { success: true };
}

export async function deleteAccount() {
   const supabase = await createClient();

   const { data: { user }, error: authError } = await supabase.auth.getUser();

   if (authError || !user) {
      return { error: "User not authenticated" };
   }

   const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

   if (profileError) {
      return { error: profileError.message };
   }

   const { error: deleteError } = await supabase.rpc("delete_user");

   if (deleteError) {
      return { error: deleteError.message };
   }

   await supabase.auth.signOut();

   return { success: true };
}