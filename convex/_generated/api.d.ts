/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as actions_currencies from "../actions/currencies.js";
import type * as actions_organizations from "../actions/organizations.js";
import type * as functions_appCurrencies from "../functions/appCurrencies.js";
import type * as functions_auth from "../functions/auth.js";
import type * as functions_database from "../functions/database.js";
import type * as functions_orgAddresses from "../functions/orgAddresses.js";
import type * as functions_orgBreakdowns from "../functions/orgBreakdowns.js";
import type * as functions_orgCurrencies from "../functions/orgCurrencies.js";
import type * as functions_orgCustomers from "../functions/orgCustomers.js";
import type * as functions_orgCxSessions from "../functions/orgCxSessions.js";
import type * as functions_orgFloat from "../functions/orgFloat.js";
import type * as functions_orgIdentifications from "../functions/orgIdentifications.js";
import type * as functions_orgMemberships from "../functions/orgMemberships.js";
import type * as functions_orgOrders from "../functions/orgOrders.js";
import type * as functions_organizations from "../functions/organizations.js";
import type * as functions_repositories from "../functions/repositories.js";
import type * as functions_users from "../functions/users.js";
import type * as schema_appCurrencies from "../schema/appCurrencies.js";
import type * as schema_cxsessions from "../schema/cxsessions.js";
import type * as schema_orgActivities from "../schema/orgActivities.js";
import type * as schema_orgAddresses from "../schema/orgAddresses.js";
import type * as schema_orgBreakdowns from "../schema/orgBreakdowns.js";
import type * as schema_orgContacts from "../schema/orgContacts.js";
import type * as schema_orgCurrencies from "../schema/orgCurrencies.js";
import type * as schema_orgCustomers from "../schema/orgCustomers.js";
import type * as schema_orgCxSessions from "../schema/orgCxSessions.js";
import type * as schema_orgDenominations from "../schema/orgDenominations.js";
import type * as schema_orgFloatSnapshots from "../schema/orgFloatSnapshots.js";
import type * as schema_orgFloatStacks from "../schema/orgFloatStacks.js";
import type * as schema_orgFloatTransfers from "../schema/orgFloatTransfers.js";
import type * as schema_orgIdentifications from "../schema/orgIdentifications.js";
import type * as schema_orgMemberships from "../schema/orgMemberships.js";
import type * as schema_orgOrders from "../schema/orgOrders.js";
import type * as schema_orgRepositories from "../schema/orgRepositories.js";
import type * as schema_orgRepositoryAccessLogs from "../schema/orgRepositoryAccessLogs.js";
import type * as schema_organizations from "../schema/organizations.js";
import type * as schema_userPreferences from "../schema/userPreferences.js";
import type * as schema_users from "../schema/users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "actions/currencies": typeof actions_currencies;
  "actions/organizations": typeof actions_organizations;
  "functions/appCurrencies": typeof functions_appCurrencies;
  "functions/auth": typeof functions_auth;
  "functions/database": typeof functions_database;
  "functions/orgAddresses": typeof functions_orgAddresses;
  "functions/orgBreakdowns": typeof functions_orgBreakdowns;
  "functions/orgCurrencies": typeof functions_orgCurrencies;
  "functions/orgCustomers": typeof functions_orgCustomers;
  "functions/orgCxSessions": typeof functions_orgCxSessions;
  "functions/orgFloat": typeof functions_orgFloat;
  "functions/orgIdentifications": typeof functions_orgIdentifications;
  "functions/orgMemberships": typeof functions_orgMemberships;
  "functions/orgOrders": typeof functions_orgOrders;
  "functions/organizations": typeof functions_organizations;
  "functions/repositories": typeof functions_repositories;
  "functions/users": typeof functions_users;
  "schema/appCurrencies": typeof schema_appCurrencies;
  "schema/cxsessions": typeof schema_cxsessions;
  "schema/orgActivities": typeof schema_orgActivities;
  "schema/orgAddresses": typeof schema_orgAddresses;
  "schema/orgBreakdowns": typeof schema_orgBreakdowns;
  "schema/orgContacts": typeof schema_orgContacts;
  "schema/orgCurrencies": typeof schema_orgCurrencies;
  "schema/orgCustomers": typeof schema_orgCustomers;
  "schema/orgCxSessions": typeof schema_orgCxSessions;
  "schema/orgDenominations": typeof schema_orgDenominations;
  "schema/orgFloatSnapshots": typeof schema_orgFloatSnapshots;
  "schema/orgFloatStacks": typeof schema_orgFloatStacks;
  "schema/orgFloatTransfers": typeof schema_orgFloatTransfers;
  "schema/orgIdentifications": typeof schema_orgIdentifications;
  "schema/orgMemberships": typeof schema_orgMemberships;
  "schema/orgOrders": typeof schema_orgOrders;
  "schema/orgRepositories": typeof schema_orgRepositories;
  "schema/orgRepositoryAccessLogs": typeof schema_orgRepositoryAccessLogs;
  "schema/organizations": typeof schema_organizations;
  "schema/userPreferences": typeof schema_userPreferences;
  "schema/users": typeof schema_users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
