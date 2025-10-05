import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// List identifications for a customer
export const listByCustomer = query({
  args: {
    orgCustomerId: v.id("org_customers"),
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) return [];

    const rows = await ctx.db
      .query("org_identifications")
      .withIndex("by_org_customer", (q) =>
        q.eq("orgCustomerId", args.orgCustomerId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("clerkOrganizationId"), orgId),
          q.eq(q.field("active"), true)
        )
      )
      .collect();

    return rows;
  },
});

// Get identification by id
export const getById = query({
  args: { id: v.id("org_identifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("Identification not found");

    const userOrgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    if (!userOrgId || row.clerkOrganizationId !== userOrgId) {
      throw new Error(
        "Unauthorized: Identification belongs to a different organization"
      );
    }

    return row;
  },
});

// Create identification
export const create = mutation({
  args: {
    clerkOrganizationId: v.optional(v.string()),
    orgCustomerId: v.id("org_customers"),
    orgAddressId: v.optional(v.id("org_addresses")),
    typeOf: v.string(),
    referenceNumber: v.string(),
    issuingCountryCode: v.optional(v.string()),
    issuingCountryName: v.optional(v.string()),
    issuingStateCode: v.optional(v.string()),
    issuingStateName: v.optional(v.string()),
    issueDate: v.optional(v.number()),
    expiryDate: v.optional(v.number()),
    photo: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    originOfFunds: v.optional(v.string()),
    purposeOfFunds: v.optional(v.string()),
    description: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    primary: v.optional(v.boolean()),
    typeCode: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    countryName: v.optional(v.string()),
    provinceCode: v.optional(v.string()),
    provinceName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) throw new Error("No active organization selected");

    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_id", (q) => q.eq("clerkOrganizationId", orgId))
      .first();
    if (!organization) throw new Error("Organization not found in database");

    const now = Date.now();

    // If setting as primary, unset existing primary for this customer
    if (args.primary) {
      const existingPrimaries = await ctx.db
        .query("org_identifications")
        .withIndex("by_org_customer", (q) =>
          q.eq("orgCustomerId", args.orgCustomerId)
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("clerkOrganizationId"), orgId),
            q.eq(q.field("primary"), true)
          )
        )
        .collect();
      for (const row of existingPrimaries) {
        await ctx.db.patch(row._id, { primary: false, updatedAt: now });
      }
    }

    const id = await ctx.db.insert("org_identifications", {
      clerkOrganizationId: orgId,
      clerk_org_id: orgId,
      org_id: organization._id,
      orgCustomerId: args.orgCustomerId,
      orgAddressId: args.orgAddressId,
      typeOf: args.typeOf,
      referenceNumber: args.referenceNumber,
      issuingCountryCode: args.issuingCountryCode,
      issuingCountryName: args.issuingCountryName,
      issuingStateCode: args.issuingStateCode,
      issuingStateName: args.issuingStateName,
      issueDate: args.issueDate,
      expiryDate: args.expiryDate,
      photo: args.photo,
      dateOfBirth: args.dateOfBirth,
      originOfFunds: args.originOfFunds,
      purposeOfFunds: args.purposeOfFunds,
      description: args.description,
      verified: args.verified || false,
      primary: args.primary || false,
      typeCode: args.typeCode,
      countryCode: args.countryCode,
      countryName: args.countryName,
      provinceCode: args.provinceCode,
      provinceName: args.provinceName,
      active: true,
      createdAt: now,
      updatedAt: now,
      createdBy: user._id,
    });

    return id;
  },
});

// Update identification
export const update = mutation({
  args: {
    id: v.id("org_identifications"),
    clerkOrganizationId: v.optional(v.string()),
    typeOf: v.optional(v.string()),
    referenceNumber: v.optional(v.string()),
    issuingCountryCode: v.optional(v.string()),
    issuingCountryName: v.optional(v.string()),
    issuingStateCode: v.optional(v.string()),
    issuingStateName: v.optional(v.string()),
    issueDate: v.optional(v.number()),
    expiryDate: v.optional(v.number()),
    photo: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    originOfFunds: v.optional(v.string()),
    purposeOfFunds: v.optional(v.string()),
    description: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    primary: v.optional(v.boolean()),
    typeCode: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    countryName: v.optional(v.string()),
    provinceCode: v.optional(v.string()),
    provinceName: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("Identification not found");

    const userOrgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!userOrgId || row.clerkOrganizationId !== userOrgId) {
      throw new Error(
        "Unauthorized: Identification belongs to a different organization"
      );
    }

    const updateData: Record<string, any> = { updatedAt: Date.now() };
    for (const key of [
      "typeOf",
      "referenceNumber",
      "issuingCountryCode",
      "issuingCountryName",
      "issuingStateCode",
      "issuingStateName",
      "issueDate",
      "expiryDate",
      "photo",
      "dateOfBirth",
      "originOfFunds",
      "purposeOfFunds",
      "description",
      "verified",
      "primary",
      "typeCode",
      "countryCode",
      "countryName",
      "provinceCode",
      "provinceName",
      "active",
    ]) {
      const value = (args as any)[key];
      if (value !== undefined) (updateData as any)[key] = value;
    }

    // If setting as primary, unset others for this customer
    if (args.primary && !row.primary) {
      const existingPrimaries = await ctx.db
        .query("org_identifications")
        .withIndex("by_org_customer", (q) =>
          q.eq("orgCustomerId", row.orgCustomerId)
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("clerkOrganizationId"), row.clerkOrganizationId),
            q.eq(q.field("primary"), true)
          )
        )
        .collect();
      for (const rec of existingPrimaries) {
        await ctx.db.patch(rec._id, { primary: false, updatedAt: Date.now() });
      }
    }

    await ctx.db.patch(args.id, updateData);
    return true;
  },
});

// Soft delete
export const remove = mutation({
  args: { id: v.id("org_identifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("Identification not found");

    const userOrgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    if (!userOrgId || row.clerkOrganizationId !== userOrgId) {
      throw new Error(
        "Unauthorized: Identification belongs to a different organization"
      );
    }

    await ctx.db.patch(args.id, { active: false, updatedAt: Date.now() });
    return true;
  },
});
