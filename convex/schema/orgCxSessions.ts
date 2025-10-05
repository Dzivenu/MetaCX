import { defineTable } from "convex/server";
import { v } from "convex/values";

// Org CX Sessions for tracking customer exchange sessions
export const org_cx_sessions = defineTable({
  openStartDt: v.optional(v.number()),
  openConfirmDt: v.optional(v.number()),
  closeStartDt: v.optional(v.number()),
  closeConfirmDt: v.optional(v.number()),
  userId: v.optional(v.id("users")),

  // Organization references
  clerkOrganizationId: v.string(), // Clerk organization ID (legacy)
  clerk_org_id: v.string(), // Required Clerk organization ID
  org_id: v.id("organizations"), // Required Convex organization ID
  status: v.optional(v.string()), // default "DORMANT"
  verifiedByUserId: v.optional(v.id("users")),
  verifiedDt: v.optional(v.number()),
  openStartUserId: v.optional(v.id("users")),
  openConfirmUserId: v.optional(v.id("users")),
  closeStartUserId: v.optional(v.id("users")),
  closeConfirmUserId: v.optional(v.id("users")),

  // Active user ID - the user currently controlling the session
  activeUserId: v.optional(v.id("users")),

  // Authorized user IDs - array of user IDs who can access this session
  authorizedUserIds: v.optional(v.array(v.string())), // default []

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),

  // Creator
  createdBy: v.id("users"),
})
  .index("by_organization", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_org_id", ["org_id"])
  .index("by_user", ["userId"])
  .index("by_status", ["status"])
  .index("by_active_user", ["activeUserId"])
  .index("by_created_at", ["createdAt"]);

// Org CX Session Access Log - tracks session access and user joins
export const org_cx_session_access_logs = defineTable({
  orgSessionId: v.id("org_cx_sessions"),

  // Organization references
  clerkOrganizationId: v.string(), // Clerk organization ID (legacy)
  clerk_org_id: v.string(), // Required Clerk organization ID
  org_id: v.id("organizations"), // Required Convex organization ID
  startDt: v.number(),
  startOwnerId: v.id("users"),
  userJoinDt: v.optional(v.number()),
  userJoinId: v.optional(v.id("users")),
  authorizedUsers: v.optional(v.array(v.string())), // default []

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),

  // Creator
  createdBy: v.id("users"),
})
  .index("by_org_session", ["orgSessionId"])
  .index("by_organization", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_org_id", ["org_id"])
  .index("by_start_owner", ["startOwnerId"])
  .index("by_user_join", ["userJoinId"]);
