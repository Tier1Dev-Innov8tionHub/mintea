"use client";

import { useMemo, useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useAccounts, useFinanceMutations } from "@/lib/db/hooks";
import { accountLabel, totalBalances } from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";
import type { Account, AccountType } from "@/lib/db/schema";
import {
  Building2,
  CreditCard,
  PiggyBank,
  Banknote,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ACCOUNT_TYPES: Array<{ value: AccountType; label: string }> = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit", label: "Credit card" },
  { value: "cash", label: "Cash" },
];

function typeIcon(type: AccountType) {
  switch (type) {
    case "credit":
      return <CreditCard className="h-5 w-5 text-indigo-600" />;
    case "savings":
      return <PiggyBank className="h-5 w-5 text-teal-600" />;
    case "cash":
      return <Banknote className="h-5 w-5 text-amber-600" />;
    default:
      return <Building2 className="h-5 w-5 text-emerald-600" />;
  }
}

type FormState = {
  name: string;
  type: AccountType;
  balance: string;
  last4: string;
};

const emptyForm: FormState = {
  name: "",
  type: "checking",
  balance: "0",
  last4: "",
};

export default function AccountsPage() {
  const accounts = useAccounts();
  const { addAccount, updateAccount, deleteAccount } = useFinanceMutations();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);

  const total = useMemo(() => totalBalances(accounts), [accounts]);
  const sorted = useMemo(
    () =>
      [...accounts].sort((a, b) => {
        const order: AccountType[] = ["checking", "savings", "credit", "cash"];
        const byType = order.indexOf(a.type) - order.indexOf(b.type);
        if (byType !== 0) return byType;
        return a.name.localeCompare(b.name);
      }),
    [accounts],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (account: Account) => {
    setEditing(account);
    setForm({
      name: account.name,
      type: account.type,
      balance: String(account.balance),
      last4: account.last4 ?? "",
    });
    setError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Account name is required");
      return;
    }
    const balance = parseFloat(form.balance);
    if (Number.isNaN(balance)) {
      setError("Enter a valid balance");
      return;
    }
    if (form.last4 && !/^\d{0,4}$/.test(form.last4)) {
      setError("Last 4 must be digits only");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateAccount(editing.id, {
          name: form.name.trim(),
          type: form.type,
          balance,
          last4: form.last4.trim() || null,
        });
      } else {
        await addAccount({
          name: form.name.trim(),
          type: form.type,
          balance,
          last4: form.last4.trim() || undefined,
        });
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MobileShell
      title="Accounts"
      showBack
      headerExtra={
        <button onClick={openCreate} className="rounded-full p-1 hover:bg-white/10">
          <Plus className="h-5 w-5" />
        </button>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total of all balances</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {formatCurrency(total)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Sum of every account (credit balances included as entered)
            </p>
          </CardContent>
        </Card>

        {error && !showForm && (
          <p className="text-sm text-red-600 px-1">{error}</p>
        )}

        <div className="space-y-2">
          {sorted.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-gray-500">
                No accounts yet. Add your bank and credit card accounts to track
                balances.
              </CardContent>
            </Card>
          ) : (
            sorted.map((account) => (
              <Card key={account.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${account.color}18` }}
                  >
                    {typeIcon(account.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{accountLabel(account)}</p>
                    <p className="text-xs text-gray-500 capitalize">{account.type}</p>
                  </div>
                  <p
                    className={cn(
                      "font-semibold tabular-nums",
                      account.type === "credit" ? "text-indigo-700" : "text-gray-900",
                    )}
                  >
                    {formatCurrency(account.balance)}
                  </p>
                  <button
                    type="button"
                    onClick={() => openEdit(account)}
                    className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    aria-label={`Edit ${account.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setDeleteTarget(account);
                    }}
                    className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${account.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Button onClick={openCreate} variant="outline" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add account
        </Button>
      </div>

      <Sheet
        open={showForm}
        onClose={() => !saving && setShowForm(false)}
        title={editing ? "Edit account" : "Add account"}
      >
        <div className="space-y-4">
          <Input
            label="Account name*"
            placeholder="Chase Checking"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Last 4 digits"
            placeholder="1234"
            inputMode="numeric"
            maxLength={4}
            value={form.last4}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                last4: e.target.value.replace(/\D/g, "").slice(0, 4),
              }))
            }
          />
          <Input
            label="Current balance*"
            type="number"
            placeholder="0.00"
            value={form.balance}
            onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
          />
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500 px-1">Type</p>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                  className={cn(
                    "rounded-xl border py-2.5 text-sm font-medium",
                    form.type === t.value
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-gray-200 text-gray-700",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add account"}
          </Button>
        </div>
      </Sheet>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete account?"
      >
        <p className="text-sm text-gray-600 mb-4">
          {deleteTarget
            ? `Remove ${accountLabel(deleteTarget)}? Accounts with transactions cannot be deleted.`
            : null}
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
