"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Goal, Recurring, Settings, Transaction } from "./schema";
import { useEffect, useState } from "react";

export function useDbInit() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : "skip");
  const ensureHousehold = useMutation(api.seed.ensureHousehold);
  const [error, setError] = useState<string | null>(null);

  const needsHousehold =
    Boolean(isAuthenticated) && viewer !== undefined && !viewer?.householdId;
  const hasHousehold = Boolean(viewer?.householdId);

  useEffect(() => {
    if (!needsHousehold) return;

    let cancelled = false;
    void (async () => {
      try {
        await ensureHousehold({});
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to initialize household",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [needsHousehold, ensureHousehold]);

  return {
    ready: Boolean(isAuthenticated && hasHousehold && !error),
    isLoading:
      isLoading ||
      (Boolean(isAuthenticated) && viewer === undefined) ||
      needsHousehold,
    error,
    isAuthenticated,
  };
}

export function useAccounts() {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.accounts.list, isAuthenticated ? {} : "skip") ?? [];
}

export function useTransactions() {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.transactions.list, isAuthenticated ? {} : "skip") ?? [];
}

export function useCategories() {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.categories.list, isAuthenticated ? {} : "skip") ?? [];
}

export function useBudgets() {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.budgets.list, isAuthenticated ? {} : "skip") ?? [];
}

export function useGoals() {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.goals.list, isAuthenticated ? {} : "skip") ?? [];
}

export function useRecurring() {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.recurring.list, isAuthenticated ? {} : "skip") ?? [];
}

export function useSettings() {
  const { isAuthenticated } = useConvexAuth();
  const settings = useQuery(api.settings.get, isAuthenticated ? {} : "skip");
  return {
    settings: (settings ?? null) as Settings | null,
    refresh: async () => undefined,
  };
}

export function useFinanceMutations() {
  const createTransaction = useMutation(api.transactions.create);
  const updateTransactionMut = useMutation(api.transactions.update);
  const removeTransaction = useMutation(api.transactions.remove);
  const createGoal = useMutation(api.goals.create);
  const updateGoalMut = useMutation(api.goals.update);
  const depositGoal = useMutation(api.goals.deposit);
  const createRecurring = useMutation(api.recurring.create);
  const updateRecurringMut = useMutation(api.recurring.update);
  const updateBudgetMut = useMutation(api.budgets.updateAmount);
  const upsertBudgetMut = useMutation(api.budgets.upsert);
  const updateSettingsMut = useMutation(api.settings.update);
  const resetDemo = useMutation(api.seed.resetDemoData);
  const touch = useMutation(api.seed.touchLastSynced);

  return {
    addTransaction: async (data: Omit<Transaction, "id">) => {
      await createTransaction({
        accountId: data.accountId as Id<"accounts">,
        type: data.type,
        amount: data.amount,
        categoryId: (data.categoryId as Id<"categories"> | null) ?? null,
        description: data.description,
        date: data.date,
        isIgnored: data.isIgnored,
        recurringId: data.recurringId as Id<"recurring"> | undefined,
      });
    },
    updateTransaction: async (id: string, data: Partial<Transaction>) => {
      await updateTransactionMut({
        id: id as Id<"transactions">,
        accountId: data.accountId as Id<"accounts"> | undefined,
        type: data.type,
        amount: data.amount,
        categoryId:
          data.categoryId === undefined
            ? undefined
            : ((data.categoryId as Id<"categories"> | null) ?? null),
        description: data.description,
        date: data.date,
        isIgnored: data.isIgnored,
      });
    },
    deleteTransaction: async (id: string) => {
      await removeTransaction({ id: id as Id<"transactions"> });
    },
    addGoal: async (data: Omit<Goal, "id">) => {
      await createGoal(data);
    },
    updateGoal: async (id: string, data: Partial<Goal>) => {
      await updateGoalMut({
        id: id as Id<"goals">,
        name: data.name,
        icon: data.icon,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount,
        status: data.status,
        deadline: data.deadline,
      });
    },
    depositToGoal: async (goalId: string, amount: number) => {
      await depositGoal({ goalId: goalId as Id<"goals">, amount });
    },
    addRecurring: async (data: Omit<Recurring, "id">) => {
      await createRecurring({
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        nextDate: data.nextDate,
        categoryId: data.categoryId as Id<"categories">,
        active: data.active,
      });
    },
    updateRecurring: async (id: string, data: Partial<Recurring>) => {
      await updateRecurringMut({
        id: id as Id<"recurring">,
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        nextDate: data.nextDate,
        categoryId: data.categoryId as Id<"categories"> | undefined,
        active: data.active,
      });
    },
    updateBudget: async (id: string, amount: number) => {
      await updateBudgetMut({ id: id as Id<"budgets">, amount });
    },
    upsertBudget: async (categoryId: string, month: string, amount: number) => {
      await upsertBudgetMut({
        categoryId: categoryId as Id<"categories">,
        month,
        amount,
      });
    },
    updateSettings: async (updates: Partial<Settings>) => {
      await updateSettingsMut({
        displayName: updates.displayName,
        monthlyBudget: updates.monthlyBudget,
        currency: updates.currency,
        onboardingComplete: updates.onboardingComplete,
      });
    },
    clearAndReseed: async () => {
      await resetDemo({});
    },
    touchSync: async () => {
      await touch({});
    },
  };
}
