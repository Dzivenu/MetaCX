import { defineTable } from "convex/server";
import { v } from "convex/values";

// User preferences (for storing user-specific app settings)
export const userPreferences = defineTable({
  userId: v.id("users"),
  // Store any user-specific preferences here
  preferences: v.optional(
    v.object({
      theme: v.optional(v.string()),
      language: v.optional(v.string()),
      timezone: v.optional(v.string()),
      notifications: v.optional(
        v.object({
          email: v.optional(v.boolean()),
          push: v.optional(v.boolean()),
        })
      ),
    })
  ),
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_user", ["userId"]);

