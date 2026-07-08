"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAccounts,
  useCategories,
  useFinanceMutations,
} from "@/lib/db/hooks";
import { CategoryIcon } from "@/components/icons/category-icon";
import { accountLabel } from "@/lib/calculations";
import { formatCurrency, formatShortDate } from "@/lib/format";
import type { Transaction } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { EyeOff, Clock } from "lucide-react";

function TransactionDetailForm({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const categories = useCategories();
  const accounts = useAccounts();
  const { updateTransaction, deleteTransaction } = useFinanceMutations();

  const [amount, setAmount] = useState(String(transaction.amount));
  const [description, setDescription] = useState(transaction.description);
  const [date, setDate] = useState(transaction.date);
  const [categoryId, setCategoryId] = useState<string | null>(
    transaction.categoryId,
  );
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [notes, setNotes] = useState(transaction.notes ?? "");
  const [isIgnored, setIsIgnored] = useState(transaction.isIgnored);
  const [isPending, setIsPending] = useState(transaction.isPending ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const account = accounts.find((a) => a.id === accountId);

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (Number.isNaN(parsed)) {
      setError("Enter a valid amount");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateTransaction(transaction.id, {
        amount: parsed,
        description: description.trim(),
        date,
        categoryId,
        accountId,
        notes: notes.trim() || null,
        isIgnored,
        isPending,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteTransaction(transaction.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p
          className={cn(
            "text-3xl font-bold tabular-nums",
            transaction.type === "income" ? "text-emerald-600" : "text-gray-900",
          )}
        >
          {transaction.type === "income"
            ? "+"
            : transaction.type === "expense"
              ? "−"
              : ""}
          {formatCurrency(parseFloat(amount) || 0)}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {formatShortDate(date)}
          {isPending && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              <Clock className="h-3 w-3" />
              Pending
            </span>
          )}
          {isIgnored && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              <EyeOff className="h-3 w-3" />
              Ignored
            </span>
          )}
        </p>
      </div>

      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        label="Amount"
        type="number"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <div>
        <p className="mb-2 px-1 text-xs font-medium text-gray-500">Category</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                categoryId === cat.id
                  ? "border-emerald-600 bg-emerald-50"
                  : "border-gray-200 bg-white",
              )}
            >
              <CategoryIcon icon={cat.icon} color={cat.color} size={14} />
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 px-1 text-xs font-medium text-gray-500">Account</p>
        <div className="flex flex-wrap gap-2">
          {accounts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAccountId(a.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                accountId === a.id
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-gray-200 bg-white text-gray-700",
              )}
            >
              {accountLabel(a)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="px-1 text-xs font-medium text-gray-500">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note…"
          rows={3}
          className="w-full resize-none rounded-2xl bg-gray-100 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setIsIgnored((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm",
            isIgnored
              ? "border-gray-300 bg-gray-50"
              : "border-gray-200 bg-white",
          )}
        >
          <span className="flex items-center gap-2 font-medium text-gray-800">
            <EyeOff className="h-4 w-4 text-gray-500" />
            Ignore from spending
          </span>
          <span
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              isIgnored ? "bg-emerald-600" : "bg-gray-200",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                isIgnored && "translate-x-5",
              )}
            />
          </span>
        </button>
        <button
          type="button"
          onClick={() => setIsPending((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm",
            isPending
              ? "border-amber-200 bg-amber-50"
              : "border-gray-200 bg-white",
          )}
        >
          <span className="flex items-center gap-2 font-medium text-gray-800">
            <Clock className="h-4 w-4 text-gray-500" />
            Mark as pending
          </span>
          <span
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              isPending ? "bg-amber-500" : "bg-gray-200",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                isPending && "translate-x-5",
              )}
            />
          </span>
        </button>
      </div>

      {account && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500">Account</p>
          <p className="font-medium text-gray-900">{accountLabel(account)}</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={handleSave} className="w-full" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
      <Button
        onClick={handleDelete}
        variant="destructive"
        className="w-full"
        disabled={saving}
      >
        Delete
      </Button>
    </div>
  );
}

export function EditTransactionSheet({
  open,
  onClose,
  transaction,
}: {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}) {
  if (!transaction) return null;

  return (
    <Sheet open={open} onClose={onClose} title="Transaction">
      <TransactionDetailForm
        key={transaction.id}
        transaction={transaction}
        onClose={onClose}
      />
    </Sheet>
  );
}
