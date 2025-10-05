import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Get currencies for the user's active organization (from Clerk)
export const getCurrencies = query({
  args: { clerkOrganizationId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) {
      return []; // No active organization
    }

    // For backward compatibility, return empty - manage tab now uses orgCurrencies
    return [];
  },
});

// Get currency by ID
export const getCurrencyById = query({
  args: { currencyId: v.id("currencies") },
  handler: async (ctx, args) => {
    throw new Error("Deprecated - use orgCurrencies.getOrgCurrencyById");
  },
});

// Create a new currency
export const createCurrency = mutation({
  args: {
    clerkOrganizationId: v.optional(v.string()),
    currency: v.object({
      ticker: v.string(),
      name: v.string(),
      typeOf: v.optional(v.string()),
      typeof: v.optional(v.string()),
      floatDisplayOrder: v.optional(v.number()),
      isBaseCurrency: v.optional(v.boolean()),
      api: v.optional(v.number()),
      sign: v.optional(v.string()),
      decimals: v.optional(v.number()),
      description: v.optional(v.string()),
      rate: v.optional(v.number()),
      rateApi: v.optional(v.string()),
      rateApiIdentifier: v.optional(v.string()),
      icon: v.optional(v.string()),
      network: v.optional(v.string()),
      contract: v.optional(v.string()),
      chainId: v.optional(v.string()),
    }),
    denominations: v.array(v.object({ value: v.number() })),
    repositories: v.array(v.id("org_repositories")),
  },
  handler: async (ctx, args) => {
    throw new Error("Deprecated - use orgCurrencies.createOrgCurrency");
  },
});

// Update an existing currency
export const updateCurrency = mutation({
  args: {
    currencyId: v.id("currencies"),
    updates: v.object({
      ticker: v.optional(v.string()),
      name: v.optional(v.string()),
      typeOf: v.optional(v.string()),
      active: v.optional(v.boolean()),
      floatDisplayOrder: v.optional(v.number()),
      isBaseCurrency: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    throw new Error("Deprecated - use orgCurrencies.updateOrgCurrency");
  },
});

// Delete a currency
export const deleteCurrency = mutation({
  args: {
    currencyId: v.id("currencies"),
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    throw new Error("Deprecated - use orgCurrencies.deleteOrgCurrency");
  },
});

// Reorder currencies
export const reorderCurrencies = mutation({
  args: {
    orderedCurrencyIds: v.array(v.id("currencies")),
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    throw new Error("Deprecated - use orgCurrencies.reorderOrgCurrencies");
  },
});

// Get denominations for a currency
export const getDenominations = query({
  args: { currencyId: v.id("currencies") },
  handler: async () => {
    throw new Error("Deprecated - use orgCurrencies.getOrgDenominations");
  },
});

// Get all app currencies (global currency rates)
export const getAppCurrencies = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get all app currencies and sort them by type, then by ticker
    const appCurrencies = await ctx.db.query("app_currencies").collect();

    return appCurrencies.sort((a, b) => {
      // First sort by type priority
      const typeOrder = { FIAT: 1, CRYPTOCURRENCY: 2, METAL: 3 };
      const typeA = typeOrder[a.type] || 4;
      const typeB = typeOrder[b.type] || 4;

      if (typeA !== typeB) {
        return typeA - typeB;
      }
      return a.ticker.localeCompare(b.ticker);
    });
  },
});

// Helper mutation to update or create an app currency
export const upsertAppCurrency = mutation({
  args: {
    ticker: v.string(),
    name: v.string(),
    baseRateTicker: v.string(),
    type: v.union(
      v.literal("CRYPTOCURRENCY"),
      v.literal("FIAT"),
      v.literal("METAL")
    ),
    rate: v.number(),
    rateUpdatedAt: v.number(),
    network: v.optional(v.string()),
    contract: v.optional(v.string()),
    chainId: v.optional(v.string()),
    rateApi: v.optional(v.string()),
    rateApiIdentifier: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if currency already exists
    const existingCurrency = await ctx.db
      .query("app_currencies")
      .withIndex("by_ticker", (q) => q.eq("ticker", args.ticker))
      .first();

    if (existingCurrency) {
      // Update existing currency
      await ctx.db.patch(existingCurrency._id, {
        name: args.name,
        rate: args.rate,
        rate_updated_at: args.rateUpdatedAt,
        base_rate_ticker: args.baseRateTicker,
        type: args.type,
        network: args.network,
        contract: args.contract,
        chain_id: args.chainId,
        rate_api: args.rateApi,
        rate_api_identifier: args.rateApiIdentifier,
        icon: args.icon,
      });
    } else {
      // Insert new currency
      await ctx.db.insert("app_currencies", {
        name: args.name,
        ticker: args.ticker,
        base_rate_ticker: args.baseRateTicker,
        type: args.type,
        rate: args.rate,
        rate_updated_at: args.rateUpdatedAt,
        network: args.network,
        contract: args.contract,
        chain_id: args.chainId,
        rate_api: args.rateApi,
        rate_api_identifier: args.rateApiIdentifier,
        icon: args.icon,
      });
    }
  },
});
