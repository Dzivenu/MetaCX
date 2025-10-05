import { defineTable } from "convex/server";
import { v } from "convex/values";

// Org float snapshots for tracking balance changes
export const org_float_snapshots = defineTable({
  // Organization references
  clerkOrganizationId: v.string(), // Clerk organization ID (legacy)
  clerk_org_id: v.string(), // Required Clerk organization ID
  org_id: v.id("organizations"), // Required Convex organization ID

  orgSessionId: v.optional(v.id("org_cx_sessions")),
  userId: v.optional(v.id("users")),
  status: v.string(),
  sourceModelType: v.optional(v.string()),
  sourceModelId: v.optional(v.string()),
  inboundOrgRepositoryId: v.optional(v.id("org_repositories")),
  outboundOrgRepositoryId: v.optional(v.id("org_repositories")),
  inboundTicker: v.optional(v.string()),
  outboundTicker: v.optional(v.string()),
  inboundSum: v.optional(v.string()), // decimal as string
  outboundSum: v.optional(v.string()), // decimal as string
  inboundBalanceBefore: v.optional(v.string()), // decimal as string
  inboundBalanceAfter: v.optional(v.string()), // decimal as string
  outboundBalanceBefore: v.optional(v.string()), // decimal as string
  outboundBalanceAfter: v.optional(v.string()), // decimal as string
  floatStacksData: v.optional(v.array(v.any())), // default []

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),

  // Creator
  createdBy: v.id("users"),
})
  .index("by_clerk_organization", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_org_id", ["org_id"])
  .index("by_org_session", ["orgSessionId"])
  .index("by_status", ["status"])
  .index("by_source_model", ["sourceModelType", "sourceModelId"])
  .index("by_user", ["userId"]);
