"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/modal";
import { GoalIcon } from "@/components/icons/category-icon";
import { formatCurrency } from "@/lib/format";
import { goalProgress } from "@/lib/calculations";
import type { Goal } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export function GoalProgressCard({ goal, onClick }: { goal: Goal; onClick?: () => void }) {
  const progress = goalProgress(goal);

  return (
    <button
      onClick={onClick}
      className="w-full text-left"
    >
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <GoalIcon icon={goal.icon} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900 truncate">{goal.name}</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(goal.currentAmount)}
                </p>
              </div>
              <Progress value={progress} className="mt-2" />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {goal.status === "paused" ? "Paused" : `${Math.round(progress)}% of ${formatCurrency(goal.targetAmount)}`}
                </p>
                {goal.status === "active" && progress > 0 && (
                  <p className="text-xs text-emerald-600">On track</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export function AccountRow({
  icon,
  label,
  amount,
  color,
  expandable,
}: {
  icon: React.ReactNode;
  label: string;
  amount: number;
  color?: string;
  expandable?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium text-gray-900">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn("font-semibold", color ?? "text-gray-900")}
          style={color ? { color } : undefined}
        >
          {formatCurrency(amount)}
        </span>
        {expandable && (
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
    </div>
  );
}

export function TransactionRow({
  description,
  date,
  amount,
  icon,
  type,
  onClick,
}: {
  description: string;
  date: string;
  amount: number;
  icon?: React.ReactNode;
  type?: "income" | "expense" | "transfer";
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between py-3 border-b border-gray-100 last:border-0 text-left hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3">
        {icon ?? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <span className="text-gray-400">?</span>
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900">{description}</p>
          <p className="text-xs text-gray-500">{date}</p>
        </div>
      </div>
      <span
        className={cn(
          "font-semibold",
          type === "income" ? "text-emerald-600" : "text-gray-900"
        )}
      >
        {type === "income" ? "+" : type === "expense" ? "-" : ""}
        {formatCurrency(amount)}
      </span>
    </button>
  );
}
