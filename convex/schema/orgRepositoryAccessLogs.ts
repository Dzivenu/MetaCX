import { defineTable } from "convex/server";
import { v } from "convex/values";

// Org repository access logs for tracking repository access
export const org_repository_access_logs = defineTable({
  // Organization references
  clerkOrganizationId: v.string(), // Clerk organization ID (legacy)
  clerk_org_id: v.string(), // Required Clerk organization ID
  org_id: v.id("organizations"), // Required Convex organization ID

  orgSessionId: v.id("org_cx_sessions"),
  orgRepositoryId: v.id("org_repositories"),
  userId: v.id("users"),
  openStartDt: v.optional(v.number()),
  openConfirmDt: v.optional(v.number()),
  closeStartDt: v.optional(v.number()),
  closeConfirmDt: v.optional(v.number()),
  releaseDt: v.optional(v.number()),
  authorizedUsers: v.optional(v.array(v.string())), // default []

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
  .index("by_org_repository", ["orgRepositoryId"])
  .index("by_user", ["userId"]);
