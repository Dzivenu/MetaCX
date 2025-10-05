import { defineTable } from "convex/server";
import { v } from "convex/values";

// Org Orders table for trading transactions
export const org_orders = defineTable({
  // Core money fields
  inboundSum: v.optional(v.string()), // decimal as string
  inboundTicker: v.optional(v.string()),
  inboundType: v.optional(v.string()),
  outboundSum: v.optional(v.string()), // decimal as string
  outboundTicker: v.optional(v.string()),
  outboundType: v.optional(v.string()),

  // Pricing
  fxRate: v.optional(v.number()),
  rateWoFees: v.optional(v.number()),
  finalRate: v.optional(v.number()),
  finalRateWithoutFees: v.optional(v.number()),
  margin: v.optional(v.number()),
  fee: v.optional(v.number()),
  networkFee: v.optional(v.number()), // default 0

  // Status: QUOTE | ACCEPTED | CONFIRMED | COMPLETED | CANCELLED | SCHEDULED | BLOCKED
  status: v.optional(v.string()),

  // Organization references
  clerkOrganizationId: v.string(), // Clerk organization ID (legacy)
  clerk_org_id: v.string(), // Required Clerk organization ID
  org_id: v.id("organizations"), // Required Convex organization ID

  // Relations
  orgSessionId: v.optional(v.id("org_cx_sessions")),
  userId: v.optional(v.id("users")),
  orgCustomerId: v.optional(v.id("org_customers")),
  inboundOrgRepositoryId: v.optional(v.id("org_repositories")),
  outboundOrgRepositoryId: v.optional(v.id("org_repositories")),

  // Meta timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  openDt: v.optional(v.number()),
  closeDt: v.optional(v.number()),

  // Optional fields for compatibility
  btcFeeRate: v.optional(v.string()),
  quoteSource: v.optional(v.string()),
  quoteSourceUserId: v.optional(v.string()),
  batchedStatus: v.optional(v.number()), // 0 never_batched, 1 scheduled, 2 sent

  // Creator
  createdBy: v.id("users"),
})
  .index("by_clerk_organization", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_org_id", ["org_id"])
  .index("by_org_session", ["orgSessionId"])
  .index("by_status", ["status"])
  .index("by_inbound_sum", ["inboundSum"])
  .index("by_outbound_sum", ["outboundSum"])
  .index("by_user", ["userId"])
  .index("by_org_customer", ["orgCustomerId"])
  .index("by_inbound_org_repository", ["inboundOrgRepositoryId"])
  .index("by_outbound_org_repository", ["outboundOrgRepositoryId"]);
