"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories, useAccounts, useFinanceMutations } from "@/lib/db/hooks";
import { CategoryIcon } from "@/components/icons/category-icon";
import type { TransactionType } from "@/lib/db/schema";
import { format } from "date-fns";

interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

export function AddTransactionSheet({ open, onClose, defaultType = "expense" }: AddTransactionSheetProps) {
  const categories = useCategories();
  const accounts = useAccounts();
  const { addTransaction } = useFinanceMutations();
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const selectedAccountId = accountId ?? accounts[0]?.id ?? "";

  const filteredCategories = categories.filter((c) => {
    if (type === "income") return c.group === "income";
    if (type === "transfer") return c.group === "savings";
    return c.group === "spending" || c.group === "bills";
  });

  const handleSave = async () => {
    if (!amount || !selectedAccountId) return;
    await addTransaction({
      accountId: selectedAccountId,
      type,
      amount: parseFloat(amount),
      categoryId,
      description: description || "Transaction",
      date,
      isIgnored: false,
    });
    setAmount("");
    setDescription("");
    setCategoryId(null);
    setAccountId(null);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add Transaction">
      <div className="space-y-4">
        <div className="flex gap-2">
          {(["expense", "income", "transfer"] as TransactionType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 rounded-full py-2 text-sm font-medium capitalize transition-colors ${
                type === t ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <Input
          label="Amount*"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input
          label="Description"
          placeholder="What was this for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 px-1">Category</p>
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border transition-colors ${
                  categoryId === cat.id
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <CategoryIcon icon={cat.icon} color={cat.color} size={14} />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 px-1">Account</p>
          <select
            value={selectedAccountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <Button onClick={handleSave} className="w-full" disabled={!amount}>
          Save Transaction
        </Button>
      </div>
    </Sheet>
  );
}
