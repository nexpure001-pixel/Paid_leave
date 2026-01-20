'use client'

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { grantLeave } from "./actions";
import { useRef } from "react";

export function GrantLeaveForm({ userId }: { userId: string }) {
    const formRef = useRef<HTMLFormElement>(null);

    // Default dates: Valid from Today, Expires in 2 years
    const today = new Date().toISOString().split('T')[0];
    const nextTwoYears = new Date();
    nextTwoYears.setFullYear(nextTwoYears.getFullYear() + 2);
    const defaultExpiry = nextTwoYears.toISOString().split('T')[0];

    return (
        <Card title="有給休暇の手動付与">
            <form
                ref={formRef}
                action={async (formData) => {
                    const result = await grantLeave(formData);
                    if (result?.error) {
                        alert("エラー: " + result.error);
                    } else {
                        alert("付与しました");
                        formRef.current?.reset();
                    }
                }}
                className="space-y-4"
            >
                <input type="hidden" name="userId" value={userId} />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            付与日数 (Days)
                        </label>
                        <Input
                            type="number"
                            name="daysGranted"
                            step="0.5"
                            required
                            defaultValue={10}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            付与理由 (Reason)
                        </label>
                        <Input
                            name="reason"
                            placeholder="例: 定期付与, 入社半年"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            有効開始日 (Valid From)
                        </label>
                        <Input
                            type="date"
                            name="validFrom"
                            required
                            defaultValue={today}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            有効期限 (Expiry Date)
                        </label>
                        <Input
                            type="date"
                            name="expiryDate"
                            required
                            defaultValue={defaultExpiry}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit">付与を実行する</Button>
                </div>
            </form>
        </Card>
    );
}
