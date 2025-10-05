import { defineTable } from "convex/server";
import { v } from "convex/values";

// Org repositories for currency storage/management
export const org_repositories = defineTable({
  name: v.string(),
  typeOf: v.optional(v.string()),

  // Organization references
  clerkOrganizationId: v.string(), // Clerk organization ID (legacy, now required)
  clerk_org_id: v.string(), // Required Clerk organization ID
  org_id: v.id("organizations"), // Required Convex organization ID
  currencyType: v.optional(v.string()),
  form: v.optional(v.string()),
  uid: v.optional(v.number()),
  key: v.string(),
  currencyTickers: v.optional(v.array(v.string())), // default []
  displayOrderId: v.optional(v.number()),
  floatThresholdBottom: v.optional(v.string()), // decimal as string
  floatThresholdTop: v.optional(v.string()), // decimal as string
  floatCountRequired: v.optional(v.boolean()),
  active: v.optional(v.boolean()), // default true

  // Repository access control - stores array of user IDs who have access
  authorizedUserIds: v.optional(v.string()), // JSON array of user IDs

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),

  // Creator
  createdBy: v.id("users"),
})
  .index("by_name", ["name"])
  .index("by_key", ["key"])
  .index("by_organization", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_org_id", ["org_id"])
  .index("by_active", ["active"])
  .index("by_type", ["typeOf"]);
