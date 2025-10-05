import { defineTable } from "convex/server";
import { v } from "convex/values";

// Legacy CX Sessions table
export const cxsessions = defineTable({
  // User and organization
  userId: v.optional(v.id("users")),
  clerkOrganizationId: v.string(),

  // Session state
  state: v.optional(v.string()), // "open", "pending_open", "closed", etc.
  role: v.optional(v.string()),

  // User assignments
  verifiedBy: v.optional(v.string()),
  verifiedByUserId: v.optional(v.id("users")),
  openStartUserId: v.optional(v.id("users")),
  openConfirmUserId: v.optional(v.id("users")),
  closeStartUserId: v.optional(v.id("users")),
  closeConfirmUserId: v.optional(v.id("users")),

  // Date fields
  verifiedDt: v.optional(v.number()),
  openStartDt: v.optional(v.number()),
  openConfirmDt: v.optional(v.number()),
  closeStartDt: v.optional(v.number()),
  closeConfirmDt: v.optional(v.number()),

  // Report flags
  fintracReportGenerated: v.optional(v.boolean()),
  sessionReportGenerated: v.optional(v.boolean()),
  sessionCurrencyReportGenerated: v.optional(v.boolean()),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_organization_and_state", ["clerkOrganizationId", "state"])
  .index("by_clerk_organization", ["clerkOrganizationId"])
  .index("by_state", ["state"])
  .index("by_user", ["userId"]);
