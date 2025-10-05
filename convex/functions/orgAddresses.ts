import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Get org addresses for a parent entity
export const getOrgAddressesByParent = query({
  args: {
    parentType: v.string(),
    parentId: v.string(),
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
      return []; // No active organization
    }

    // Get addresses for the parent
    const addresses = await ctx.db
      .query("org_addresses")
      .withIndex("by_parent", (q) =>
        q.eq("parentType", args.parentType).eq("parentId", args.parentId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("clerkOrganizationId"), orgId),
          q.eq(q.field("active"), true)
        )
      )
      .collect();

    return addresses;
  },
});

// Get org address by ID
export const getOrgAddressById = query({
  args: { addressId: v.id("org_addresses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get address
    const address = await ctx.db.get(args.addressId);
    if (!address) {
      throw new Error("Org address not found");
    }

    // Verify user has access to this organization
    const userOrgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    if (!userOrgId || address.clerkOrganizationId !== userOrgId) {
      throw new Error(
        "Unauthorized: Org address belongs to a different organization"
      );
    }

    return address;
  },
});

// Create new org address
export const createOrgAddress = mutation({
  args: {
    parentType: v.string(),
    parentId: v.string(),
    line1: v.string(),
    line2: v.optional(v.string()),
    line3: v.optional(v.string()),
    city: v.string(),
    county: v.optional(v.string()),
    stateCode: v.string(),
    stateName: v.string(),
    postalCode: v.string(),
    countryCode: v.string(), // Now required
    countryName: v.string(), // Now required
    addressType: v.optional(v.string()),
    primary: v.optional(v.boolean()),
    verified: v.optional(v.boolean()),
    deliveryInstructions: v.optional(v.string()),
    accessInstructions: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    notes: v.optional(v.string()),
    addressFull: v.optional(v.string()),
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

    // If setting as primary, remove primary flag from other addresses for this parent
    if (args.primary) {
      const existingAddresses = await ctx.db
        .query("org_addresses")
        .withIndex("by_parent", (q) =>
          q.eq("parentType", args.parentType).eq("parentId", args.parentId)
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("clerkOrganizationId"), orgId),
            q.eq(q.field("primary"), true)
          )
        )
        .collect();

      for (const addr of existingAddresses) {
        await ctx.db.patch(addr._id, {
          primary: false,
          updatedAt: Date.now(),
        });
      }
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

    // Create address
    const addressId = await ctx.db.insert("org_addresses", {
      clerkOrganizationId: orgId,
      clerk_org_id: orgId,
      org_id: organization._id,
      parentType: args.parentType,
      parentId: args.parentId,
      line1: args.line1,
      line2: args.line2,
      line3: args.line3,
      city: args.city,
      county: args.county,
      stateCode: args.stateCode,
      stateName: args.stateName,
      postalCode: args.postalCode,
      countryCode: args.countryCode,
      countryName: args.countryName,
      addressType: args.addressType,
      primary: args.primary || false,
      active: true,
      verified: args.verified || false,
      deliveryInstructions: args.deliveryInstructions,
      accessInstructions: args.accessInstructions,
      contactPhone: args.contactPhone,
      contactEmail: args.contactEmail,
      notes: args.notes,
      addressFull: args.addressFull,
      createdAt: now,
      updatedAt: now,
      createdBy: user._id,
    });

    return addressId;
  },
});

// Update org address
export const updateOrgAddress = mutation({
  args: {
    addressId: v.id("org_addresses"),
    clerkOrganizationId: v.optional(v.string()), // Add explicit org ID
    line1: v.optional(v.string()),
    line2: v.optional(v.string()),
    line3: v.optional(v.string()),
    city: v.optional(v.string()),
    county: v.optional(v.string()),
    stateCode: v.optional(v.string()),
    stateName: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    countryName: v.optional(v.string()),
    addressType: v.optional(v.string()),
    primary: v.optional(v.boolean()),
    verified: v.optional(v.boolean()),
    deliveryInstructions: v.optional(v.string()),
    accessInstructions: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    notes: v.optional(v.string()),
    addressFull: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get address
    const address = await ctx.db.get(args.addressId);
    if (!address) {
      throw new Error("Org address not found");
    }

    // Get organization ID from explicit parameter or JWT
    const userOrgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);

    // Debug logging
    console.log("🔍 Update authorization check:");
    console.log("  - Address ID:", args.addressId);
    console.log(
      "  - Address clerkOrganizationId:",
      address.clerkOrganizationId
    );
    console.log("  - Args clerkOrganizationId:", args.clerkOrganizationId);
    console.log("  - User JWT org_id:", identity.org_id);
    console.log("  - Final userOrgId:", userOrgId);
    console.log("  - IDs match:", address.clerkOrganizationId === userOrgId);

    if (!userOrgId || address.clerkOrganizationId !== userOrgId) {
      throw new Error(
        `Unauthorized: Org address belongs to a different organization. Address org: ${address.clerkOrganizationId}, User org: ${userOrgId}`
      );
    }

    // If setting as primary, remove primary flag from other addresses for this parent
    if (args.primary && !address.primary) {
      const existingAddresses = await ctx.db
        .query("org_addresses")
        .withIndex("by_parent", (q) =>
          q
            .eq("parentType", address.parentType)
            .eq("parentId", address.parentId)
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("clerkOrganizationId"), address.clerkOrganizationId),
            q.eq(q.field("primary"), true)
          )
        )
        .collect();

      for (const addr of existingAddresses) {
        await ctx.db.patch(addr._id, {
          primary: false,
          updatedAt: Date.now(),
        });
      }
    }

    // Update address
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.line1 !== undefined) updateData.line1 = args.line1;
    if (args.line2 !== undefined) updateData.line2 = args.line2;
    if (args.line3 !== undefined) updateData.line3 = args.line3;
    if (args.city !== undefined) updateData.city = args.city;
    if (args.county !== undefined) updateData.county = args.county;
    if (args.stateCode !== undefined) updateData.stateCode = args.stateCode;
    if (args.stateName !== undefined) updateData.stateName = args.stateName;
    if (args.postalCode !== undefined) updateData.postalCode = args.postalCode;
    if (args.countryCode !== undefined)
      updateData.countryCode = args.countryCode;
    if (args.countryName !== undefined)
      updateData.countryName = args.countryName;
    if (args.addressType !== undefined)
      updateData.addressType = args.addressType;
    if (args.primary !== undefined) updateData.primary = args.primary;
    if (args.verified !== undefined) updateData.verified = args.verified;
    if (args.deliveryInstructions !== undefined)
      updateData.deliveryInstructions = args.deliveryInstructions;
    if (args.accessInstructions !== undefined)
      updateData.accessInstructions = args.accessInstructions;
    if (args.contactPhone !== undefined)
      updateData.contactPhone = args.contactPhone;
    if (args.contactEmail !== undefined)
      updateData.contactEmail = args.contactEmail;
    if (args.notes !== undefined) updateData.notes = args.notes;
    if (args.addressFull !== undefined)
      updateData.addressFull = args.addressFull;
    if (args.active !== undefined) updateData.active = args.active;

    await ctx.db.patch(args.addressId, updateData);
    return true;
  },
});

// Delete org address (soft delete)
export const deleteOrgAddress = mutation({
  args: {
    addressId: v.id("org_addresses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get address
    const address = await ctx.db.get(args.addressId);
    if (!address) {
      throw new Error("Org address not found");
    }

    // Verify user has access to this organization
    const userOrgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    if (!userOrgId || address.clerkOrganizationId !== userOrgId) {
      throw new Error(
        "Unauthorized: Org address belongs to a different organization"
      );
    }

    // Soft delete address
    await ctx.db.patch(args.addressId, {
      active: false,
      updatedAt: Date.now(),
    });

    return true;
  },
});
