"use client";

import { useState, useMemo } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { TransactionRow } from "@/components/dashboard/cards";
import { CategoryIcon } from "@/components/icons/category-icon";
import { AddTransactionSheet } from "@/components/transactions/add-transaction-sheet";
import { EditTransactionSheet } from "@/components/transactions/edit-transaction-sheet";
import { useTransactions, useCategories } from "@/lib/db/hooks";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { format, parseISO } from "date-fns";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import type { Transaction, TransactionType } from "@/lib/db/schema";

type FilterType = "all" | TransactionType;
type DateFilter = "this-month" | "last-month" | "all";

export default function TransactionsPage() {
  const transactions = useTransactions();
  const categories = useCategories();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("this-month");

  const filtered = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return transactions.filter((tx) => {
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType !== "all" && tx.type !== filterType) return false;
      if (dateFilter !== "all") {
        const d = parseISO(tx.date);
        if (dateFilter === "this-month") {
          if (d.getMonth() !== thisMonth || d.getFullYear() !== thisYear) return false;
        } else {
          const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
          const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;
          if (d.getMonth() !== lastMonth || d.getFullYear() !== lastYear) return false;
        }
      }
      return true;
    });
  }, [transactions, search, filterType, dateFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    for (const tx of filtered) {
      const key = format(parseISO(tx.date), "MMMM d, yyyy");
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    }
    return groups;
  }, [filtered]);

  const getCategory = (id: string | null) => categories.find((c) => c.id === id);

  return (
    <MobileShell title="Transactions">
      <div className="space-y-4">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl bg-white border border-gray-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => setShowFilter(true)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-gray-200 hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* Grouped list */}
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date}>
            <p className="text-xs font-semibold text-gray-500 mb-2">{date}</p>
            <Card>
              <CardContent className="p-4">
                {txs.map((tx) => {
                  const cat = getCategory(tx.categoryId);
                  return (
                    <TransactionRow
                      key={tx.id}
                      description={tx.description}
                      date={formatShortDate(tx.date)}
                      amount={tx.amount}
                      type={tx.type}
                      onClick={() => setEditTx(tx)}
                      icon={
                        cat ? (
                          <CategoryIcon icon={cat.icon} color={cat.color} />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <span className="text-blue-500">?</span>
                          </div>
                        )
                      }
                    />
                  );
                })}
              </CardContent>
            </Card>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No transactions found</p>
          </div>
        )}

        <Button onClick={() => setShowAdd(true)} className="w-full gap-2" variant="mint">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <AddTransactionSheet open={showAdd} onClose={() => setShowAdd(false)} />
      <EditTransactionSheet
        open={!!editTx}
        onClose={() => setEditTx(null)}
        transaction={editTx}
      />

      <Sheet open={showFilter} onClose={() => setShowFilter(false)} title="Filter & Sort">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-3">Transaction Type</p>
            <div className="flex gap-2 flex-wrap">
              {(["all", "expense", "income", "transfer"] as FilterType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`rounded-full px-4 py-2 text-sm capitalize border ${
                    filterType === t ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-3">Date Range</p>
            <div className="flex gap-2 flex-wrap">
              {(["this-month", "last-month", "all"] as DateFilter[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDateFilter(d)}
                  className={`rounded-full px-4 py-2 text-sm border capitalize ${
                    dateFilter === d ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200"
                  }`}
                >
                  {d.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={() => setShowFilter(false)} className="w-full">Apply</Button>
          <button
            onClick={() => { setFilterType("all"); setDateFilter("this-month"); }}
            className="w-full text-center text-sm underline text-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </Sheet>
    </MobileShell>
  );
}
