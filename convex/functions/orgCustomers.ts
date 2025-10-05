import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Get org customers for the user's active organization
export const getOrgCustomers = query({
  args: {
    clerkOrganizationId: v.optional(v.string()),
    limit: v.optional(v.number()),
    searchTerm: v.optional(v.string()),
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
      return []; // No active organization
    }

    // Get customers for the organization
    let query = ctx.db
      .query("org_customers")
      .withIndex("by_organization", (q) => q.eq("clerkOrganizationId", orgId))
      .filter((q) => q.eq(q.field("active"), true));

    // Fetch and apply case-insensitive search in memory (Convex query expressions
    // do not support string methods like toLowerCase on fields)
    const results = await query.order("desc").collect();

    let customers = results;
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      customers = results.filter((c: any) => {
        const first = (c.firstName ?? "").toLowerCase();
        const last = (c.lastName ?? "").toLowerCase();
        const email = (c.email ?? "").toLowerCase();
        return (
          first.includes(term) || last.includes(term) || email.includes(term)
        );
      });
    }

    return customers.slice(0, args.limit || 100);
  },
});

// Get org customer by ID
export const getOrgCustomerById = query({
  args: { customerId: v.id("org_customers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get customer
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new Error("Org customer not found");
    }

    // Verify user has access to this organization
    const userOrgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    if (!userOrgId || customer.clerkOrganizationId !== userOrgId) {
      throw new Error(
        "Unauthorized: Org customer belongs to a different organization"
      );
    }

    return customer;
  },
});

// Create new org customer
export const createOrgCustomer = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    title: v.optional(v.string()),
    middleName: v.optional(v.string()),
    email: v.optional(v.string()),
    telephone: v.optional(v.string()),
    dob: v.optional(v.number()),
    occupation: v.optional(v.string()),
    employer: v.optional(v.string()),
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

    // Get Convex organization record
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_id", (q) => q.eq("clerkOrganizationId", orgId))
      .first();
    if (!organization) {
      throw new Error("Organization not found in database");
    }

    const now = Date.now();

    // Create customer
    const customerId = await ctx.db.insert("org_customers", {
      clerkOrganizationId: orgId,
      clerk_org_id: orgId,
      org_id: organization._id,
      title: args.title,
      firstName: args.firstName,
      middleName: args.middleName,
      lastName: args.lastName,
      dob: args.dob,
      occupation: args.occupation,
      employer: args.employer,
      email: args.email,
      telephone: args.telephone,
      scanSuccess: false,
      duplicate: false,
      ordersBetween1kTo9k: 0,
      ordersBetween9kTo10k: 0,
      lastOrderId: "0",
      previousIds: [],
      marketableContactIds: [],
      ordersOver10k: 0,
      active: true,
      blacklisted: false,
      createdAt: now,
      updatedAt: now,
      createdBy: user._id,
    });

    return customerId;
  },
});

// Update org customer
export const updateOrgCustomer = mutation({
  args: {
    customerId: v.id("org_customers"),
    clerkOrganizationId: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    title: v.optional(v.string()),
    middleName: v.optional(v.string()),
    email: v.optional(v.string()),
    telephone: v.optional(v.string()),
    dob: v.optional(v.number()),
    occupation: v.optional(v.string()),
    employer: v.optional(v.string()),
    active: v.optional(v.boolean()),
    blacklisted: v.optional(v.boolean()),
    blacklistReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get customer
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new Error("Org customer not found");
    }

    // Verify user has access to this organization (explicit org or JWT)
    const userOrgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!userOrgId || customer.clerkOrganizationId !== userOrgId) {
      throw new Error(
        "Unauthorized: Org customer belongs to a different organization"
      );
    }

    // Update customer
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.firstName !== undefined) updateData.firstName = args.firstName;
    if (args.lastName !== undefined) updateData.lastName = args.lastName;
    if (args.title !== undefined) updateData.title = args.title;
    if (args.middleName !== undefined) updateData.middleName = args.middleName;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.telephone !== undefined) updateData.telephone = args.telephone;
    if (args.dob !== undefined) updateData.dob = args.dob;
    if (args.occupation !== undefined) updateData.occupation = args.occupation;
    if (args.employer !== undefined) updateData.employer = args.employer;
    if (args.active !== undefined) updateData.active = args.active;
    if (args.blacklisted !== undefined)
      updateData.blacklisted = args.blacklisted;
    if (args.blacklistReason !== undefined)
      updateData.blacklistReason = args.blacklistReason;

    await ctx.db.patch(args.customerId, updateData);
    return true;
  },
});

// Search org customers
export const searchOrgCustomers = query({
  args: {
    searchTerm: v.string(),
    clerkOrganizationId: v.optional(v.string()),
    limit: v.optional(v.number()),
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
      return []; // No active organization
    }

    // Fetch active customers for org and apply case-insensitive contains search in memory
    const base = await ctx.db
      .query("org_customers")
      .withIndex("by_organization", (q) => q.eq("clerkOrganizationId", orgId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    const term = args.searchTerm.toLowerCase();
    const filtered = base.filter((c: any) => {
      const first = (c.firstName ?? "").toLowerCase();
      const last = (c.lastName ?? "").toLowerCase();
      const email = (c.email ?? "").toLowerCase();
      return (
        first.includes(term) || last.includes(term) || email.includes(term)
      );
    });

    return filtered.slice(0, args.limit || 20);
  },
});

// Delete org customer (soft delete)
export const deleteOrgCustomer = mutation({
  args: {
    customerId: v.id("org_customers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get customer
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new Error("Org customer not found");
    }

    // Verify user has access to this organization
    const userOrgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    if (!userOrgId || customer.clerkOrganizationId !== userOrgId) {
      throw new Error(
        "Unauthorized: Org customer belongs to a different organization"
      );
    }

    // Soft delete customer
    await ctx.db.patch(args.customerId, {
      active: false,
      updatedAt: Date.now(),
    });

    return true;
  },
});
