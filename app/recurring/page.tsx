"use client";

import { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useRecurring, useCategories, useFinanceMutations } from "@/lib/db/hooks";
import { recurringUpcoming, recurringLater } from "@/lib/calculations";
import { formatCurrency, daysUntil } from "@/lib/format";
import { format, addDays, eachDayOfInterval } from "date-fns";
import { Plus, Maximize2, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Recurring, RecurringFrequency } from "@/lib/db/schema";

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

type FormState = {
  name: string;
  amount: string;
  nextDate: string;
  frequency: RecurringFrequency;
};

const emptyForm = (): FormState => ({
  name: "",
  amount: "",
  nextDate: format(new Date(), "yyyy-MM-dd"),
  frequency: "monthly",
});

export default function RecurringPage() {
  const recurring = useRecurring();
  const categories = useCategories();
  const { addRecurring, updateRecurring, deleteRecurring } = useFinanceMutations();
  const [tab, setTab] = useState<"upcoming" | "all">("upcoming");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Recurring | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Recurring | null>(null);
  const [deleting, setDeleting] = useState(false);

  const upcoming = recurringUpcoming(recurring);
  const later = recurringLater(recurring);
  const displayList =
    tab === "upcoming" ? [...upcoming, ...later] : recurring.filter((r) => r.active);

  const today = new Date();
  const calendarDays = eachDayOfInterval({ start: today, end: addDays(today, 13) });
  const chargeDates = new Set(recurring.map((r) => r.nextDate));
  const monthlyTotal = recurring
    .filter((r) => r.active && r.frequency === "monthly")
    .reduce((sum, r) => sum + r.amount, 0);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setError(null);
    setShowForm(true);
  };

  const openEdit = (bill: Recurring) => {
    setEditing(bill);
    setForm({
      name: bill.name,
      amount: String(bill.amount),
      nextDate: bill.nextDate,
      frequency: bill.frequency,
    });
    setError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.amount) return;
    const amount = parseFloat(form.amount);
    if (Number.isNaN(amount)) {
      setError("Enter a valid amount");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateRecurring(editing.id, {
          name: form.name.trim(),
          amount,
          frequency: form.frequency,
          nextDate: form.nextDate,
        });
      } else {
        const catId =
          categories.find((c) => c.group === "bills")?.id || categories[0]?.id;
        if (!catId) {
          setError("No categories available yet");
          return;
        }
        await addRecurring({
          name: form.name.trim(),
          amount,
          frequency: form.frequency,
          nextDate: form.nextDate,
          categoryId: catId,
          active: true,
        });
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecurring(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MobileShell
      title="Recurring"
      headerExtra={
        <button onClick={openCreate} className="rounded-full p-1 hover:bg-white/10">
          <Plus className="h-5 w-5" />
        </button>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Active monthly recurring</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(monthlyTotal)}</p>
          </CardContent>
        </Card>

        <div className="flex border-b border-gray-200 -mx-4 px-4">
          {(["upcoming", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-3 text-sm font-medium capitalize transition-colors",
                tab === t
                  ? "border-b-2 border-emerald-600 text-emerald-700"
                  : "text-gray-500",
              )}
            >
              {t}
            </button>
          ))}
        </div>

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
                        hasCharge && !isToday && "ring-2 ring-emerald-400",
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

        {error && !showForm && <p className="text-sm text-red-600 px-1">{error}</p>}

        {later.length > 0 && tab === "upcoming" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 tracking-wider mb-2">
              COMING LATER
            </p>
            <div className="space-y-2">
              {later.map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  onEdit={() => openEdit(bill)}
                  onDelete={() => setDeleteTarget(bill)}
                />
              ))}
            </div>
          </div>
        )}

        {tab === "all" && (
          <div className="space-y-2">
            {displayList.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onEdit={() => openEdit(bill)}
                onDelete={() => setDeleteTarget(bill)}
              />
            ))}
          </div>
        )}

        <Button onClick={openCreate} variant="outline" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add Bill or Subscription
        </Button>
      </div>

      <Sheet
        open={showForm}
        onClose={() => !saving && setShowForm(false)}
        title={editing ? "Edit Recurring Bill" : "Add Recurring Bill"}
      >
        <div className="space-y-4">
          <Input
            label="Name*"
            placeholder="Netflix"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Amount*"
            type="number"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <Input
            label="Next Due Date*"
            type="date"
            value={form.nextDate}
            onChange={(e) => setForm((f) => ({ ...f, nextDate: e.target.value }))}
          />
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500 px-1">Frequency</p>
            <div className="flex gap-2">
              {(["weekly", "monthly", "yearly"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, frequency: f }))}
                  className={`flex-1 rounded-full py-2 text-sm capitalize border ${
                    form.frequency === f
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-gray-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            onClick={handleSave}
            className="w-full"
            disabled={saving || !form.name.trim() || !form.amount}
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Save"}
          </Button>
        </div>
      </Sheet>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete recurring bill?"
      >
        <p className="text-sm text-gray-600 mb-4">
          {deleteTarget ? `Remove ${deleteTarget.name}?` : null}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            disabled={deleting}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Modal>
    </MobileShell>
  );
}

function BillCard({
  bill,
  onEdit,
  onDelete,
}: {
  bill: Recurring;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const days = daysUntil(bill.nextDate);
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <BillIcon name={bill.name} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{bill.name}</p>
          <p className="text-xs text-gray-500">
            {days <= 0 ? "Due today" : days === 1 ? "Due tomorrow" : `in ${days} days`}
            {" · "}
            <span className="capitalize">{bill.frequency}</span>
          </p>
        </div>
        <p className="font-semibold tabular-nums">{formatCurrency(bill.amount)}</p>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label={`Edit ${bill.name}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete ${bill.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
