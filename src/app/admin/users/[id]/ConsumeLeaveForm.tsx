'use client'

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { consumeLeave } from "./actions";
import { useRef } from "react";

export function ConsumeLeaveForm({ userId }: { userId: string }) {
    const formRef = useRef<HTMLFormElement>(null);
    const today = new Date().toISOString().split('T')[0];

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
                    }
                }}
                className="space-y-4"
            >
                <input type="hidden" name="userId" value={userId} />

                <div className="grid grid-cols-2 gap-4">
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
