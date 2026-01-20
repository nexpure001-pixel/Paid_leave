'use server'

import { createAdminClient } from "@/utils/supabase/admin";
import { getValidPastGrants } from "@/utils/leaveCalculator";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";

export async function runAutoGrantCheck() {
    const supabase = createAdminClient();
    const today = new Date();

    // 1. Fetch all users
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, joined_at, full_name');

    if (usersError || !users) {
        return { error: "ユーザーの取得に失敗しました" };
    }

    let grantedCount = 0;
    const results = [];

    // 2. Iterate and check
    for (const user of users) {
        if (!user.joined_at) continue;

        const joinedAt = new Date(user.joined_at);
        // 過去の有効な付与分をすべて計算
        const potentialGrants = getValidPastGrants(joinedAt, today);

        for (const grant of potentialGrants) {
            const validFromStr = format(grant.grantDate, 'yyyy-MM-dd');

            // Check if already granted (deduplication)
            // 同一ユーザー、同一付与日、自動付与の理由 のデータがあるか確認
            const { data: existing } = await supabase
                .from('leave_grants')
                .select('id')
                .eq('user_id', user.id)
                .eq('valid_from', validFromStr)
                .ilike('reason', '%自動付与%')
                .single();

            if (!existing) {
                // Insert Grant
                const expiryStr = format(grant.expiryDate, 'yyyy-MM-dd');

                const { error: insertError } = await supabase
                    .from('leave_grants')
                    .insert({
                        user_id: user.id,
                        days_granted: grant.days,
                        days_used: 0,
                        valid_from: validFromStr,
                        expiry_date: expiryStr,
                        reason: `自動付与 (勤続${grant.yearsOfService}年)`,
                    });

                if (!insertError) {
                    grantedCount++;
                    results.push(`${user.full_name}: ${validFromStr}付与分 ${grant.days}日`);
                }
            }
        }
    }

    revalidatePath('/admin/users');
    return {
        success: true,
        message: `${users.length}人をチェックしました。\n今回追加付与: ${grantedCount}件\n${results.join('\n')}`
    };
}
