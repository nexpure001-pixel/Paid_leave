'use client'

import { useState } from "react";
import { runAutoGrantCheck } from "./automationActions";
import { Button } from "@/components/ui/Button";
import { Sparkles } from "lucide-react";

export function AutoGrantButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleCheck = async () => {
        if (!confirm("全社員の勤続年数をチェックし、今日が付与日の社員に有給を自動付与します。\n実行しますか？")) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await runAutoGrantCheck();
            if (result.error) {
                alert(`エラー: ${result.error}`);
            } else {
                alert(result.message);
            }
        } catch (e) {
            alert("予期せぬエラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleCheck}
            disabled={isLoading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-black"
        >
            <Sparkles className="w-4 h-4" />
            {isLoading ? "チェック中..." : "自動付与チェックを実行"}
        </Button>
    );
}
