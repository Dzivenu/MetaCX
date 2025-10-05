import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Get current user from Clerk authentication
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Try to find existing user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user;
  },
});

// Sync user data from Clerk (automatically create/update user)
export const syncCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Try to find existing user by Clerk ID
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    const now = Date.now();

    if (existingUser) {
      // Update existing user with proper type checking
      await ctx.db.patch(existingUser._id, {
        email:
          typeof identity.email === "string"
            ? identity.email
            : existingUser.email,
        name:
          typeof identity.name === "string" ? identity.name : existingUser.name,
        firstName:
          typeof identity.given_name === "string"
            ? identity.given_name
            : existingUser.firstName,
        lastName:
          typeof identity.family_name === "string"
            ? identity.family_name
            : existingUser.lastName,
        username:
          typeof identity.nickname === "string"
            ? identity.nickname
            : existingUser.username,
        imageUrl:
          typeof identity.picture === "string"
            ? identity.picture
            : existingUser.imageUrl,
        emailVerified:
          typeof identity.email_verified === "boolean"
            ? identity.email_verified
            : existingUser.emailVerified,
        lastSeenAt: now,
        updatedAt: now,
      });
      return existingUser._id;
    } else {
      // Create new user with proper type checking
      const newUserId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: typeof identity.email === "string" ? identity.email : "",
        name: typeof identity.name === "string" ? identity.name : "",
        firstName:
          typeof identity.given_name === "string" ? identity.given_name : "",
        lastName:
          typeof identity.family_name === "string" ? identity.family_name : "",
        username:
          typeof identity.nickname === "string" ? identity.nickname : "",
        imageUrl: typeof identity.picture === "string" ? identity.picture : "",
        emailVerified:
          typeof identity.email_verified === "boolean"
            ? identity.email_verified
            : false,
        active: true,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      });
      return newUserId;
    }
  },
});

// Update user's last seen timestamp
export const updateUserActivity = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        lastSeenAt: Date.now(),
      });
    }

    return user;
  },
});

// Get user by ID (for other functions to use)
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Search users by email (for reference purposes)
export const searchUsersByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
  },
});

// Upsert an arbitrary user from Clerk-provided data (admin/server-side sync)
export const upsertFromClerkData = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email || existing.email,
        name: args.name !== undefined ? args.name : existing.name,
        firstName:
          args.firstName !== undefined ? args.firstName : existing.firstName,
        lastName:
          args.lastName !== undefined ? args.lastName : existing.lastName,
        username:
          args.username !== undefined ? args.username : existing.username,
        imageUrl:
          args.imageUrl !== undefined ? args.imageUrl : existing.imageUrl,
        emailVerified:
          args.emailVerified !== undefined
            ? args.emailVerified
            : existing.emailVerified,
        active:
          args.active !== undefined ? args.active : (existing.active ?? true),
        updatedAt: now,
        lastSeenAt: now,
      });
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name || "",
      firstName: args.firstName || "",
      lastName: args.lastName || "",
      username: args.username || "",
      imageUrl: args.imageUrl || "",
      emailVerified: args.emailVerified ?? false,
      active: args.active ?? true,
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
    });

    return userId;
  },
});

// Update user preferences
export const updateUserPreferences = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user preferences already exist
    const existingPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const now = Date.now();

    if (existingPreferences) {
      // Update existing preferences
      await ctx.db.patch(existingPreferences._id, {
        preferences: args.preferences,
        updatedAt: now,
      });
      return existingPreferences._id;
    } else {
      // Create new preferences
      return await ctx.db.insert("userPreferences", {
        userId: user._id,
        preferences: args.preferences,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get user preferences
export const getUserPreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    // Get user preferences
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return preferences;
  },
});

// Deactivate user (soft delete)
export const deactivateUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Deactivate user account
    await ctx.db.patch(currentUser._id, {
      active: false,
      updatedAt: Date.now(),
    });

    return true;
  },
});

// Admin function: Get all users (for admin users page)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get current user and check if they're an admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // For now, return all users. In a real implementation, you'd check admin permissions
    const users = await ctx.db.query("users").collect();

    return users.map((user) => ({
      id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      imageUrl: user.imageUrl,
      emailVerified: user.emailVerified,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastSeenAt: user.lastSeenAt,
    }));
  },
});

// Admin function: Update any user
export const adminUpdateUser = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object({
      name: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      active: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get current user and check if they're an admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    // For now, allow any authenticated user to update. In production, check admin permissions
    await ctx.db.patch(args.userId, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return true;
  },
});

// Admin function: Create user
export const adminCreateUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get current user and check if they're an admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    // Check if user with this email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const now = Date.now();

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: `admin_created_${crypto.randomUUID()}`, // Temporary clerk ID
      email: args.email,
      name: args.name || "",
      firstName: args.firstName || "",
      lastName: args.lastName || "",
      username: "",
      imageUrl: "",
      emailVerified: false,
      active: args.active !== undefined ? args.active : true,
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
    });

    return userId;
  },
});

// Admin function: Archive/deactivate user
export const adminArchiveUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get current user and check if they're an admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    // Don't allow archiving themselves
    if (currentUser._id === args.userId) {
      throw new Error("Cannot archive your own account");
    }

    // Archive the user
    await ctx.db.patch(args.userId, {
      active: false,
      updatedAt: Date.now(),
    });

    return true;
  },
});
