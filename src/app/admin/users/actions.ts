'use server'

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createUser(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const fullName = formData.get("fullName") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string || 'employee';
    const joinedAt = formData.get("joinedAt") as string || new Date().toISOString();

    const supabase = createAdminClient();

    // 1. Create Auth User
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for simplicity in this system
        user_metadata: { full_name: fullName },
    });

    if (authError) {
        return { error: authError.message };
    }

    if (!authUser.user) {
        return { error: "Failed to create user" };
    }

    // 2. Create Public Profile
    // Note: If you add a trigger in SQL later, this might fail with unique constraint.
    // For now, we manually insert since we didn't add a trigger yet.
    const { error: profileError } = await supabase
        .from('users')
        .insert({
            id: authUser.user.id,
            email: email,
            full_name: fullName,
            role: role,
            joined_at: joinedAt,
        });

    if (profileError) {
        // Cleanup auth user if profile creation fails? 
        // Ideally use transaction but across Auth/Public is hard.
        // For now, return error.
        return { error: "Created auth user but failed to create profile: " + profileError.message };
    }

    revalidatePath("/admin/users");
    redirect("/admin/users");
}

export async function deleteUser(userId: string) {
    const supabase = createAdminClient();

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/admin/users");
}
