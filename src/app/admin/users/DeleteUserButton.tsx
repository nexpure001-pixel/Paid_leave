'use client'

import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { deleteUser } from "./actions";
import { useTransition } from "react";

export function DeleteUserButton({ userId }: { userId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (confirm("本当にこの社員を削除しますか？\nこの操作は取り消せません。")) {
            startTransition(async () => {
                const result = await deleteUser(userId);
                if (result?.error) {
                    alert("削除に失敗しました: " + result.error);
                }
            });
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-900"
            onClick={handleDelete}
            disabled={isPending}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}
