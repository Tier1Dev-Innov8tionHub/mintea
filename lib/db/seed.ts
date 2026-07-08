import { v4 as uuidv4 } from "uuid";
import { subDays, subMonths, format } from "date-fns";
import { db } from "./index";
import type { Account, Budget, Category, Goal, Recurring, Settings, Transaction } from "./schema";
import { getMonthKey } from "../format";

const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Dining & Drinks", icon: "utensils", color: "#3B82F6", group: "spending" },
  { name: "Groceries", icon: "shopping-cart", color: "#10B981", group: "spending" },
  { name: "Shopping", icon: "shopping-bag", color: "#8B5CF6", group: "spending" },
  { name: "Transportation", icon: "car", color: "#F59E0B", group: "spending" },
  { name: "Entertainment", icon: "film", color: "#EC4899", group: "spending" },
  { name: "Health", icon: "heart-pulse", color: "#EF4444", group: "spending" },
  { name: "Bills & Utilities", icon: "home", color: "#6366F1", group: "bills" },
  { name: "Subscriptions", icon: "repeat", color: "#14B8A6", group: "bills" },
  { name: "Salary", icon: "briefcase", color: "#059669", group: "income" },
  { name: "Freelance", icon: "laptop", color: "#0D9488", group: "income" },
  { name: "Savings Transfer", icon: "piggy-bank", color: "#059669", group: "savings" },
  { name: "Transfer", icon: "arrow-left-right", color: "#9CA3AF", group: "spending" },
];

export async function isDatabaseSeeded(): Promise<boolean> {
  const count = await db.accounts.count();
  return count > 0;
}

export async function seedDatabase(): Promise<void> {
  if (await isDatabaseSeeded()) return;

  const checkingId = uuidv4();
  const savingsId = uuidv4();
  const creditId = uuidv4();

  const accounts: Account[] = [
    { id: checkingId, name: "Checking", type: "checking", balance: 5848, color: "#059669" },
    { id: savingsId, name: "Savings", type: "savings", balance: 11714, color: "#0D9488" },
    { id: creditId, name: "Credit Card", type: "credit", balance: 934, color: "#6366F1" },
  ];

  const categories: Category[] = DEFAULT_CATEGORIES.map((c) => ({
    ...c,
    id: uuidv4(),
  }));

  const catMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));
  const monthKey = getMonthKey();
  const prevMonth = getMonthKey(subMonths(new Date(), 1));

  const budgets: Budget[] = [
    { id: uuidv4(), categoryId: catMap["Dining & Drinks"], amount: 697, month: monthKey },
    { id: uuidv4(), categoryId: catMap["Groceries"], amount: 450, month: monthKey },
    { id: uuidv4(), categoryId: catMap["Shopping"], amount: 300, month: monthKey },
    { id: uuidv4(), categoryId: catMap["Transportation"], amount: 200, month: monthKey },
    { id: uuidv4(), categoryId: catMap["Entertainment"], amount: 150, month: monthKey },
    { id: uuidv4(), categoryId: catMap["Bills & Utilities"], amount: 345, month: monthKey },
    { id: uuidv4(), categoryId: catMap["Dining & Drinks"], amount: 650, month: prevMonth },
    { id: uuidv4(), categoryId: catMap["Groceries"], amount: 420, month: prevMonth },
  ];

  const goals: Goal[] = [
    {
      id: uuidv4(),
      name: "Emergency Fund",
      icon: "umbrella",
      targetAmount: 5000,
      currentAmount: 3200,
      status: "active",
    },
    {
      id: uuidv4(),
      name: "Vacation",
      icon: "palmtree",
      targetAmount: 3000,
      currentAmount: 1166,
      status: "active",
      deadline: "2026-12-01",
    },
    {
      id: uuidv4(),
      name: "New Laptop",
      icon: "laptop",
      targetAmount: 1500,
      currentAmount: 450,
      status: "paused",
    },
  ];

  const recurring: Recurring[] = [
    {
      id: uuidv4(),
      name: "Spotify",
      amount: 21.31,
      frequency: "monthly",
      nextDate: format(subDays(new Date(), -17), "yyyy-MM-dd"),
      categoryId: catMap["Subscriptions"],
      active: true,
    },
    {
      id: uuidv4(),
      name: "Chase Credit Card",
      amount: 300,
      frequency: "monthly",
      nextDate: format(subDays(new Date(), -25), "yyyy-MM-dd"),
      categoryId: catMap["Bills & Utilities"],
      active: true,
    },
    {
      id: uuidv4(),
      name: "Netflix",
      amount: 15.99,
      frequency: "monthly",
      nextDate: format(subDays(new Date(), -12), "yyyy-MM-dd"),
      categoryId: catMap["Subscriptions"],
      active: true,
    },
    {
      id: uuidv4(),
      name: "Rent",
      amount: 1450,
      frequency: "monthly",
      nextDate: format(subDays(new Date(), -5), "yyyy-MM-dd"),
      categoryId: catMap["Bills & Utilities"],
      active: true,
    },
  ];

  const today = new Date();
  const transactions: Transaction[] = [
    { id: uuidv4(), accountId: checkingId, type: "income", amount: 4250, categoryId: catMap["Salary"], description: "Paycheck", date: format(subDays(today, 3), "yyyy-MM-dd"), isIgnored: false },
    { id: uuidv4(), accountId: checkingId, type: "expense", amount: 87.42, categoryId: catMap["Groceries"], description: "Whole Foods", date: format(subDays(today, 1), "yyyy-MM-dd"), isIgnored: false },
    { id: uuidv4(), accountId: checkingId, type: "expense", amount: 42.50, categoryId: catMap["Dining & Drinks"], description: "Blue Bottle Coffee", date: format(subDays(today, 1), "yyyy-MM-dd"), isIgnored: false },
    { id: uuidv4(), accountId: checkingId, type: "expense", amount: 156.00, categoryId: catMap["Shopping"], description: "Amazon", date: format(subDays(today, 2), "yyyy-MM-dd"), isIgnored: false },
    { id: uuidv4(), accountId: checkingId, type: "expense", amount: 14.04, categoryId: null, description: "Butler", date: format(subDays(today, 5), "yyyy-MM-dd"), isIgnored: false },
    { id: uuidv4(), accountId: checkingId, type: "expense", amount: 45.00, categoryId: catMap["Transportation"], description: "Uber", date: format(subDays(today, 4), "yyyy-MM-dd"), isIgnored: false },
    { id: uuidv4(), accountId: checkingId, type: "expense", amount: 21.31, categoryId: catMap["Subscriptions"], description: "Spotify", date: format(subDays(today, 7), "yyyy-MM-dd"), isIgnored: false },
    { id: uuidv4(), accountId: checkingId, type: "expense", amount: 125.00, categoryId: catMap["Dining & Drinks"], description: "Nobu", date: format(subDays(today, 8), "yyyy-MM-dd"), isIgnored: false },
    { id: uuidv4(), accountId: checkingId, type: "expense", amount: 68.30, categoryId: catMap["Groceries"], description: "Trader Joe's", date: format(subDays(today, 10), "yyyy-MM-dd"), isIgnored: false },
    { id: uuidv4(), accountId: checkingId, type: "expense", amount: 200.00, categoryId: catMap["Entertainment"], description: "Concert Tickets", date: format(subDays(today, 12), "yyyy-MM-dd"), isIgnored: false },
    { id: uuidv4(), accountId: checkingId, type: "transfer", amount: 500, categoryId: catMap["Savings Transfer"], description: "Transfer to Savings", date: format(subDays(today, 3), "yyyy-MM-dd"), isIgnored: false },
    { id: uuidv4(), accountId: checkingId, type: "income", amount: 850, categoryId: catMap["Freelance"], description: "Freelance Project", date: format(subDays(today, 15), "yyyy-MM-dd"), isIgnored: false },
    { id: uuidv4(), accountId: checkingId, type: "expense", amount: 1450, categoryId: catMap["Bills & Utilities"], description: "Rent Payment", date: format(subDays(today, 5), "yyyy-MM-dd"), isIgnored: false },
    { id: uuidv4(), accountId: checkingId, type: "expense", amount: 89.99, categoryId: catMap["Health"], description: "Gym Membership", date: format(subDays(today, 6), "yyyy-MM-dd"), isIgnored: false },
    { id: uuidv4(), accountId: checkingId, type: "expense", amount: 302, categoryId: catMap["Transfer"], description: "Ignored Transfer", date: format(subDays(today, 9), "yyyy-MM-dd"), isIgnored: true },
  ];

  // Add more historical transactions for charts
  for (let i = 20; i < 45; i++) {
    transactions.push({
      id: uuidv4(),
      accountId: checkingId,
      type: "expense",
      amount: Math.round(20 + Math.random() * 80),
      categoryId: categories[Math.floor(Math.random() * 6)].id,
      description: ["Target", "Starbucks", "CVS", "Shell Gas", "Chipotle"][Math.floor(Math.random() * 5)],
      date: format(subDays(today, i), "yyyy-MM-dd"),
      isIgnored: false,
    });
  }

  const settings: Settings = {
    id: "default",
    displayName: "",
    monthlyBudget: 3500,
    currency: "USD",
    onboardingComplete: false,
    lastSynced: new Date().toISOString(),
  };

  await db.transaction("rw", [db.accounts, db.categories, db.budgets, db.goals, db.recurring, db.transactions, db.settings], async () => {
    await db.accounts.bulkAdd(accounts);
    await db.categories.bulkAdd(categories);
    await db.budgets.bulkAdd(budgets);
    await db.goals.bulkAdd(goals);
    await db.recurring.bulkAdd(recurring);
    await db.transactions.bulkAdd(transactions);
    await db.settings.put(settings);
  });
}

export async function clearAllData(): Promise<void> {
  await db.transaction("rw", [db.accounts, db.categories, db.budgets, db.goals, db.recurring, db.transactions, db.settings], async () => {
    await db.accounts.clear();
    await db.categories.clear();
    await db.budgets.clear();
    await db.goals.clear();
    await db.recurring.clear();
    await db.transactions.clear();
    await db.settings.clear();
  });
}

export async function getSettings(): Promise<Settings> {
  const settings = await db.settings.get("default");
  if (settings) return settings;
  const defaultSettings: Settings = {
    id: "default",
    displayName: "",
    monthlyBudget: 3500,
    currency: "USD",
    onboardingComplete: false,
    lastSynced: new Date().toISOString(),
  };
  await db.settings.put(defaultSettings);
  return defaultSettings;
}

export async function updateSettings(updates: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...updates });
}

export async function touchSync(): Promise<void> {
  await updateSettings({ lastSynced: new Date().toISOString() });
}
