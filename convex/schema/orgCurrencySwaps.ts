import { defineTable } from "convex/server";
import { v } from "convex/values";

export const org_currency_swaps = defineTable({
  clerkOrganizationId: v.string(),
  clerk_org_id: v.string(),
  org_id: v.id("organizations"),

  orgSessionId: v.id("org_cx_sessions"),
  userId: v.id("users"),
  orgCurrencyId: v.id("org_currencies"),
  inboundOrgRepositoryId: v.id("org_repositories"),
  outboundOrgRepositoryId: v.id("org_repositories"),
  inboundTicker: v.string(),
  outboundTicker: v.string(),
  inboundSum: v.string(),
  outboundSum: v.string(),
  swapValue: v.string(),
  status: v.optional(v.string()),

  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.id("users"),
})
  .index("by_clerk_organization", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_org_id", ["org_id"])
  .index("by_org_session", ["orgSessionId"])
  .index("by_org_currency", ["orgCurrencyId"])
  .index("by_inbound_org_repository", ["inboundOrgRepositoryId"])
  .index("by_outbound_org_repository", ["outboundOrgRepositoryId"])
  .index("by_status", ["status"])
  .index("by_user", ["userId"]);
