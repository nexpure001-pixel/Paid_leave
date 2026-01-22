'use server'

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function grantLeave(formData: FormData) {
    const userId = formData.get("userId") as string;
    const daysGranted = parseFloat(formData.get("daysGranted") as string);
    const validFrom = formData.get("validFrom") as string;
    const expiryDate = formData.get("expiryDate") as string;
    const reason = formData.get("reason") as string;

    if (!userId || isNaN(daysGranted) || !validFrom || !expiryDate) {
        return { error: "Invalid form data" };
    }

    const supabase = createAdminClient();

    const { error } = await supabase
        .from('leave_grants')
        .insert({
            user_id: userId,
            days_granted: daysGranted,
            days_used: 0,
            valid_from: validFrom,
            expiry_date: expiryDate,
            reason: reason,
        });

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
}

export async function consumeLeave(formData: FormData) {
    const userId = formData.get("userId") as string;
    const date = formData.get("date") as string;
    const reason = formData.get("reason") as string;
    const consumptionType = formData.get("consumptionType") as string;
    const hours = formData.get("hours") as string;

    if (!userId || !date) {
        return { error: "Invalid form data" };
    }

    // Calculate Amount
    let amount = 1.0;
    if (consumptionType === 'half') {
        amount = 0.5;
    } else if (consumptionType === 'time') {
        const h = parseInt(hours || "1");
        // Assumption: 8 hours = 1 day. 1 hour = 0.125
        amount = h / 8.0;
    }

    const supabase = createAdminClient();

    // 1. Create a request (Pending state)
    const { data: request, error: createError } = await supabase
        .from('leave_requests')
        .insert({
            user_id: userId,
            date_requested: date,
            reason: reason,
            amount_days: amount, // Logic update
            status: 'pending'
        })
        .select()
        .single();

    if (createError) {
        return { error: createError.message };
    }

    // 2. Call the DB function to process FIFO logic
    const { error: rpcError } = await supabase.rpc('approve_leave_request', {
        target_request_id: request.id
    });

    if (rpcError) {
        // Ideally we should rollback the request creation or mark it as failed/rejected
        // For now, let's mark it as rejected so it doesn't stay pending forever
        await supabase.from('leave_requests').update({ status: 'rejected' }).eq('id', request.id);
        return { error: "消化処理に失敗しました (残日数不足の可能性があります): " + rpcError.message };
    }

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
}
