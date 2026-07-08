/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as budgets from "../budgets.js";
import type * as categories from "../categories.js";
import type * as goals from "../goals.js";
import type * as http from "../http.js";
import type * as lib_allowlist from "../lib/allowlist.js";
import type * as lib_household from "../lib/household.js";
import type * as lib_validators from "../lib/validators.js";
import type * as recurring from "../recurring.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  budgets: typeof budgets;
  categories: typeof categories;
  goals: typeof goals;
  http: typeof http;
  "lib/allowlist": typeof lib_allowlist;
  "lib/household": typeof lib_household;
  "lib/validators": typeof lib_validators;
  recurring: typeof recurring;
  seed: typeof seed;
  settings: typeof settings;
  transactions: typeof transactions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
