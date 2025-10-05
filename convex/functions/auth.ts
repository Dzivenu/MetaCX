import { mutation, query } from "../_generated/server";

// Get current user (read-only)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Find existing user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user;
  },
});

// Sync user from Clerk (creates if doesn't exist, updates if exists)
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

export const getAuthenticatedMessage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return "Not authenticated with Convex.";
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    const name = user?.name || identity.name || identity.email;
    return `Hello, ${name}! You are authenticated with Convex and your data is synced.`;
  },
});
