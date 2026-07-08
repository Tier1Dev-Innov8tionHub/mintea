export type AccountType = "checking" | "savings" | "credit" | "cash";
export type TransactionType = "income" | "expense" | "transfer";
export type CategoryGroup = "spending" | "income" | "bills" | "savings";
export type GoalStatus = "active" | "paused";
export type RecurringFrequency = "weekly" | "monthly" | "yearly";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  last4?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  group: CategoryGroup;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  description: string;
  date: string;
  isIgnored: boolean;
  recurringId?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: string;
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  status: GoalStatus;
  deadline?: string;
}

export interface Recurring {
  id: string;
  name: string;
  amount: number;
  frequency: RecurringFrequency;
  nextDate: string;
  categoryId: string;
  active: boolean;
}

export interface Settings {
  id: string;
  displayName: string;
  monthlyBudget: number;
  currency: string;
  onboardingComplete: boolean;
  lastSynced: string;
}
