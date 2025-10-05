import { defineTable } from "convex/server";
import { v } from "convex/values";

// Users table - synced from Clerk
export const users = defineTable({
  // Clerk user ID
  clerkId: v.string(),
  email: v.string(),
  name: v.optional(v.string()),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  username: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  emailVerified: v.optional(v.boolean()),
  // User status
  active: v.optional(v.boolean()),
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  // Last seen / activity
  lastSeenAt: v.optional(v.number()),
})
  .index("by_clerk_id", ["clerkId"])
  .index("by_email", ["email"])
  .index("by_active", ["active"]);

