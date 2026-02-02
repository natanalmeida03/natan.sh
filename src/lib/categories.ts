"use server";
import { createClient } from "@/utils/supabase/server";

export async function getCategories() {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

    if (error) {
        return { error: error.message };
    }

    return { data };
}

export async function getCategoryById(categoryId: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", categoryId)
        .eq("user_id", user.id)
        .single();

    if (error) {
        return { error: error.message };
    }

    return { data };
}

export async function createCategory(formData: FormData) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const name = formData.get("name") as string;

    if (!name || name.trim().length === 0) {
        return { error: "Category name is required" };
    }

    const { data, error } = await supabase
        .from("categories")
        .insert({
            user_id: user.id,
            name: name.trim(),
            color: (formData.get("color") as string) || null,
            icon: (formData.get("icon") as string) || null,
        })
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    return { success: true, data };
}

export async function updateCategory(categoryId: string, formData: FormData) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const updates: Record<string, string | null> = {};

    const name = formData.get("name") as string;
    const color = formData.get("color") as string;
    const icon = formData.get("icon") as string;

    if (name) updates.name = name.trim();
    if (color !== null && color !== undefined) updates.color = color || null;
    if (icon !== null && icon !== undefined) updates.icon = icon || null;

    if (Object.keys(updates).length === 0) {
        return { error: "Nothing to update" };
    }

    const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", categoryId)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    return { success: true, data };
}

export async function deleteCategory(categoryId: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId)
        .eq("user_id", user.id);

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}