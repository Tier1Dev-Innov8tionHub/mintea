"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./index";
import { seedDatabase, getSettings, touchSync } from "./seed";
import { useEffect, useState } from "react";

export function useDbInit() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDatabase().then(() => setReady(true));
  }, []);

  return ready;
}

export function useAccounts() {
  return useLiveQuery(() => db.accounts.toArray(), []) ?? [];
}

export function useTransactions() {
  return useLiveQuery(() => db.transactions.orderBy("date").reverse().toArray(), []) ?? [];
}

export function useCategories() {
  return useLiveQuery(() => db.categories.toArray(), []) ?? [];
}

export function useBudgets() {
  return useLiveQuery(() => db.budgets.toArray(), []) ?? [];
}

export function useGoals() {
  return useLiveQuery(() => db.goals.toArray(), []) ?? [];
}

export function useRecurring() {
  return useLiveQuery(() => db.recurring.toArray(), []) ?? [];
}

export function useSettings() {
  const [settings, setSettings] = useState<Awaited<ReturnType<typeof getSettings>> | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const refresh = () => getSettings().then(setSettings);

  return { settings, refresh };
}

export async function addTransaction(data: Omit<import("./schema").Transaction, "id">) {
  const { v4: uuidv4 } = await import("uuid");
  await db.transactions.add({ ...data, id: uuidv4() });
  await touchSync();
}

export async function updateTransaction(id: string, data: Partial<import("./schema").Transaction>) {
  await db.transactions.update(id, data);
  await touchSync();
}

export async function deleteTransaction(id: string) {
  await db.transactions.delete(id);
  await touchSync();
}

export async function addGoal(data: Omit<import("./schema").Goal, "id">) {
  const { v4: uuidv4 } = await import("uuid");
  await db.goals.add({ ...data, id: uuidv4() });
  await touchSync();
}

export async function updateGoal(id: string, data: Partial<import("./schema").Goal>) {
  await db.goals.update(id, data);
  await touchSync();
}

export async function depositToGoal(goalId: string, amount: number) {
  const goal = await db.goals.get(goalId);
  if (goal) {
    await db.goals.update(goalId, { currentAmount: goal.currentAmount + amount });
    await touchSync();
  }
}

export async function addRecurring(data: Omit<import("./schema").Recurring, "id">) {
  const { v4: uuidv4 } = await import("uuid");
  await db.recurring.add({ ...data, id: uuidv4() });
  await touchSync();
}

export async function updateRecurring(id: string, data: Partial<import("./schema").Recurring>) {
  await db.recurring.update(id, data);
  await touchSync();
}

export async function updateBudget(id: string, amount: number) {
  await db.budgets.update(id, { amount });
  await touchSync();
}

export async function upsertBudget(categoryId: string, month: string, amount: number) {
  const existing = await db.budgets.where({ categoryId, month }).first();
  if (existing) {
    await db.budgets.update(existing.id, { amount });
  } else {
    const { v4: uuidv4 } = await import("uuid");
    await db.budgets.add({ id: uuidv4(), categoryId, month, amount });
  }
  await touchSync();
}
