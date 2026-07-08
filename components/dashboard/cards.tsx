"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/modal";
import { GoalIcon } from "@/components/icons/category-icon";
import { formatCurrency } from "@/lib/format";
import { goalProgress } from "@/lib/calculations";
import type { Goal } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

export function GoalProgressCard({
  goal,
  onClick,
}: {
  goal: Goal;
  onClick?: () => void;
}) {
  const progress = goalProgress(goal);

  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
              <GoalIcon icon={goal.icon} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold text-gray-900">{goal.name}</p>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                  {formatCurrency(goal.currentAmount)}
                </p>
              </div>
              <Progress value={progress} className="mt-2.5 h-1.5" />
              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {goal.status === "paused"
                    ? "Paused"
                    : `${Math.round(progress)}% of ${formatCurrency(goal.targetAmount)}`}
                </p>
                {goal.status === "active" && progress > 0 && (
                  <p className="text-xs font-medium text-emerald-600">On track</p>
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
  href,
}: {
  icon: React.ReactNode;
  label: string;
  amount: number;
  color?: string;
  expandable?: boolean;
  href?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3.5 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
          {icon}
        </div>
        <span className="font-medium text-gray-900">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className={cn("font-semibold tabular-nums", color ?? "text-gray-900")}
          style={color ? { color } : undefined}
        >
          {formatCurrency(amount)}
        </span>
        {expandable && <ChevronDown className="h-4 w-4 text-gray-400" />}
        {href && <ChevronRight className="h-4 w-4 text-gray-400" />}
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
  ignored,
  pending,
}: {
  description: string;
  date: string;
  amount: number;
  icon?: React.ReactNode;
  type?: "income" | "expense" | "transfer";
  onClick?: () => void;
  ignored?: boolean;
  pending?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between border-b border-gray-100 py-3.5 text-left last:border-0 transition-colors hover:bg-gray-50/80 -mx-1 px-1 rounded-xl",
        ignored && "opacity-60",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon ?? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
            <span className="text-gray-400">?</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">{description}</p>
          <p className="text-xs text-gray-500">
            {date}
            {pending && (
              <span className="ml-1.5 text-amber-600">· Pending</span>
            )}
            {ignored && (
              <span className="ml-1.5 text-gray-400">· Ignored</span>
            )}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 pl-3 font-semibold tabular-nums",
          type === "income" ? "text-emerald-600" : "text-gray-900",
          ignored && "line-through",
        )}
      >
        {type === "income" ? "+" : type === "expense" ? "-" : ""}
        {formatCurrency(amount)}
      </span>
    </button>
  );
}
