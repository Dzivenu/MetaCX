import { defineTable } from "convex/server";
import { v } from "convex/values";

// Org float stacks for tracking currency amounts in repositories
export const org_float_stacks = defineTable({
  // Organization references
  clerkOrganizationId: v.string(), // Clerk organization ID (legacy)
  clerk_org_id: v.string(), // Required Clerk organization ID
  org_id: v.id("organizations"), // Required Convex organization ID

  orgSessionId: v.id("org_cx_sessions"),
  orgRepositoryId: v.id("org_repositories"),
  orgDenominationId: v.id("org_denominations"),

  // Float counts
  openCount: v.optional(v.number()), // default 0.0
  closeCount: v.optional(v.number()), // default 0.0
  middayCount: v.optional(v.number()), // default 0.0
  lastSessionCount: v.optional(v.number()), // default 0.0

  // Confirmation timestamps
  openConfirmedDt: v.optional(v.number()),
  closeConfirmedDt: v.optional(v.number()),

  // Session tracking
  spentDuringSession: v.optional(v.string()), // decimal as string, default "0.0"
  transferredDuringSession: v.optional(v.number()), // default 0.0

  // Value and pricing
  denominatedValue: v.optional(v.number()), // default 0.0
  ticker: v.string(),
  averageSpot: v.optional(v.number()), // default 0.0
  openSpot: v.optional(v.number()), // default 0.0
  closeSpot: v.optional(v.number()), // default 0.0

  // Previous session reference
  previousSessionFloatStackId: v.optional(v.string()),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),

  // Creator
  createdBy: v.id("users"),
})
  .index("by_clerk_organization", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_org_id", ["org_id"])
  .index("by_org_denomination", ["orgDenominationId"])
  .index("by_org_repository", ["orgRepositoryId"])
  .index("by_org_session", ["orgSessionId"])
  .index("by_ticker", ["ticker"]);
