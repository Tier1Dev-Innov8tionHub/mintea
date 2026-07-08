"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  useRecurring,
  useCategories,
  useAccounts,
  useFinanceMutations,
  useViewer,
} from "@/lib/db/hooks";
import { filterRecurringByAccountView } from "@/lib/account-view";
import {
  accountLabel,
  monthlyRecurringTotal,
  recurringUpcoming,
  recurringLater,
} from "@/lib/calculations";
import { formatCurrency, daysUntil } from "@/lib/format";
import { format, addDays, eachDayOfInterval } from "date-fns";
import { Plus, Pencil, Trash2, Search, Pause, Play, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountViewFilterChips } from "@/components/accounts/view-filter-chips";
import type {
  AccountViewFilter,
  Recurring,
  RecurringFrequency,
} from "@/lib/db/schema";

const BRAND_COLORS: Record<string, string> = {
  Spotify: "#1DB954",
  Netflix: "#E50914",
  Chase: "#117ACA",
  Rent: "#6366F1",
};

function BillIcon({ name, inactive }: { name: string; inactive?: boolean }) {
  const color = BRAND_COLORS[name] ?? "#059669";
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-white text-xs font-bold",
        inactive && "opacity-50",
      )}
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
  categoryId: string;
  accountId: string;
  active: boolean;
};

const emptyForm = (categoryId = "", accountId = ""): FormState => ({
  name: "",
  amount: "",
  nextDate: format(new Date(), "yyyy-MM-dd"),
  frequency: "monthly",
  categoryId,
  accountId,
  active: true,
});

export default function RecurringPage() {
  const recurring = useRecurring();
  const categories = useCategories();
  const accounts = useAccounts();
  const viewer = useViewer();
  const {
    addRecurring,
    updateRecurring,
    deleteRecurring,
    advanceOverdueRecurring,
    markRecurringPaid,
  } = useFinanceMutations();
  const [tab, setTab] = useState<"upcoming" | "all" | "inactive">("upcoming");
  const [search, setSearch] = useState("");
  const [viewFilter, setViewFilter] = useState<AccountViewFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Recurring | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Recurring | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Catch up overdue nextDates whenever the page opens.
  useEffect(() => {
    void advanceOverdueRecurring().catch(() => {
      // Non-fatal — list still renders with stored dates
    });
  }, [advanceOverdueRecurring]);

  const defaultCategoryId =
    categories.find((c) => c.group === "bills")?.id || categories[0]?.id || "";

  const scopedRecurring = useMemo(
    () =>
      filterRecurringByAccountView(
        recurring,
        accounts,
        viewer?.userId,
        viewFilter,
      ),
    [recurring, accounts, viewer?.userId, viewFilter],
  );

  const upcoming = recurringUpcoming(scopedRecurring);
  const later = recurringLater(scopedRecurring);
  const inactive = scopedRecurring.filter((r) => !r.active);
  const monthlyTotal = monthlyRecurringTotal(scopedRecurring);

  const matchesSearch = (bill: Recurring) =>
    !search.trim() ||
    bill.name.toLowerCase().includes(search.trim().toLowerCase());

  const displayList = useMemo(() => {
    if (tab === "upcoming") {
      return [...upcoming, ...later].filter(matchesSearch);
    }
    if (tab === "inactive") {
      return inactive.filter(matchesSearch);
    }
    return scopedRecurring.filter((r) => r.active).filter(matchesSearch);
    // matchesSearch depends only on `search`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, upcoming, later, inactive, scopedRecurring, search]);

  const today = new Date();
  const calendarDays = eachDayOfInterval({ start: today, end: addDays(today, 13) });
  const chargesByDate = useMemo(() => {
    const map = new Map<string, Recurring[]>();
    for (const r of recurring.filter((x) => x.active)) {
      const list = map.get(r.nextDate) ?? [];
      list.push(r);
      map.set(r.nextDate, list);
    }
    return map;
  }, [recurring]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(defaultCategoryId, accounts[0]?.id ?? ""));
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
      categoryId: bill.categoryId,
      accountId: bill.accountId ?? "",
      active: bill.active,
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
    if (!form.categoryId) {
      setError("Pick a category");
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
          categoryId: form.categoryId,
          accountId: form.accountId || null,
          active: form.active,
        });
      } else {
        await addRecurring({
          name: form.name.trim(),
          amount,
          frequency: form.frequency,
          nextDate: form.nextDate,
          categoryId: form.categoryId,
          accountId: form.accountId || undefined,
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

  const handleToggleActive = async (bill: Recurring) => {
    try {
      await updateRecurring(bill.id, { active: !bill.active });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleMarkPaid = async (bill: Recurring) => {
    try {
      await markRecurringPaid(bill.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark paid");
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

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name;
  const getAccountName = (id?: string) => {
    if (!id) return null;
    const account = accounts.find((a) => a.id === id);
    return account ? accountLabel(account) : null;
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
      <div className="animate-fade-up space-y-4">
        <AccountViewFilterChips value={viewFilter} onChange={setViewFilter} />

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Est. monthly recurring</p>
            <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
              {formatCurrency(monthlyTotal)}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Weekly and yearly bills normalized to monthly
            </p>
          </CardContent>
        </Card>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search bills…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border-0 bg-white py-3.5 pl-10 pr-4 text-sm shadow-[0_4px_24px_rgba(15,23,42,0.06)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="-mx-4 flex gap-1 border-b border-gray-200/80 px-4">
          {(["upcoming", "all", "inactive"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-3 text-sm font-semibold capitalize transition-colors",
                tab === t
                  ? "border-b-[3px] border-emerald-600 text-gray-900"
                  : "text-gray-400",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "upcoming" && (
          <Card>
            <CardContent className="p-5">
              <p className="mb-2 font-semibold text-gray-900">Coming Up</p>
              {upcoming.length === 0 ? (
                <p className="mb-4 text-sm text-gray-500">
                  You do not have any recurring charges within the next 7 days.
                </p>
              ) : (
                <p className="mb-4 text-sm text-gray-500">
                  {upcoming.length} charge{upcoming.length !== 1 ? "s" : ""} due
                  in the next 7 days.
                </p>
              )}
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3">
                <div className="grid grid-cols-7 gap-1 text-center">
                  {calendarDays.slice(0, 7).map((day) => (
                    <p
                      key={day.toISOString()}
                      className="text-[10px] font-medium text-gray-400"
                    >
                      {format(day, "EEE").slice(0, 3)}
                    </p>
                  ))}
                  {calendarDays.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const isToday =
                      format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
                    const dayCharges = chargesByDate.get(dateStr) ?? [];
                    const hasCharge = dayCharges.length > 0;
                    return (
                      <div
                        key={day.toISOString()}
                        className="flex flex-col items-center py-0.5"
                        title={
                          hasCharge
                            ? dayCharges.map((c) => c.name).join(", ")
                            : undefined
                        }
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-xs",
                            isToday
                              ? "bg-blue-600 font-bold text-white"
                              : "text-gray-700",
                            hasCharge &&
                              !isToday &&
                              "ring-2 ring-emerald-400 ring-offset-1",
                          )}
                        >
                          {format(day, "d")}
                        </div>
                        {hasCharge && (
                          <span className="mt-0.5 text-[9px] font-medium text-emerald-600">
                            {dayCharges.length}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && !showForm && (
          <p className="px-1 text-sm text-red-600">{error}</p>
        )}

        {tab === "upcoming" && upcoming.filter(matchesSearch).length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wider text-gray-500">
              DUE SOON
            </p>
            <div className="space-y-2">
              {upcoming.filter(matchesSearch).map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  categoryName={getCategoryName(bill.categoryId)}
                  accountName={getAccountName(bill.accountId)}
                  onEdit={() => openEdit(bill)}
                  onDelete={() => setDeleteTarget(bill)}
                  onToggleActive={() => void handleToggleActive(bill)}
                  onMarkPaid={() => void handleMarkPaid(bill)}
                />
              ))}
            </div>
          </div>
        )}

        {tab === "upcoming" && later.filter(matchesSearch).length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wider text-gray-500">
              COMING LATER
            </p>
            <div className="space-y-2">
              {later.filter(matchesSearch).map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  categoryName={getCategoryName(bill.categoryId)}
                  accountName={getAccountName(bill.accountId)}
                  onEdit={() => openEdit(bill)}
                  onDelete={() => setDeleteTarget(bill)}
                  onToggleActive={() => void handleToggleActive(bill)}
                  onMarkPaid={() => void handleMarkPaid(bill)}
                />
              ))}
            </div>
          </div>
        )}

        {(tab === "all" || tab === "inactive") && (
          <div className="space-y-2">
            {displayList.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-gray-500">
                  {search
                    ? "No matching bills"
                    : tab === "inactive"
                      ? "No paused bills"
                      : "No active recurring bills"}
                </CardContent>
              </Card>
            ) : (
              displayList.map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  categoryName={getCategoryName(bill.categoryId)}
                  accountName={getAccountName(bill.accountId)}
                  onEdit={() => openEdit(bill)}
                  onDelete={() => setDeleteTarget(bill)}
                  onToggleActive={() => void handleToggleActive(bill)}
                  onMarkPaid={() => void handleMarkPaid(bill)}
                />
              ))
            )}
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
            onChange={(e) =>
              setForm((f) => ({ ...f, nextDate: e.target.value }))
            }
          />
          <div>
            <p className="mb-2 px-1 text-xs font-medium text-gray-500">
              Frequency
            </p>
            <div className="flex gap-2">
              {(["weekly", "monthly", "yearly"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, frequency: f }))}
                  className={cn(
                    "flex-1 rounded-full border py-2 text-sm capitalize",
                    form.frequency === f
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-gray-200",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 px-1 text-xs font-medium text-gray-500">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, categoryId: cat.id }))
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm",
                    form.categoryId === cat.id
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-gray-200",
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          {accounts.length > 0 && (
            <div>
              <p className="mb-2 px-1 text-xs font-medium text-gray-500">
                Payment account
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, accountId: "" }))}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm",
                    !form.accountId
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-gray-200",
                  )}
                >
                  None
                </button>
                {accounts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, accountId: a.id }))
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm",
                      form.accountId === a.id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-gray-200",
                    )}
                  >
                    {accountLabel(a)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {editing && (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm",
                form.active
                  ? "border-gray-200 bg-white"
                  : "border-amber-200 bg-amber-50",
              )}
            >
              <span className="font-medium text-gray-800">
                {form.active ? "Active" : "Paused"}
              </span>
              <span
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  form.active ? "bg-emerald-600" : "bg-gray-300",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    form.active && "translate-x-5",
                  )}
                />
              </span>
            </button>
          )}
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
        <p className="mb-4 text-sm text-gray-600">
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
  categoryName,
  accountName,
  onEdit,
  onDelete,
  onToggleActive,
  onMarkPaid,
}: {
  bill: Recurring;
  categoryName?: string;
  accountName?: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onMarkPaid: () => void;
}) {
  const days = daysUntil(bill.nextDate);
  return (
    <Card className={cn(!bill.active && "opacity-70")}>
      <CardContent className="flex items-center gap-3 p-4">
        <BillIcon name={bill.name} inactive={!bill.active} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{bill.name}</p>
          <p className="text-xs text-gray-500">
            {!bill.active
              ? "Paused"
              : days <= 0
                ? "Due today"
                : days === 1
                  ? "Due tomorrow"
                  : `in ${days} days`}
            {" · "}
            <span className="capitalize">{bill.frequency}</span>
            {categoryName ? ` · ${categoryName}` : ""}
          </p>
          {accountName && (
            <p className="truncate text-xs text-gray-400">{accountName}</p>
          )}
        </div>
        <p className="font-semibold tabular-nums">
          {formatCurrency(bill.amount)}
        </p>
        {bill.active && (
          <button
            type="button"
            onClick={onMarkPaid}
            className="rounded-full p-2 text-gray-400 hover:bg-emerald-50 hover:text-emerald-700"
            aria-label={`Mark ${bill.name} paid`}
            title="Mark paid — advance to next due date"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onToggleActive}
          className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label={bill.active ? `Pause ${bill.name}` : `Resume ${bill.name}`}
        >
          {bill.active ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
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
