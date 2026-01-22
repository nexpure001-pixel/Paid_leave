'use client'

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { consumeLeave } from "./actions";
import { useRef, useState } from "react";

export function ConsumeLeaveForm({ userId }: { userId: string }) {
    const formRef = useRef<HTMLFormElement>(null);
    const today = new Date().toISOString().split('T')[0];
    const [consumptionType, setConsumptionType] = useState('full'); // full, half, time

    return (
        <Card title="有給消化 (実績入力)">
            <p className="text-sm text-gray-500 mb-4">
                従業員からの口頭申請などに基づき、有給消化を記録します。<br />
                古い付与分から自動的に消化されます。
            </p>
            <form
                ref={formRef}
                action={async (formData) => {
                    const result = await consumeLeave(formData);
                    if (result?.error) {
                        alert("エラー: " + result.error);
                    } else {
                        alert("消化処理が完了しました");
                        formRef.current?.reset();
                        setConsumptionType('full'); // Reset type
                    }
                }}
                className="space-y-4"
            >
                <input type="hidden" name="userId" value={userId} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            消化日 (Date Claimed)
                        </label>
                        <Input
                            type="date"
                            name="date"
                            required
                            defaultValue={today}
                        />
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        消化種別 (Type)
                    </label>
                    <div className="flex space-x-4 mb-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="consumptionType"
                                value="full"
                                checked={consumptionType === 'full'}
                                onChange={() => setConsumptionType('full')}
                                className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                            />
                            <span>1日 (全休)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="consumptionType"
                                value="half"
                                checked={consumptionType === 'half'}
                                onChange={() => setConsumptionType('half')}
                                className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                            />
                            <span>半日 (0.5日)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="consumptionType"
                                value="time"
                                checked={consumptionType === 'time'}
                                onChange={() => setConsumptionType('time')}
                                className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                            />
                            <span>時間休 (Time)</span>
                        </label>
                    </div>

                    {consumptionType === 'time' && (
                        <div className="bg-orange-50 p-4 rounded-md mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                消化時間 (1日8時間換算)
                            </label>
                            <select
                                name="hours"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white p-2"
                            >
                                <option value="1">1時間 (0.125日)</option>
                                <option value="2">2時間 (0.250日)</option>
                                <option value="3">3時間 (0.375日)</option>
                                <option value="4">4時間 (0.500日)</option>
                                <option value="5">5時間 (0.625日)</option>
                                <option value="6">6時間 (0.750日)</option>
                                <option value="7">7時間 (0.875日)</option>
                            </select>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        理由 (Reason)
                    </label>
                    <Input
                        name="reason"
                        placeholder="例: 私用のため"
                        required
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                        消化を実行する
                    </Button>
                </div>
            </form>
        </Card>
    );
}
