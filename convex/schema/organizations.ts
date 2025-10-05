import { defineTable } from "convex/server";
import { v } from "convex/values";

// Top-level Organizations table mirrored from Clerk
export const organizations = defineTable({
  // Clerk identifiers
  clerkOrganizationId: v.string(),
  // Required clerk_org_id for consistency across all org tables
  clerk_org_id: v.string(),
  slug: v.string(),

  // Basic info
  name: v.string(),
  imageUrl: v.optional(v.string()),

  // Timestamps (epoch ms)
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_clerk_id", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_slug", ["slug"]);
