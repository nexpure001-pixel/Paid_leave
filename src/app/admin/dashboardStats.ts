import { createAdminClient } from "@/utils/supabase/admin";
import { addMonths, addDays, format, isAfter, isBefore, parseISO } from "date-fns";
import { calculateGrantDays } from "@/utils/leaveCalculator";

export async function getDashboardStats() {
    const supabase = createAdminClient();
    const today = new Date();
    const nextMonth = addDays(today, 30); // Check next 30 days

    // 1. Fetch Users for Grant Check
    const { data: users } = await supabase.from('users').select('id, full_name, joined_at');

    // 2. Fetch Active Grants for Expiry Check
    const { data: grants } = await supabase
        .from('leave_grants')
        .select('*, users(full_name)')
        .gt('days_granted', 0) // Filter out empty if any
        .gte('expiry_date', format(today, 'yyyy-MM-dd')); // Only future expirations

    // --- Logic: Upcoming Grants ---
    const upcomingGrants = [];
    if (users) {
        for (const user of users) {
            // Simple interaction: verify if next month contains a grant date
            // We can use a loop similar to calculator but check range
            // For simplicity/performance demo, let's check exact dates for next 30 days
            // or just check if "next month" anniversary hits?

            // Easier: "Is the anniversary (month/day) within the next 30 days?"
            // Note: calculating exact "1.5 year" date is better.

            // Let's reuse a logic: check everyday for next 30 days? a bit heavy?
            // Or better: calculate next anniversary from today.

            if (!user.joined_at) continue;
            const joined = new Date(user.joined_at);

            // Next anniversary calculation could be complex with the 6 month shift.
            // Let's iterate future grant dates from calculator logic?
            // Since we have a finite list in calculator, we can find the "Next Grant Date"

            // Custom logic here for speed:
            // Find next grant date > today
            // If that date <= nextMonth, add to list.
            let foundParams = null;
            // Check 0.5, 1.5 ... 6.5
            const milestones = [6, 18, 30, 42, 54, 66];
            for (const m of milestones) {
                const date = addMonths(joined, m);
                if (isAfter(date, today) && isBefore(date, nextMonth)) {
                    foundParams = { date, days: calculateGrantDays(joined, date) };
                    break;
                }
            }
            // Check 7.5+
            if (!foundParams) {
                // Loop yearly after 6.5y (78 months)
                let m = 78;
                while (m < 12 * 50) {
                    const date = addMonths(joined, m);
                    if (isAfter(date, today) && isBefore(date, nextMonth)) {
                        foundParams = { date, days: 20 };
                        break;
                    }
                    if (isAfter(date, nextMonth)) break; // Optimization
                    m += 12;
                }
            }

            if (foundParams) {
                upcomingGrants.push({
                    name: user.full_name,
                    date: format(foundParams.date, 'yyyy-MM-dd'),
                    days: foundParams.days
                });
            }
        }
    }

    // --- Logic: Upcoming Expirations ---
    const expiringGrants = grants?.filter(g => {
        const expiry = parseISO(g.expiry_date);
        const remaining = g.days_granted - g.days_used;
        return isAfter(expiry, today) && isBefore(expiry, nextMonth) && remaining > 0;
    }).map(g => ({
        name: g.users.full_name, // @ts-ignore relationship
        date: g.expiry_date,
        remaining: g.days_granted - g.days_used
    })) || [];

    return {
        upcomingGrants,
        expiringGrants
    };
}
