import { defineTable } from "convex/server";
import { v } from "convex/values";

// Org Contacts linked to customers
export const org_contacts = defineTable({
  // Organization references
  clerkOrganizationId: v.string(), // Clerk organization ID (legacy)
  clerk_org_id: v.string(), // Required Clerk organization ID
  org_id: v.id("organizations"), // Required Convex organization ID

  // Polymorphic association (e.g., CUSTOMER, USER)
  parentType: v.string(),
  parentId: v.string(),

  // Contact details
  typeOf: v.string(), // email | telephone | ...
  endpoint: v.string(), // value (e.g., email address or phone number)
  extension: v.optional(v.string()), // phone extension if applicable

  // Flags
  primary: v.optional(v.boolean()), // default false
  verified: v.optional(v.boolean()), // default false
  verifiedAt: v.optional(v.number()),
  marketable: v.optional(v.boolean()),
  marketableAcceptDt: v.optional(v.number()),
  active: v.optional(v.boolean()), // default true

  // Audit
  createdAt: v.number(),
  updatedAt: v.number(),

  // Optional reviewer for verification tracking
  reviewerId: v.optional(v.id("users")),

  // Creator
  createdBy: v.id("users"),
})
  .index("by_organization", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_org_id", ["org_id"])
  .index("by_parent", ["parentType", "parentId"])
  .index("by_type", ["typeOf"])
  .index("by_endpoint", ["endpoint"])
  .index("by_primary", ["primary"])
  .index("by_verified", ["verified"])
  .index("by_active", ["active"]);
