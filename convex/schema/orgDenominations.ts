import { defineTable } from "convex/server";
import { v } from "convex/values";

// Organization-specific denominations table
export const org_denominations = defineTable({
  // Organization references
  clerkOrganizationId: v.string(), // Clerk organization ID (legacy)
  clerk_org_id: v.string(), // Required Clerk organization ID
  org_id: v.id("organizations"), // Required Convex organization ID

  // Basic denomination info
  name: v.optional(v.string()),
  value: v.number(), // The denomination value (e.g., 1, 5, 10, 20, 100)

  // Currency reference
  orgCurrencyId: v.id("org_currencies"), // Reference to org_currencies table

  // Settings
  accepted: v.optional(v.boolean()), // default true - whether this denomination is accepted

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),

  // Creator
  createdBy: v.id("users"),
})
  .index("by_clerk_organization", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_org_id", ["org_id"])
  .index("by_org_currency", ["orgCurrencyId"])
  .index("by_value", ["value"])
  .index("by_accepted", ["accepted"]);
