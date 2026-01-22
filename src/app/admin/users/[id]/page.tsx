import { createAdminClient } from "@/utils/supabase/admin";
import { Card } from "@/components/ui/Card";
import { GrantLeaveForm } from "./GrantLeaveForm";
import { ConsumeLeaveForm } from "./ConsumeLeaveForm";
import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";

export default async function UserDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const userId = params.id;
    const supabase = createAdminClient();

    // Use Admin Client to bypass RLS for viewing other users' data
    // const supabase = createAdminClient();
    // const userId = params.id;

    // 1. Fetch User Profile
    const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

    if (!user) {
        return <div className="p-8">User not found</div>;
    }

    // 2. Fetch Active Grants
    const { data: grants } = await supabase
        .from("leave_grants")
        .select("*")
        .eq("user_id", userId)
        .order("expiry_date", { ascending: true });

    // 3. Fetch Requests (History)
    const { data: requests } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("user_id", userId)
        .order("date_requested", { ascending: false });

    // 4. Calculate Total Remaining
    const totalRemaining = grants?.reduce((sum, g) => {
        // Only count if not expired
        const isExpired = new Date(g.expiry_date) < new Date();
        if (isExpired) return sum;
        return sum + (g.days_granted - g.days_used);
    }, 0) || 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/admin/users" className="text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">{user.full_name} さんの詳細</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Stats & Actions */}
                <div className="md:col-span-2 space-y-6">
                    <Card title="有給残数サマリー">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">現在利用可能な有給</p>
                                <p className="text-4xl font-bold text-gray-900">
                                    {Number(totalRemaining).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                                    <span className="text-lg font-normal ml-1">日</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">入社日</p>
                                <p className="font-medium">{user.joined_at}</p>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 gap-6">
                        <ConsumeLeaveForm userId={userId} />
                        <GrantLeaveForm userId={userId} />
                    </div>

                    <Card title="付与履歴 (有効期限順)">
                        <div className="overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">付与日/理由</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">有効期限</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">付与</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">消化</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">残</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {grants?.map((grant) => {
                                        const remaining = grant.days_granted - grant.days_used;
                                        const isExpired = new Date(grant.expiry_date) < new Date();
                                        return (
                                            <tr key={grant.id} className={isExpired ? "bg-gray-50 opacity-60" : ""}>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    <div>{grant.valid_from}</div>
                                                    <div className="text-xs text-gray-500">{grant.reason}</div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-red-600 font-medium">
                                                    {grant.expiry_date}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {Number(grant.days_granted).toLocaleString(undefined, { maximumFractionDigits: 3 })}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {Number(grant.days_used).toLocaleString(undefined, { maximumFractionDigits: 3 })}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-bold text-blue-600">
                                                    {Number(remaining).toLocaleString(undefined, { maximumFractionDigits: 3 })}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {isExpired ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                            期限切れ
                                                        </span>
                                                    ) : remaining === 0 ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                            消化完了
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            有効
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {(!grants || grants.length === 0) && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                                                付与データはありません
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Right Column: History */}
                <div className="space-y-6">
                    <Card title="消化履歴 (申請・実績)">
                        {(!requests || requests.length === 0) ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
                                <History className="h-12 w-12 mb-2 opacity-20" />
                                <p>まだ消化履歴はありません</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">日付</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">理由</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">状態</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {requests.map(req => (
                                            <tr key={req.id}>
                                                <td className="px-3 py-2 text-sm">{req.date_requested}</td>
                                                <td className="px-3 py-2 text-sm text-gray-500 text-ellipsis overflow-hidden max-w-[100px]" title={req.reason}>{req.reason}</td>
                                                <td className="px-3 py-2 text-sm text-right">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs ${req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {req.status === 'approved' ? '消化済' : req.status === 'rejected' ? '却下' : '処理中'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
