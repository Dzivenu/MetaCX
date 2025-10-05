import { defineTable } from "convex/server";
import { v } from "convex/values";

// Organization memberships table
export const org_memberships = defineTable({
  // Organization reference
  organizationId: v.id("organizations"),

  // User reference
  userId: v.id("users"),

  // Clerk identifiers for compatibility
  clerkOrganizationId: v.string(),
  clerkUserId: v.string(),

  // Member role in organization
  role: v.union(v.literal("member"), v.literal("admin"), v.literal("owner")),

  // Membership status
  status: v.union(
    v.literal("active"),
    v.literal("invited"),
    v.literal("suspended"),
    v.literal("removed")
  ),

  // Member personal details
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),

  // Repository access - array of repository IDs this member has access to
  authorizedRepoIds: v.optional(v.array(v.string())),

  // When the user joined or was invited
  joinedAt: v.optional(v.number()),
  invitedAt: v.optional(v.number()),

  // Who invited this member (if applicable)
  invitedBy: v.optional(v.id("users")),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_organization", ["organizationId"])
  .index("by_user", ["userId"])
  .index("by_clerk_org", ["clerkOrganizationId"])
  .index("by_clerk_user", ["clerkUserId"])
  .index("by_org_user", ["organizationId", "userId"])
  .index("by_clerk_org_user", ["clerkOrganizationId", "clerkUserId"])
  .index("by_status", ["status"])
  .index("by_role", ["role"]);

// Organization invitations table
export const orgInvitations = defineTable({
  // Organization reference
  organizationId: v.id("organizations"),
  clerkOrganizationId: v.string(),

  // Invitation details
  email: v.string(),
  role: v.union(v.literal("member"), v.literal("admin"), v.literal("owner")),

  // Invitation status
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("declined"),
    v.literal("expired"),
    v.literal("cancelled")
  ),

  // Who sent the invitation
  invitedBy: v.id("users"),

  // When the invitation was sent
  invitedAt: v.number(),

  // When the invitation expires
  expiresAt: v.number(),

  // When invitation was accepted/declined
  respondedAt: v.optional(v.number()),

  // Unique invitation token
  token: v.string(),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_organization", ["organizationId"])
  .index("by_email", ["email"])
  .index("by_status", ["status"])
  .index("by_token", ["token"])
  .index("by_clerk_org", ["clerkOrganizationId"])
  .index("by_invited_by", ["invitedBy"]);
