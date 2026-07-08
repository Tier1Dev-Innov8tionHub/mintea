"use client";

import { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useRecurring, useCategories, useFinanceMutations } from "@/lib/db/hooks";
import { recurringUpcoming, recurringLater } from "@/lib/calculations";
import { formatCurrency, daysUntil } from "@/lib/format";
import { format, addDays, eachDayOfInterval } from "date-fns";
import { Plus, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

const BRAND_COLORS: Record<string, string> = {
  Spotify: "#1DB954",
  Netflix: "#E50914",
  Chase: "#117ACA",
  Rent: "#6366F1",
};

function BillIcon({ name }: { name: string }) {
  const color = BRAND_COLORS[name] ?? "#059669";
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-full text-white text-xs font-bold"
      style={{ backgroundColor: color }}
    >
      {name.charAt(0)}
    </div>
  );
}

export default function RecurringPage() {
  const recurring = useRecurring();
  const categories = useCategories();
  const { addRecurring } = useFinanceMutations();
  const [tab, setTab] = useState<"upcoming" | "all">("upcoming");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [nextDate, setNextDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const upcoming = recurringUpcoming(recurring);
  const later = recurringLater(recurring);
  const displayList = tab === "upcoming" ? [...upcoming, ...later] : recurring.filter((r) => r.active);

  const today = new Date();
  const calendarDays = eachDayOfInterval({ start: today, end: addDays(today, 13) });
  const chargeDates = new Set(recurring.map((r) => r.nextDate));

  const handleAdd = async () => {
    if (!name || !amount) return;
    const catId = categories.find((c) => c.group === "bills")?.id || categories[0]?.id;
    if (!catId) return;
    await addRecurring({
      name,
      amount: parseFloat(amount),
      frequency,
      nextDate,
      categoryId: catId,
      active: true,
    });
    setName("");
    setAmount("");
    setShowAdd(false);
  };

  return (
    <MobileShell
      title="Recurring"
      headerExtra={
        <button onClick={() => setShowAdd(true)} className="rounded-full p-1 hover:bg-white/10">
          <Plus className="h-5 w-5" />
        </button>
      }
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 -mx-4 px-4">
          {(["upcoming", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-3 text-sm font-medium capitalize transition-colors",
                tab === t
                  ? "border-b-2 border-emerald-600 text-emerald-700"
                  : "text-gray-500"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Coming Up card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">Coming Up</p>
              <Maximize2 className="h-4 w-4 text-gray-400" />
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">
                You do not have any recurring charges within the next 7 days.
              </p>
            ) : (
              <p className="text-sm text-gray-500 mb-4">
                {upcoming.length} charge{upcoming.length !== 1 ? "s" : ""} due in the next 7 days.
              </p>
            )}
            {/* Calendar strip */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.slice(0, 7).map((day) => (
                <p key={day.toISOString()} className="text-[10px] text-gray-400">
                  {format(day, "EEE").charAt(0)}
                </p>
              ))}
              {calendarDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
                const hasCharge = chargeDates.has(dateStr);
                return (
                  <div key={day.toISOString()} className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs",
                        isToday ? "bg-blue-600 text-white font-bold" : "text-gray-700",
                        hasCharge && !isToday && "ring-2 ring-emerald-400"
                      )}
                    >
                      {format(day, "d")}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Bill list */}
        {later.length > 0 && tab === "upcoming" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 tracking-wider mb-2">COMING LATER</p>
            <div className="space-y-2">
              {later.map((bill) => (
                <BillCard key={bill.id} bill={bill} />
              ))}
            </div>
          </div>
        )}

        {tab === "all" && (
          <div className="space-y-2">
            {displayList.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        )}

        <Button onClick={() => setShowAdd(true)} variant="outline" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add Bill or Subscription
        </Button>
      </div>

      <Sheet open={showAdd} onClose={() => setShowAdd(false)} title="Add Recurring Bill">
        <div className="space-y-4">
          <Input label="Name*" placeholder="Netflix" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Amount*" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input label="Next Due Date*" type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500 px-1">Frequency</p>
            <div className="flex gap-2">
              {(["weekly", "monthly", "yearly"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`flex-1 rounded-full py-2 text-sm capitalize border ${
                    frequency === f ? "border-emerald-600 bg-emerald-50" : "border-gray-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full" disabled={!name || !amount}>Save</Button>
        </div>
      </Sheet>
    </MobileShell>
  );
}

function BillCard({ bill }: { bill: import("@/lib/db/schema").Recurring }) {
  const days = daysUntil(bill.nextDate);
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <BillIcon name={bill.name} />
        <div className="flex-1">
          <p className="font-semibold">{bill.name}</p>
          <p className="text-xs text-gray-500">
            {days <= 0 ? "Due today" : days === 1 ? "Due tomorrow" : `in ${days} days`}
          </p>
        </div>
        <p className="font-semibold">{formatCurrency(bill.amount)}</p>
      </CardContent>
    </Card>
  );
}
