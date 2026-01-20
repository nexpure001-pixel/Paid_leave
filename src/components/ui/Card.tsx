import { ReactNode } from 'react'
import { cn } from '@/components/ui/Button'

interface CardProps {
    title: string
    children: ReactNode
    className?: string
    action?: ReactNode
}

export function Card({ title, children, className, action }: CardProps) {
    return (
        <div className={cn("overflow-hidden rounded-lg bg-white shadow", className)}>
            <div className="border-b border-gray-200 px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
                {action && <div>{action}</div>}
            </div>
            <div className="px-4 py-5 sm:p-6">
                {children}
            </div>
        </div>
    )
}
