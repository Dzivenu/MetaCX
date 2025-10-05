import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const upsertByClerkId = mutation({
  args: {
    clerkOrganizationId: v.string(),
    slug: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkOrganizationId", args.clerkOrganizationId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        slug: args.slug,
        imageUrl: args.imageUrl,
        clerk_org_id: args.clerkOrganizationId,
        updatedAt: now,
      });
      return { id: existing._id, created: false };
    }

    const id = await ctx.db.insert("organizations", {
      clerkOrganizationId: args.clerkOrganizationId,
      clerk_org_id: args.clerkOrganizationId,
      slug: args.slug,
      name: args.name,
      imageUrl: args.imageUrl,
      createdAt: now,
      updatedAt: now,
    });

    return { id, created: true };
  },
});

export const getByClerkId = query({
  args: { clerkOrganizationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkOrganizationId", args.clerkOrganizationId)
      )
      .first();
  },
});

export const getById = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.organizationId);
  },
});
