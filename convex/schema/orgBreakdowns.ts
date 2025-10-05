import { defineTable } from "convex/server";
import { v } from "convex/values";

// Org Breakdowns table for money/currency denominations
export const org_breakdowns = defineTable({
  // Organization references
  clerkOrganizationId: v.string(), // Clerk organization ID (legacy)
  clerk_org_id: v.string(), // Required Clerk organization ID
  org_id: v.id("organizations"), // Required Convex organization ID

  // Polymorphic association to breakable entity
  breakableType: v.optional(v.string()),
  breakableId: v.optional(v.string()),

  // Reference to org denomination
  orgDenominationId: v.optional(v.id("org_denominations")),

  // Count of this denomination
  count: v.optional(v.string()), // decimal as string

  // Direction of the breakdown
  direction: v.optional(v.string()),

  // Reference to org float stack
  orgFloatStackId: v.optional(v.id("org_float_stacks")),

  // Status of the breakdown
  status: v.optional(v.string()),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),

  // Creator
  createdBy: v.id("users"),
})
  .index("by_clerk_organization", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_org_id", ["org_id"])
  .index("by_breakable", ["breakableType", "breakableId"])
  .index("by_org_denomination", ["orgDenominationId"])
  .index("by_org_float_stack", ["orgFloatStackId"])
  .index("by_status", ["status"]);
