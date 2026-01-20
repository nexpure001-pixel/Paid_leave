"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, FileText, Settings, UserPlus, LogOut, LayoutDashboard } from "lucide-react";
import { cn } from "@/components/ui/Button";

const navigation = [
    { name: "ダッシュボード", href: "/admin", icon: LayoutDashboard },
    { name: "社員管理", href: "/admin/users", icon: Users },
    { name: "承認待ち申請", href: "#", icon: FileText },
    { name: "設定", href: "#", icon: Settings },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen w-64 flex-col border-r bg-gray-900 text-white">
            <div className="flex h-16 items-center justify-center border-b border-gray-800 px-6">
                <h1 className="text-xl font-bold tracking-wider">Admin Portal</h1>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-gray-800 text-white"
                                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                )}
                            >
                                <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="border-t border-gray-800 p-4">
                <button className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                    <LogOut className="mr-3 h-5 w-5" />
                    ログアウト
                </button>
            </div>
        </div>
    );
}
