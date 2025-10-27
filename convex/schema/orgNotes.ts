import { defineTable } from "convex/server";
import { v } from "convex/values";

// Organization Notes table for tracking notes across different entities
export const org_notes = defineTable({
  // Organization references
  clerkOrganizationId: v.string(),
  clerk_org_id: v.string(),
  org_id: v.id("organizations"),

  // Note type/source: ORDER | CUSTOMER | SESSION | EXPENSE | TRANSFER | SWAP
  noteType: v.string(),

  // Related entity IDs (only one should be set based on noteType)
  orderId: v.optional(v.id("org_orders")),
  customerId: v.optional(v.id("org_customers")),
  sessionId: v.optional(v.id("org_cx_sessions")),
  expenseId: v.optional(v.string()), // For future expense tracking
  transferId: v.optional(v.string()), // For future transfer tracking
  swapId: v.optional(v.string()), // For future swap tracking

  // Note content
  title: v.optional(v.string()),
  message: v.string(),

  // Resolution tracking
  resolvable: v.boolean(), // Can this note be marked as resolved?
  resolved: v.boolean(), // Has this note been resolved?
  resolvedAt: v.optional(v.number()),
  resolvedBy: v.optional(v.id("users")),

  // Creator
  createdBy: v.id("users"),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_organization", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_org_id", ["org_id"])
  .index("by_note_type", ["noteType"])
  .index("by_order", ["orderId"])
  .index("by_customer", ["customerId"])
  .index("by_session", ["sessionId"])
  .index("by_created_by", ["createdBy"])
  .index("by_resolved", ["resolved"]);
