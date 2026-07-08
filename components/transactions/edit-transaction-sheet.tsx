"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories, useFinanceMutations } from "@/lib/db/hooks";
import { CategoryIcon } from "@/components/icons/category-icon";
import type { Transaction } from "@/lib/db/schema";

function EditTransactionForm({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const categories = useCategories();
  const { updateTransaction, deleteTransaction } = useFinanceMutations();
  const [amount, setAmount] = useState(String(transaction.amount));
  const [description, setDescription] = useState(transaction.description);
  const [categoryId, setCategoryId] = useState<string | null>(transaction.categoryId);

  const handleSave = async () => {
    await updateTransaction(transaction.id, {
      amount: parseFloat(amount),
      description,
      categoryId,
    });
    onClose();
  };

  const handleDelete = async () => {
    await deleteTransaction(transaction.id);
    onClose();
  };

  return (
    <div className="space-y-4">
      <Input
        label="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500 px-1">Category</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
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
      <Button onClick={handleSave} className="w-full">
        Save Changes
      </Button>
      <Button onClick={handleDelete} variant="destructive" className="w-full">
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
    <Sheet open={open} onClose={onClose} title="Edit Transaction">
      <EditTransactionForm
        key={transaction.id}
        transaction={transaction}
        onClose={onClose}
      />
    </Sheet>
  );
}
