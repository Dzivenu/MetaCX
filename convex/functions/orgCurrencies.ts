import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Get org currencies for the user's active organization
export const getOrgCurrencies = query({
  args: { clerkOrganizationId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get organization ID from JWT or args
    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) {
      return []; // No active organization
    }

    // Get org currencies for the organization
    const orgCurrencies = await ctx.db
      .query("org_currencies")
      .withIndex("by_clerk_organization", (q) =>
        q.eq("clerkOrganizationId", orgId)
      )
      .collect();

    // Sort by display order, then by ticker
    return orgCurrencies.sort((a, b) => {
      const orderA = a.floatDisplayOrder || 999;
      const orderB = b.floatDisplayOrder || 999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return (a.ticker || "").localeCompare(b.ticker || "");
    });
  },
});

// Get org currency by ID
export const getOrgCurrencyById = query({
  args: { currencyId: v.id("org_currencies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get currency
    const currency = await ctx.db.get(args.currencyId);
    if (!currency) {
      throw new Error("Org currency not found");
    }

    // Verify user has access to this organization
    const userOrgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    if (!userOrgId || currency.clerkOrganizationId !== userOrgId) {
      throw new Error(
        "Unauthorized: Org currency belongs to a different organization"
      );
    }

    return currency;
  },
});

// Create new org currency
export const createOrgCurrency = mutation({
  args: {
    name: v.optional(v.string()),
    ticker: v.optional(v.string()),
    rate: v.optional(v.number()),
    buyMarginMax: v.optional(v.number()),
    sellMarginMax: v.optional(v.number()),
    tradeable: v.optional(v.boolean()),
    typeOf: v.optional(v.string()),
    floatDisplayOrder: v.optional(v.number()),
    isBaseCurrency: v.optional(v.boolean()),
    hexColor: v.optional(v.string()),
    rateApiIdentifier: v.string(),
    clerkOrganizationId: v.optional(v.string()),
    denominations: v.optional(v.array(v.object({ value: v.number() }))),
    repositories: v.optional(v.array(v.id("org_repositories"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get organization ID from JWT or args
    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) {
      throw new Error("No active organization selected");
    }

    // Check if ticker is unique within the organization (if provided)
    if (args.ticker) {
      const existingCurrency = await ctx.db
        .query("org_currencies")
        .withIndex("by_clerk_organization", (q) =>
          q.eq("clerkOrganizationId", orgId)
        )
        .filter((q) => q.eq(q.field("ticker"), args.ticker))
        .first();

      if (existingCurrency) {
        throw new Error(
          "Org currency ticker already exists in this organization"
        );
      }
    }

    // If setting as base currency, ensure no other base currency exists
    if (args.isBaseCurrency) {
      const existingBaseCurrency = await ctx.db
        .query("org_currencies")
        .withIndex("by_clerk_organization", (q) =>
          q.eq("clerkOrganizationId", orgId)
        )
        .filter((q) => q.eq(q.field("isBaseCurrency"), true))
        .first();

      if (existingBaseCurrency) {
        // Remove base currency flag from existing one
        await ctx.db.patch(existingBaseCurrency._id, {
          isBaseCurrency: false,
          updatedAt: Date.now(),
        });
      }
    }

    // Get Convex organization record
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_id", (q) => q.eq("clerkOrganizationId", orgId))
      .first();
    if (!organization) {
      throw new Error("Organization not found in database");
    }

    const now = Date.now();

    // Create org currency
    const currencyId = await ctx.db.insert("org_currencies", {
      name: args.name,
      ticker: args.ticker,
      rate: args.rate || 1.0,
      buyMarginMax: args.buyMarginMax || 1.0,
      sellMarginMax: args.sellMarginMax || 1.0,
      tradeable: args.tradeable,
      typeOf: args.typeOf,
      floatDisplayOrder: args.floatDisplayOrder || 0,
      isBaseCurrency: args.isBaseCurrency || false,
      hexColor: args.hexColor || "#D3D3D3",
      rateApiIdentifier: args.rateApiIdentifier,
      rateUpdatedAt: now,
      clerkOrganizationId: orgId,
      clerk_org_id: orgId,
      org_id: organization._id,
      createdAt: now,
      updatedAt: now,
      createdBy: user._id,
    });

    // Create org denominations if provided
    if (args.denominations && args.denominations.length > 0) {
      for (const denomination of args.denominations) {
        await ctx.db.insert("org_denominations", {
          name: undefined,
          value: denomination.value,
          orgCurrencyId: currencyId,
          accepted: true,
          clerkOrganizationId: orgId,
          clerk_org_id: orgId,
          org_id: organization._id,
          createdAt: now,
          updatedAt: now,
          createdBy: user._id,
        });
      }
    }

    // Add currency ticker to selected repositories if provided
    if (args.repositories && args.repositories.length > 0 && args.ticker) {
      for (const repositoryId of args.repositories) {
        const repository = await ctx.db.get(repositoryId);
        if (repository) {
          const currentTickers = (repository as any).currencyTickers || [];
          if (!currentTickers.includes(args.ticker)) {
            await ctx.db.patch(repositoryId, {
              currencyTickers: [...currentTickers, args.ticker],
              updatedAt: now,
            });
          }
        }
      }
    }

    return currencyId;
  },
});

// Update org currency
export const updateOrgCurrency = mutation({
  args: {
    currencyId: v.id("org_currencies"),
    name: v.optional(v.string()),
    ticker: v.optional(v.string()),
    rate: v.optional(v.number()),
    buyMarginMax: v.optional(v.number()),
    sellMarginMax: v.optional(v.number()),
    tradeable: v.optional(v.boolean()),
    typeOf: v.optional(v.string()),
    floatDisplayOrder: v.optional(v.number()),
    isBaseCurrency: v.optional(v.boolean()),
    hexColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    // Get currency
    const currency = await ctx.db.get(args.currencyId);
    if (!currency) {
      throw new Error("Org currency not found");
    }

    // Get user's organization context - try multiple approaches
    let userOrgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;

    // If no org ID from identity, try to get from user's organization memberships
    if (!userOrgId) {
      const membership = await ctx.db
        .query("org_memberships")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (membership) {
        userOrgId = membership.clerkOrganizationId;
      }
    }

    console.log("🔍 Update currency authorization check:", {
      userOrgId,
      currencyOrgId: currency.clerkOrganizationId,
      identityOrgId: identity.org_id,
      currencyId: args.currencyId,
      userId: user._id,
    });

    // More flexible organization check - allow if user's org matches currency's org
    const hasAccess =
      userOrgId &&
      (currency.clerkOrganizationId === userOrgId ||
        currency.clerk_org_id === userOrgId);

    if (!hasAccess) {
      throw new Error(
        `Unauthorized: Org currency belongs to a different organization. User org: ${userOrgId}, Currency org: ${currency.clerkOrganizationId}`
      );
    }

    // If updating ticker, check for uniqueness
    if (args.ticker && args.ticker !== currency.ticker) {
      const existingCurrency = await ctx.db
        .query("org_currencies")
        .withIndex("by_clerk_organization", (q) =>
          q.eq("clerkOrganizationId", currency.clerkOrganizationId)
        )
        .filter((q) => q.eq(q.field("ticker"), args.ticker))
        .first();

      if (existingCurrency) {
        throw new Error(
          "Org currency ticker already exists in this organization"
        );
      }
    }

    // If setting as base currency, ensure no other base currency exists
    if (args.isBaseCurrency && !currency.isBaseCurrency) {
      const existingBaseCurrency = await ctx.db
        .query("org_currencies")
        .withIndex("by_clerk_organization", (q) =>
          q.eq("clerkOrganizationId", currency.clerkOrganizationId)
        )
        .filter((q) => q.eq(q.field("isBaseCurrency"), true))
        .first();

      if (existingBaseCurrency) {
        // Remove base currency flag from existing one
        await ctx.db.patch(existingBaseCurrency._id, {
          isBaseCurrency: false,
          updatedAt: Date.now(),
        });
      }
    }

    // Update currency
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.ticker !== undefined) updateData.ticker = args.ticker;
    if (args.rate !== undefined) updateData.rate = args.rate;
    if (args.buyMarginMax !== undefined)
      updateData.buyMarginMax = args.buyMarginMax;
    if (args.sellMarginMax !== undefined)
      updateData.sellMarginMax = args.sellMarginMax;
    if (args.tradeable !== undefined) updateData.tradeable = args.tradeable;
    if (args.typeOf !== undefined) updateData.typeOf = args.typeOf;
    if (args.floatDisplayOrder !== undefined)
      updateData.floatDisplayOrder = args.floatDisplayOrder;
    if (args.isBaseCurrency !== undefined)
      updateData.isBaseCurrency = args.isBaseCurrency;
    if (args.hexColor !== undefined) updateData.hexColor = args.hexColor;

    await ctx.db.patch(args.currencyId, updateData);
    return true;
  },
});

// Delete org currency
export const deleteOrgCurrency = mutation({
  args: {
    currencyId: v.id("org_currencies"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get currency
    const currency = await ctx.db.get(args.currencyId);
    if (!currency) {
      throw new Error("Org currency not found");
    }

    // Verify user has access to this organization
    const userOrgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    if (!userOrgId || currency.clerkOrganizationId !== userOrgId) {
      throw new Error(
        "Unauthorized: Org currency belongs to a different organization"
      );
    }

    // Delete org currency
    await ctx.db.delete(args.currencyId);
    return true;
  },
});

// Get org denominations for an org currency
export const getOrgDenominations = query({
  args: { orgCurrencyId: v.id("org_currencies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const results = await ctx.db
      .query("org_denominations")
      .withIndex("by_org_currency", (q) =>
        q.eq("orgCurrencyId", args.orgCurrencyId)
      )
      .collect();

    return results.sort((a, b) => (a.value || 0) - (b.value || 0));
  },
});

// Update a single org denomination's accepted flag
export const updateOrgDenomination = mutation({
  args: {
    denominationId: v.id("org_denominations"),
    accepted: v.optional(v.boolean()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const denom = await ctx.db.get(args.denominationId);
    if (!denom) {
      throw new Error("Org denomination not found");
    }

    await ctx.db.patch(args.denominationId, {
      accepted: args.accepted,
      name: args.name,
      updatedAt: Date.now(),
    });
    return true;
  },
});

// Reorder org currencies
export const reorderOrgCurrencies = mutation({
  args: {
    orderedCurrencyIds: v.array(v.id("org_currencies")),
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) {
      throw new Error("No active organization");
    }

    for (let i = 0; i < args.orderedCurrencyIds.length; i++) {
      const currencyId = args.orderedCurrencyIds[i];
      const currency = await ctx.db.get(currencyId);
      if (currency && (currency as any).clerkOrganizationId === orgId) {
        await ctx.db.patch(currencyId, {
          floatDisplayOrder: i + 1,
          updatedAt: Date.now(),
        });
      }
    }

    return true;
  },
});
