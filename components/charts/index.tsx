"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { formatCurrency } from "@/lib/format";

interface SpendingChartProps {
  data: { day: number; cumulative: number }[];
  budget: number;
  height?: number;
}

export function SpendingChart({ data, budget, height = 120 }: SpendingChartProps) {
  const maxVal = Math.max(budget, ...data.map((d) => d.cumulative));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" hide />
        <YAxis hide domain={[0, maxVal * 1.1]} />
        <ReferenceLine
          y={budget}
          stroke="#9CA3AF"
          strokeDasharray="4 4"
          label={{ value: "BUDGET", position: "insideTopRight", fontSize: 10, fill: "#9CA3AF" }}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="#059669"
          strokeWidth={2}
          fill="url(#spendGradient)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface BudgetDonutProps {
  data: { label: string; amount: number; color: string }[];
  total: number;
  size?: number;
}

export function BudgetDonut({ data, total, size = 180 }: BudgetDonutProps) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const segments = data.reduce<
    { color: string; dash: number; offset: number }[]
  >((acc, item) => {
    const pct = total > 0 ? item.amount / total : 0;
    const dash = pct * circumference;
    const offset = acc.reduce((sum, s) => sum + s.dash, 0);
    acc.push({ color: item.color, dash, offset });
    return acc;
  }, []);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={20}
        />
        {segments.map((segment, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={20}
              strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="butt"
            />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xs text-gray-500">Monthly earnings</p>
        <p className="text-2xl font-bold">{formatCurrency(total)}</p>
      </div>
    </div>
  );
}

interface CategoryBarChartProps {
  data: { month: string; spent: number }[];
  budget?: number;
  height?: number;
}

export function CategoryBarChart({ data, budget, height = 100 }: CategoryBarChartProps) {
  const maxVal = Math.max(budget ?? 0, ...data.map((d) => d.spent), 1);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis hide domain={[0, maxVal * 1.2]} />
        {budget && (
          <ReferenceLine y={budget} stroke="#374151" strokeDasharray="4 4" />
        )}
        <Line
          type="monotone"
          dataKey="spent"
          stroke="#3B82F6"
          strokeWidth={0}
          dot={false}
          activeDot={false}
        />
        {/* Bar representation via custom - use simple div bars instead */}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({ data, budget }: { data: { month: string; spent: number }[]; budget?: number }) {
  const maxVal = Math.max(budget ?? 0, ...data.map((d) => d.spent), 1);

  return (
    <div className="flex items-end justify-around gap-4 h-24 px-2">
      {data.map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full max-w-[40px] rounded-t-lg bg-blue-400 transition-all"
            style={{ height: `${(item.spent / maxVal) * 80}px`, minHeight: 4 }}
          />
          <span className={`text-xs ${i === data.length - 1 ? "font-semibold underline" : "text-gray-500"}`}>
            {item.month}
          </span>
        </div>
      ))}
      {budget && (
        <div
          className="absolute left-0 right-0 border-t border-dashed border-gray-800 pointer-events-none"
          style={{ bottom: `${(budget / maxVal) * 80 + 24}px` }}
        />
      )}
    </div>
  );
}
