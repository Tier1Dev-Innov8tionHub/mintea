"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  useAccounts,
  useFinanceMutations,
  useViewer,
} from "@/lib/db/hooks";
import { accountLabel, totalBalances } from "@/lib/calculations";
import { purposeLabel } from "@/lib/account-view";
import { formatCurrency } from "@/lib/format";
import type {
  Account,
  AccountPurpose,
  AccountType,
  AccountVisibility,
} from "@/lib/db/schema";
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

/** Display sections — checking + cash share "Cash" like Rocket Money. */
const SECTIONS: Array<{
  key: string;
  label: string;
  types: AccountType[];
  defaultType: AccountType;
}> = [
  { key: "cash", label: "Cash", types: ["checking", "cash"], defaultType: "checking" },
  { key: "credit", label: "Credit", types: ["credit"], defaultType: "credit" },
  { key: "savings", label: "Savings", types: ["savings"], defaultType: "savings" },
  {
    key: "investment",
    label: "Investments",
    types: ["investment"],
    defaultType: "investment",
  },
];

const ACCOUNT_TYPES: Array<{ value: AccountType; label: string }> = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit", label: "Credit card" },
  { value: "cash", label: "Cash" },
  { value: "investment", label: "Investment" },
];

const PURPOSES: Array<{ value: AccountPurpose; label: string; hint: string }> = [
  { value: "personal", label: "Personal", hint: "Private by default" },
  { value: "joint", label: "Joint", hint: "Always shared" },
  { value: "business", label: "Business", hint: "Always shared" },
];

function typeIcon(type: AccountType) {
  switch (type) {
    case "credit":
      return <CreditCard className="h-5 w-5 text-indigo-600" />;
    case "savings":
      return <PiggyBank className="h-5 w-5 text-teal-600" />;
    case "cash":
      return <Banknote className="h-5 w-5 text-amber-600" />;
    case "investment":
      return <Building2 className="h-5 w-5 text-violet-600" />;
    default:
      return <Building2 className="h-5 w-5 text-emerald-600" />;
  }
}

function AccountBadges({
  account,
  userId,
}: {
  account: Account;
  userId: string | undefined;
}) {
  const isMine = userId !== undefined && account.ownerId === userId;
  const showShared =
    account.visibility === "shared" && userId !== undefined && !isMine;

  return (
    <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
      <span className="text-xs capitalize text-gray-500">{account.type}</span>
      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600">
        {purposeLabel(account.purpose)}
      </span>
      {account.purpose === "personal" && account.visibility === "private" && (
        <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
          Private
        </span>
      )}
      {showShared && (
        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
          Shared
        </span>
      )}
    </span>
  );
}

type FormState = {
  name: string;
  type: AccountType;
  balance: string;
  last4: string;
  purpose: AccountPurpose;
  visibility: AccountVisibility;
};

const emptyForm: FormState = {
  name: "",
  type: "checking",
  balance: "0",
  last4: "",
  purpose: "personal",
  visibility: "private",
};

function InlineBalance({
  account,
  onSave,
  onError,
}: {
  account: Account;
  onSave: (balance: number) => Promise<void>;
  onError?: (message: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const editing = draft !== null;
  const value = draft ?? String(account.balance);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = async () => {
    if (draft === null) return;
    const parsed = parseFloat(draft);
    if (Number.isNaN(parsed) || parsed === account.balance) {
      setDraft(null);
      setSaveFailed(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(parsed);
      setDraft(null);
      setSaveFailed(false);
    } catch (err) {
      // Keep the draft so the user can retry; surface the failure.
      setSaveFailed(true);
      onError?.(
        err instanceof Error ? err.message : "Failed to update balance",
      );
      inputRef.current?.focus();
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step="0.01"
        disabled={saving}
        value={value}
        onChange={(e) => {
          setSaveFailed(false);
          setDraft(e.target.value);
        }}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void commit();
          }
          if (e.key === "Escape") {
            setDraft(null);
            setSaveFailed(false);
          }
        }}
        className={cn(
          "w-28 rounded-lg border bg-white px-2 py-1 text-right text-sm font-semibold tabular-nums focus:outline-none focus:ring-2",
          saveFailed
            ? "border-red-500 focus:ring-red-500"
            : "border-emerald-500 focus:ring-emerald-500",
        )}
        aria-invalid={saveFailed}
        aria-label={`Edit balance for ${account.name}`}
      />
    );
  }

  return (
    <button
      type="button"
      data-sensitive
      onClick={() => setDraft(String(account.balance))}
      className={cn(
        "rounded-lg px-2 py-1 font-semibold tabular-nums hover:bg-gray-100",
        account.type === "credit" ? "text-indigo-700" : "text-gray-900",
      )}
      title="Tap to edit balance"
    >
      {formatCurrency(account.balance)}
    </button>
  );
}

export default function AccountsPage() {
  const accounts = useAccounts();
  const viewer = useViewer();
  const userId = viewer?.userId;
  const { addAccount, updateAccount, deleteAccount } = useFinanceMutations();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);

  const total = useMemo(() => totalBalances(accounts), [accounts]);

  const sections = useMemo(() => {
    return SECTIONS.map((section) => {
      const items = accounts
        .filter((a) => section.types.includes(a.type))
        .sort((a, b) => a.name.localeCompare(b.name));
      const sectionTotal = items.reduce((sum, a) => sum + a.balance, 0);
      return { ...section, items, sectionTotal };
    });
  }, [accounts]);

  const openCreate = (type: AccountType = "checking") => {
    setEditing(null);
    setForm({ ...emptyForm, type });
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
      purpose: account.purpose,
      visibility: account.visibility,
    });
    setError(null);
    setShowForm(true);
  };

  const setPurpose = (purpose: AccountPurpose) => {
    setForm((f) => ({
      ...f,
      purpose,
      visibility: purpose === "personal" ? f.visibility : "shared",
    }));
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

    const visibility: AccountVisibility =
      form.purpose === "personal" ? form.visibility : "shared";

    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateAccount(editing.id, {
          name: form.name.trim(),
          type: form.type,
          balance,
          last4: form.last4.trim() || null,
          purpose: form.purpose,
          visibility,
        });
      } else {
        await addAccount({
          name: form.name.trim(),
          type: form.type,
          balance,
          last4: form.last4.trim() || undefined,
          purpose: form.purpose,
          visibility,
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

  const canEditSharing =
    !editing || (userId !== undefined && editing.ownerId === userId);

  return (
    <MobileShell
      title="Accounts"
      showBack
      headerExtra={
        <button
          onClick={() => openCreate()}
          className="rounded-full p-1 hover:bg-white/10"
          aria-label="Add account"
        >
          <Plus className="h-5 w-5" />
        </button>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total of balances you can see</p>
            <p data-sensitive className="text-3xl font-bold text-gray-900 mt-1">
              {formatCurrency(total)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Your partner&apos;s private personal accounts aren&apos;t shown.
              Tap any amount to update.
            </p>
          </CardContent>
        </Card>

        {error && !showForm && (
          <p className="text-sm text-red-600 px-1">{error}</p>
        )}

        {accounts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-gray-500">
              No accounts yet. Add personal, joint, or business accounts — personal
              stays private unless you share it.
            </CardContent>
          </Card>
        ) : (
          sections.map((section) => (
            <div key={section.key}>
              <div className="mb-2 flex items-center justify-between px-1">
                <div>
                  <p className="text-xs font-semibold tracking-wider text-gray-500">
                    {section.label.toUpperCase()}
                  </p>
                  {section.items.length > 0 && (
                    <p data-sensitive className="text-xs text-gray-400 tabular-nums">
                      {formatCurrency(section.sectionTotal)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => openCreate(section.defaultType)}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>

              {section.items.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center text-sm text-gray-400">
                    No {section.label.toLowerCase()} accounts
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="divide-y divide-gray-100 p-0">
                    {section.items.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${account.color}18` }}
                        >
                          {typeIcon(account.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">
                            {accountLabel(account)}
                          </p>
                          <AccountBadges account={account} userId={userId} />
                        </div>
                        <InlineBalance
                          account={account}
                          onSave={async (balance) => {
                            setError(null);
                            await updateAccount(account.id, { balance });
                          }}
                          onError={(message) => setError(message)}
                        />
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
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          ))
        )}

        <Button
          onClick={() => openCreate()}
          variant="outline"
          className="w-full gap-2"
        >
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
            onChange={(e) =>
              setForm((f) => ({ ...f, balance: e.target.value }))
            }
          />
          <div>
            <p className="mb-2 px-1 text-xs font-medium text-gray-500">Type</p>
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
          <div>
            <p className="mb-2 px-1 text-xs font-medium text-gray-500">
              Purpose
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PURPOSES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  disabled={!canEditSharing}
                  onClick={() => setPurpose(p.value)}
                  className={cn(
                    "rounded-xl border px-2 py-2.5 text-center disabled:opacity-50",
                    form.purpose === p.value
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-gray-200 text-gray-700",
                  )}
                >
                  <span className="block text-sm font-medium">{p.label}</span>
                  <span className="mt-0.5 block text-[10px] text-gray-500">
                    {p.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {form.purpose === "personal" && (
            <label
              className={cn(
                "flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3",
                !canEditSharing && "opacity-50",
              )}
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Share with partner
                </p>
                <p className="text-xs text-gray-500">
                  They can see this account and its transactions
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                checked={form.visibility === "shared"}
                disabled={!canEditSharing}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    visibility: e.target.checked ? "shared" : "private",
                  }))
                }
              />
            </label>
          )}
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
        <p className="mb-4 text-sm text-gray-600">
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
