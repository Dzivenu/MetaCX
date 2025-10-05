import { defineTable } from "convex/server";
import { v } from "convex/values";

// Org activities for tracking system events
export const org_activities = defineTable({
  event: v.string(), // e.g., 'SESSION_CREATED', 'SESSION_JOINED'
  userId: v.id("users"),

  // Organization references
  clerkOrganizationId: v.string(), // Clerk organization ID (legacy)
  clerk_org_id: v.string(), // Required Clerk organization ID
  org_id: v.id("organizations"), // Required Convex organization ID
  orgSessionId: v.optional(v.id("org_cx_sessions")),
  referenceId: v.optional(v.string()), // Reference to the entity being acted upon
  comment: v.optional(v.string()),
  meta: v.optional(v.any()), // Additional metadata about the activity

  // Timestamps
  createdAt: v.number(),

  // Creator
  createdBy: v.id("users"),
})
  .index("by_user", ["userId"])
  .index("by_organization", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_org_id", ["org_id"])
  .index("by_org_session", ["orgSessionId"])
  .index("by_event", ["event"])
  .index("by_created_at", ["createdAt"]);
