import { Card } from "@/components/ui/Card";
import { getDashboardStats } from "./dashboardStats";
import { AlertCircle, Calendar, CheckCircle } from "lucide-react";

export default async function AdminDashboardPage() {
    const { upcomingGrants, expiringGrants } = await getDashboardStats();

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expiring Soon */}
                <Card title="⚠️ 有給消滅アラート (30日以内)">
                    {expiringGrants.length === 0 ? (
                        <div className="flex items-center text-gray-500 p-4">
                            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                            <span className="text-sm">直近で消滅する有給はありません</span>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {expiringGrants.map((item, i) => (
                                <li key={i} className="py-3 flex justify-between items-center">
                                    <div className="flex items-center">
                                        <AlertCircle className="w-5 h-5 mr-3 text-red-500" />
                                        <div>
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-xs text-gray-500">期限: {item.date}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-red-600">
                                        残り {item.remaining}日
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                {/* Upcoming Grants */}
                <Card title="✨ 自動付与予定 (30日以内)">
                    {upcomingGrants.length === 0 ? (
                        <div className="flex items-center text-gray-500 p-4">
                            <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                            <span className="text-sm">直近の付与予定はありません</span>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {upcomingGrants.map((item, i) => (
                                <li key={i} className="py-3 flex justify-between items-center">
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                                        <div>
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-xs text-gray-500">予定日: {item.date}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-blue-600">
                                        +{item.days}日
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

            {/* Quick Links / Status (Optional) */}
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">システム運用状況</h3>
                    <p className="text-sm text-gray-500">
                        自動付与チェックは「社員一覧」画面から手動で実行できます。<br />
                        有給の消化入力は各社員の「詳細画面」から行ってください。
                    </p>
                </div>
            </div>
        </div>
    );
}
