import Dexie, { type EntityTable } from "dexie";
import type {
  Account,
  Budget,
  Category,
  Goal,
  Recurring,
  Settings,
  Transaction,
} from "./schema";

export class MinteaDB extends Dexie {
  accounts!: EntityTable<Account, "id">;
  transactions!: EntityTable<Transaction, "id">;
  categories!: EntityTable<Category, "id">;
  budgets!: EntityTable<Budget, "id">;
  goals!: EntityTable<Goal, "id">;
  recurring!: EntityTable<Recurring, "id">;
  settings!: EntityTable<Settings, "id">;

  constructor() {
    super("mintea");
    this.version(1).stores({
      accounts: "id, type",
      transactions: "id, accountId, type, categoryId, date, recurringId",
      categories: "id, group",
      budgets: "id, categoryId, month",
      goals: "id, status",
      recurring: "id, nextDate, active",
      settings: "id",
    });
  }
}

export const db = new MinteaDB();
