import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// Get repositories for the user's active organization (from Clerk)
export const getRepositories = query({
  args: { clerkOrganizationId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get organization ID from JWT or args
    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) {
      return []; // No active organization
    }

    // Get repositories for the organization
    const repositories = await ctx.db
      .query("org_repositories")
      .withIndex("by_organization", (q) => q.eq("clerkOrganizationId", orgId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    // Sort by display order, then by name
    return repositories.sort((a, b) => {
      const orderA = a.displayOrderId || 999;
      const orderB = b.displayOrderId || 999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  },
});

// Get repository by ID
export const getRepositoryById = query({
  args: { repositoryId: v.id("org_repositories") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get repository
    const repository = await ctx.db.get(args.repositoryId);
    if (!repository) {
      throw new Error("Repository not found");
    }

    // Verify user has access to this organization
    const userOrgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    if (!userOrgId || repository.clerkOrganizationId !== userOrgId) {
      throw new Error(
        "Unauthorized: Repository belongs to a different organization"
      );
    }

    return repository;
  },
});

// Get repositories a given user has access to (by Clerk user id)
export const getUserRepositoryAccess = query({
  args: {
    clerkUserId: v.string(),
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) return [];

    // Find repositories for org
    const repos = await ctx.db
      .query("org_repositories")
      .withIndex("by_organization", (q) => q.eq("clerkOrganizationId", orgId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    // For now, treat authorizedUserIds (JSON string) containing clerk user id as access
    const result = repos.filter((r) => {
      if (!r.authorizedUserIds) return false;
      try {
        const ids = JSON.parse(r.authorizedUserIds) as string[];
        return Array.isArray(ids) && ids.includes(args.clerkUserId);
      } catch {
        return false;
      }
    });

    return result;
  },
});

// Get repository by key
export const getRepositoryByKey = query({
  args: {
    key: v.string(),
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get organization ID from JWT or args
    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) {
      throw new Error("No active organization selected");
    }

    // Get repository by key within the organization
    const repository = await ctx.db
      .query("org_repositories")
      .withIndex("by_organization", (q) => q.eq("clerkOrganizationId", orgId))
      .filter((q) => q.eq(q.field("key"), args.key))
      .first();

    return repository;
  },
});

// Create new repository
export const createRepository = mutation({
  args: {
    name: v.string(),
    key: v.string(),
    typeOf: v.optional(v.string()),
    currencyType: v.optional(v.string()),
    form: v.optional(v.string()),
    floatThresholdBottom: v.optional(v.union(v.number(), v.string())),
    floatThresholdTop: v.optional(v.union(v.number(), v.string())),
    floatCountRequired: v.optional(v.boolean()),
    currencyTickers: v.optional(v.array(v.string())),
    clerkOrganizationId: v.optional(v.string()),
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

    // Get organization ID from JWT or args
    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) {
      throw new Error("No active organization selected");
    }

    // Check if key is unique within the organization
    const existingRepository = await ctx.db
      .query("org_repositories")
      .withIndex("by_organization", (q) => q.eq("clerkOrganizationId", orgId))
      .filter((q) => q.eq(q.field("key"), args.key))
      .first();

    if (existingRepository) {
      throw new Error("Repository key already exists in this organization");
    }

    // Get next display order
    const lastRepository = await ctx.db
      .query("org_repositories")
      .withIndex("by_organization", (q) => q.eq("clerkOrganizationId", orgId))
      .order("desc")
      .first();

    const nextDisplayOrder = lastRepository
      ? (lastRepository.displayOrderId || 0) + 1
      : 1;

    // Get Convex organization record
    let organization = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_id", (q) => q.eq("clerkOrganizationId", orgId))
      .first();
    if (!organization) {
      // Fallback: ensure organization exists by upserting a minimal record
      // If we don't have the name/slug, default to orgId
      await ctx.runMutation(api.functions.organizations.upsertByClerkId, {
        clerkOrganizationId: orgId,
        slug: orgId,
        name: "Organization",
        imageUrl: undefined,
      });

      organization = await ctx.db
        .query("organizations")
        .withIndex("by_clerk_id", (q) => q.eq("clerkOrganizationId", orgId))
        .first();

      if (!organization) {
        throw new Error("Organization not found in database");
      }
    }

    const now = Date.now();

    // Create repository
    const repositoryId = await ctx.db.insert("org_repositories", {
      name: args.name,
      key: args.key,
      clerkOrganizationId: orgId,
      clerk_org_id: orgId,
      org_id: organization._id,
      typeOf: args.typeOf,
      currencyType: args.currencyType,
      form: args.form,
      floatThresholdBottom: args.floatThresholdBottom?.toString(),
      floatThresholdTop: args.floatThresholdTop?.toString(),
      floatCountRequired: args.floatCountRequired || false,
      currencyTickers: args.currencyTickers || [],
      displayOrderId: nextDisplayOrder,
      active: true,
      createdAt: now,
      updatedAt: now,
      createdBy: user._id,
    });

    return repositoryId;
  },
});

// Grant repository access to a clerk user
export const grantUserRepositoryAccess = mutation({
  args: {
    repositoryId: v.id("org_repositories"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const repo = await ctx.db.get(args.repositoryId);
    if (!repo) throw new Error("Repository not found");

    // Ensure same org
    const userOrgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    if (!userOrgId || (repo as any).clerkOrganizationId !== userOrgId) {
      throw new Error("Unauthorized");
    }

    let ids: string[] = [];
    try {
      ids = repo.authorizedUserIds ? JSON.parse(repo.authorizedUserIds) : [];
    } catch {
      ids = [];
    }
    if (!ids.includes(args.clerkUserId)) ids.push(args.clerkUserId);

    await ctx.db.patch(args.repositoryId, {
      authorizedUserIds: JSON.stringify(ids),
      updatedAt: Date.now(),
    });

    return true;
  },
});

// Revoke repository access from a clerk user
export const revokeUserRepositoryAccess = mutation({
  args: {
    repositoryId: v.id("org_repositories"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const repo = await ctx.db.get(args.repositoryId);
    if (!repo) throw new Error("Repository not found");

    const userOrgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    if (!userOrgId || (repo as any).clerkOrganizationId !== userOrgId) {
      throw new Error("Unauthorized");
    }

    let ids: string[] = [];
    try {
      ids = repo.authorizedUserIds ? JSON.parse(repo.authorizedUserIds) : [];
    } catch {
      ids = [];
    }
    const next = ids.filter((id) => id !== args.clerkUserId);

    await ctx.db.patch(args.repositoryId, {
      authorizedUserIds: JSON.stringify(next),
      updatedAt: Date.now(),
    });

    return true;
  },
});

// Update repository
export const updateRepository = mutation({
  args: {
    repositoryId: v.id("org_repositories"),
    name: v.optional(v.string()),
    key: v.optional(v.string()),
    typeOf: v.optional(v.string()),
    currencyType: v.optional(v.string()),
    form: v.optional(v.string()),
    floatThresholdBottom: v.optional(v.union(v.number(), v.string())),
    floatThresholdTop: v.optional(v.union(v.number(), v.string())),
    floatCountRequired: v.optional(v.boolean()),
    currencyTickers: v.optional(v.array(v.string())),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get repository
    const repository = await ctx.db.get(args.repositoryId);
    if (!repository) {
      throw new Error("Repository not found");
    }

    // Verify user has access to this organization
    const userOrgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    if (!userOrgId || repository.clerkOrganizationId !== userOrgId) {
      throw new Error(
        "Unauthorized: Repository belongs to a different organization"
      );
    }

    // If updating key, check for uniqueness
    if (args.key && args.key !== repository.key) {
      const existingRepository = await ctx.db
        .query("org_repositories")
        .withIndex("by_organization", (q) =>
          q.eq("clerkOrganizationId", (repository as any).clerkOrganizationId)
        )
        .filter((q) => q.eq(q.field("key"), args.key))
        .first();

      if (existingRepository) {
        throw new Error("Repository key already exists in this organization");
      }
    }

    // Update repository
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.key !== undefined) updateData.key = args.key;
    if (args.typeOf !== undefined) updateData.typeOf = args.typeOf;
    if (args.currencyType !== undefined)
      updateData.currencyType = args.currencyType;
    if (args.form !== undefined) updateData.form = args.form;
    if (args.floatThresholdBottom !== undefined)
      updateData.floatThresholdBottom = args.floatThresholdBottom.toString();
    if (args.floatThresholdTop !== undefined)
      updateData.floatThresholdTop = args.floatThresholdTop.toString();
    if (args.floatCountRequired !== undefined)
      updateData.floatCountRequired = args.floatCountRequired;
    if (args.currencyTickers !== undefined)
      updateData.currencyTickers = args.currencyTickers;
    if (args.active !== undefined) updateData.active = args.active;

    await ctx.db.patch(args.repositoryId, updateData);
    return true;
  },
});

// Reorder repositories
export const reorderRepositories = mutation({
  args: {
    orderedRepositoryIds: v.array(v.id("org_repositories")),
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get organization ID from JWT or args
    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) {
      throw new Error("No active organization selected");
    }

    // Verify all repositories belong to the organization
    const repositories = await Promise.all(
      args.orderedRepositoryIds.map((id) => ctx.db.get(id))
    );

    for (const repository of repositories) {
      if (!repository || (repository as any).clerkOrganizationId !== orgId) {
        throw new Error(
          "Invalid repository ID or repository doesn't belong to your organization"
        );
      }
    }

    // Update display orders
    const now = Date.now();
    for (let i = 0; i < args.orderedRepositoryIds.length; i++) {
      await ctx.db.patch(args.orderedRepositoryIds[i], {
        displayOrderId: i + 1,
        updatedAt: now,
      });
    }

    return true;
  },
});

// Delete repository (soft delete)
export const deleteRepository = mutation({
  args: {
    repositoryId: v.id("org_repositories"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get repository
    const repository = await ctx.db.get(args.repositoryId);
    if (!repository) {
      throw new Error("Repository not found");
    }

    // Verify user has access to this organization
    const userOrgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    if (!userOrgId || repository.clerkOrganizationId !== userOrgId) {
      throw new Error(
        "Unauthorized: Repository belongs to a different organization"
      );
    }

    // Soft delete repository
    await ctx.db.patch(args.repositoryId, {
      active: false,
      updatedAt: Date.now(),
    });

    return true;
  },
});
