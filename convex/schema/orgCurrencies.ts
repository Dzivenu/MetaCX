import { defineTable } from "convex/server";
import { v } from "convex/values";

// Organization-specific currencies table
export const org_currencies = defineTable({
  // Basic currency info
  name: v.optional(v.string()),
  ticker: v.optional(v.string()),
  rate: v.optional(v.number()), // default 1.0

  // Margins
  buyMarginMax: v.optional(v.number()), // default 1.0
  sellMarginMax: v.optional(v.number()), // default 1.0
  sellMarginMin: v.optional(v.number()),
  buyMarginMin: v.optional(v.number()),
  sellMarginTarget: v.optional(v.string()), // decimal as string, default "0.0"
  buyMarginTarget: v.optional(v.string()), // decimal as string, default "0.0"
  sellMarginAtm: v.optional(v.number()),
  buyMarginAtm: v.optional(v.number()),

  // Trading settings
  tradeable: v.optional(v.boolean()),

  // Display settings
  sign: v.optional(v.string()),
  photo: v.optional(v.string()),
  icon: v.optional(v.string()),
  hexColor: v.optional(v.string()), // default "#D3D3D3"

  // Type and categorization
  typeOf: v.optional(v.string()),

  // Float system settings
  floatDisplayOrder: v.optional(v.number()), // default 0
  fxReservePool: v.optional(v.number()), // default 0.0
  fxReserveWeight: v.optional(v.number()), // default 0.0
  fxReserveHardcostPool: v.optional(v.number()), // default 0.0
  floatThresholdBottom: v.optional(v.number()), // default 0.0
  floatThresholdTop: v.optional(v.number()), // default 0.0
  floatTargetPercent: v.optional(v.number()), // default 0.0
  floatTargetInBaseCurrency: v.optional(v.number()), // default 0.0
  floatThresholdElasticity: v.optional(v.number()), // default 0.01

  // Display weights
  displayWeightWeb: v.optional(v.string()), // decimal as string, default "0.0"
  displayWeightFloat: v.optional(v.string()), // decimal as string, default "0.0"

  // Currency properties
  isBaseCurrency: v.optional(v.boolean()), // default false
  source: v.optional(v.string()),

  // Pricing
  spread: v.optional(v.number()), // default 1.0
  offset: v.optional(v.number()), // default 1.0
  offsetPremium: v.optional(v.number()), // default 0.0
  weBuy: v.optional(v.number()), // default 1.0
  weSell: v.optional(v.number()), // default 1.0

  // Organization references
  clerkOrganizationId: v.string(), // Clerk organization ID (legacy)
  clerk_org_id: v.string(), // Required Clerk organization ID
  org_id: v.id("organizations"), // Required Convex organization ID

  // Decimal places for formatting
  rateDecimalPlaces: v.optional(v.number()), // default 2
  amountDecimalPlaces: v.optional(v.number()), // default 2

  // API settings
  rateApi: v.optional(v.string()), // default ""
  api: v.optional(v.number()), // default 0
  rateApiIdentifier: v.string(),
  rateUpdatedAt: v.number(),

  // Network/blockchain settings
  network: v.optional(v.string()),
  chainId: v.optional(v.string()),
  symbol: v.optional(v.string()),
  contract: v.optional(v.string()),
  underlying: v.optional(v.string()),

  // Advertising settings
  advertisable: v.optional(v.boolean()), // default true
  buyAdvertisable: v.optional(v.boolean()), // default true
  sellAdvertisable: v.optional(v.boolean()), // default true

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  updateAt: v.optional(v.number()), // Legacy field from original schema

  // Creator
  createdBy: v.id("users"),
})
  .index("by_clerk_organization", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_org_id", ["org_id"])
  .index("by_ticker", ["ticker"])
  .index("by_name", ["name"])
  .index("by_typeof", ["typeOf"])
  .index("by_base_currency", ["isBaseCurrency"])
  .index("by_float_display_order", ["floatDisplayOrder"])
  .index("by_tradeable", ["tradeable"])
  .index("by_advertisable", ["advertisable"]);
