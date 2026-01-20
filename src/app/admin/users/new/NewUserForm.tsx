'use client'

import { useActionState } from "react";
import { createUser } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const initialState = {
    error: '',
}

export function NewUserForm() {
    const [state, formAction, isPending] = useActionState(createUser, initialState);

    return (
        <form action={formAction} className="space-y-6">
            {state?.error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {state.error}
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    氏名 (Full Name)
                </label>
                <Input
                    name="fullName"
                    required
                    placeholder="例: 山田 太郎"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                </label>
                <Input
                    name="email"
                    type="email"
                    required
                    placeholder="taro.yamada@example.com"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    初期パスワード
                </label>
                <Input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">※登録後に変更可能です</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    入社日 (Join Date)
                </label>
                <Input
                    name="joinedAt"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    権限
                </label>
                <select
                    name="role"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    <option value="employee">従業員</option>
                    <option value="admin">管理者</option>
                </select>
            </div>

            <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isPending}>
                    {isPending ? '登録中...' : '登録する'}
                </Button>
            </div>
        </form>
    );
}
