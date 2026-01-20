import { Card } from "@/components/ui/Card";
import { getDashboardStats } from "./dashboardStats";
import { AlertCircle, Calendar, CheckCircle } from "lucide-react";

export default async function AdminDashboardPage() {
    const { upcomingGrants, expiringGrants, employeeStats } = await getDashboardStats();

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

            {/* Employee Stats Table */}
            <Card title="全社員 有給消化状況 (現在有効分)">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">氏名</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">保有総数</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">消化済</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">残日数</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">消化率</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {employeeStats.map((stat) => (
                                <tr key={stat.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {stat.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                        {stat.totalGranted}日
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                        {stat.totalUsed}日
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-600">
                                        {stat.totalRemaining}日
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                        <div className="flex items-center justify-end">
                                            <span className={`mr-2 font-medium ${parseFloat(stat.usageRate) >= 50 ? 'text-green-600' : 'text-orange-500'
                                                }`}>
                                                {stat.usageRate}%
                                            </span>
                                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full ${parseFloat(stat.usageRate) >= 50 ? 'bg-green-500' : 'bg-orange-400'
                                                        }`}
                                                    style={{ width: `${Math.min(parseFloat(stat.usageRate), 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {employeeStats.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                        データがありません
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

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
