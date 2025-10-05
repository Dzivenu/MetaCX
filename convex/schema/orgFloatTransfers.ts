import { defineTable } from "convex/server";
import { v } from "convex/values";

// Org float transfers between repositories
export const org_float_transfers = defineTable({
  // Organization references
  clerkOrganizationId: v.string(), // Clerk organization ID (legacy)
  clerk_org_id: v.string(), // Required Clerk organization ID
  org_id: v.id("organizations"), // Required Convex organization ID

  orgSessionId: v.id("org_cx_sessions"),
  userId: v.id("users"),
  inboundOrgRepositoryId: v.id("org_repositories"),
  outboundOrgRepositoryId: v.id("org_repositories"),
  inboundTicker: v.string(),
  outboundTicker: v.string(),
  inboundSum: v.string(), // decimal as string
  outboundSum: v.string(), // decimal as string
  status: v.optional(v.string()), // default "PENDING"
  notes: v.optional(v.string()),

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
  .index("by_inbound_org_repository", ["inboundOrgRepositoryId"])
  .index("by_outbound_org_repository", ["outboundOrgRepositoryId"])
  .index("by_status", ["status"])
  .index("by_user", ["userId"]);
