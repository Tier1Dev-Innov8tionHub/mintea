"use client";

import { useState, useEffect } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateTransaction, deleteTransaction, useCategories } from "@/lib/db/hooks";
import { CategoryIcon } from "@/components/icons/category-icon";
import type { Transaction } from "@/lib/db/schema";

export function EditTransactionSheet({
  open,
  onClose,
  transaction,
}: {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}) {
  const categories = useCategories();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setAmount(String(transaction.amount));
      setDescription(transaction.description);
      setCategoryId(transaction.categoryId);
    }
  }, [transaction]);

  if (!transaction) return null;

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
    <Sheet open={open} onClose={onClose} title="Edit Transaction">
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
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border ${
                  categoryId === cat.id ? "border-emerald-600 bg-emerald-50" : "border-gray-200"
                }`}
              >
                <CategoryIcon icon={cat.icon} color={cat.color} size={14} />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={handleSave} className="w-full">Save Changes</Button>
        <Button onClick={handleDelete} variant="destructive" className="w-full">Delete</Button>
      </div>
    </Sheet>
  );
}
