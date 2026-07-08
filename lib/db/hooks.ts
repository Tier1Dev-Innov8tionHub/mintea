"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type {
  Account,
  BalanceSnapshot,
  Goal,
  Recurring,
  Settings,
  Transaction,
} from "./schema";
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
      !error &&
      (isLoading ||
        (Boolean(isAuthenticated) && viewer === undefined) ||
        needsHousehold),
    error,
    isAuthenticated,
  };
}

export function useViewer() {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.users.viewer, isAuthenticated ? {} : "skip");
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

export function useBalanceSnapshots() {
  const { isAuthenticated } = useConvexAuth();
  return (
    useQuery(api.balanceSnapshots.list, isAuthenticated ? {} : "skip") ??
    ([] as BalanceSnapshot[])
  );
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
  const removeRecurringMut = useMutation(api.recurring.remove);
  const advanceOverdueMut = useMutation(api.recurring.advanceOverdue);
  const markPaidMut = useMutation(api.recurring.markPaid);
  const createAccount = useMutation(api.accounts.create);
  const updateAccountMut = useMutation(api.accounts.update);
  const removeAccountMut = useMutation(api.accounts.remove);
  const updateBudgetMut = useMutation(api.budgets.updateAmount);
  const upsertBudgetMut = useMutation(api.budgets.upsert);
  const updateSettingsMut = useMutation(api.settings.update);
  const clearHousehold = useMutation(api.seed.clearHousehold);
  const touch = useMutation(api.seed.touchLastSynced);
  const captureSnapshot = useMutation(api.balanceSnapshots.capture);

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
        notes: data.notes,
        isPending: data.isPending,
        recurringId: data.recurringId as Id<"recurring"> | undefined,
      });
    },
    updateTransaction: async (
      id: string,
      data: {
        accountId?: string;
        type?: Transaction["type"];
        amount?: number;
        categoryId?: string | null;
        description?: string;
        date?: string;
        isIgnored?: boolean;
        notes?: string | null;
        isPending?: boolean;
      },
    ) => {
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
        notes: data.notes,
        isPending: data.isPending,
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
        accountId: data.accountId as Id<"accounts"> | undefined,
        active: data.active,
      });
    },
    updateRecurring: async (
      id: string,
      data: {
        name?: string;
        amount?: number;
        frequency?: Recurring["frequency"];
        nextDate?: string;
        categoryId?: string;
        accountId?: string | null;
        active?: boolean;
      },
    ) => {
      await updateRecurringMut({
        id: id as Id<"recurring">,
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        nextDate: data.nextDate,
        categoryId: data.categoryId as Id<"categories"> | undefined,
        accountId:
          data.accountId === undefined
            ? undefined
            : data.accountId === null
              ? null
              : (data.accountId as Id<"accounts">),
        active: data.active,
      });
    },
    captureBalanceSnapshot: async () => {
      await captureSnapshot({});
    },
    deleteRecurring: async (id: string) => {
      await removeRecurringMut({ id: id as Id<"recurring"> });
    },
    advanceOverdueRecurring: async () => {
      return await advanceOverdueMut({});
    },
    markRecurringPaid: async (id: string) => {
      return await markPaidMut({ id: id as Id<"recurring"> });
    },
    addAccount: async (
      data: Omit<Account, "id" | "color" | "ownerId"> & { color?: string },
    ) => {
      await createAccount({
        name: data.name,
        type: data.type,
        balance: data.balance,
        color: data.color,
        last4: data.last4,
        purpose: data.purpose,
        visibility: data.visibility,
      });
    },
    updateAccount: async (
      id: string,
      data: {
        name?: string;
        type?: Account["type"];
        balance?: number;
        color?: string;
        last4?: string | null;
        purpose?: Account["purpose"];
        visibility?: Account["visibility"];
      },
    ) => {
      await updateAccountMut({
        id: id as Id<"accounts">,
        name: data.name,
        type: data.type,
        balance: data.balance,
        color: data.color,
        last4: data.last4,
        purpose: data.purpose,
        visibility: data.visibility,
      });
    },
    deleteAccount: async (id: string) => {
      await removeAccountMut({ id: id as Id<"accounts"> });
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
    clearHousehold: async () => {
      await clearHousehold({});
    },
    touchSync: async () => {
      await touch({});
    },
  };
}
