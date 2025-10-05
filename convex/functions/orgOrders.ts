import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// List all org orders for current organization and session
export const listOrgOrders = query({
  args: {
    clerkOrganizationId: v.optional(v.string()),
    orgSessionId: v.optional(v.id("org_cx_sessions")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get organization ID from args or JWT
    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) {
      return []; // No active organization
    }

    // If session ID is provided, filter by both org and session
    if (args.orgSessionId) {
      const orders = await ctx.db
        .query("org_orders")
        .withIndex("by_org_session", (q) =>
          q.eq("orgSessionId", args.orgSessionId)
        )
        .order("desc")
        .take(args.limit || 100);

      // Additional filter by organization to ensure security
      return orders.filter((order) => order.clerk_org_id === orgId);
    }

    // Otherwise, get all orders for the organization
    const orders = await ctx.db
      .query("org_orders")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerk_org_id", orgId))
      .order("desc")
      .take(args.limit || 100);

    return orders;
  },
});

// Get org orders for a session
export const getOrgOrdersBySession = query({
  args: { orgSessionId: v.id("org_cx_sessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get orders for the session
    const orders = await ctx.db
      .query("org_orders")
      .withIndex("by_org_session", (q) =>
        q.eq("orgSessionId", args.orgSessionId)
      )
      .order("desc")
      .collect();

    return orders;
  },
});

// Get org orders by status
export const getOrgOrdersByStatus = query({
  args: {
    status: v.string(),
    limit: v.optional(v.number()),
    orgCustomerId: v.optional(v.id("org_customers")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get orders by status
    let q = ctx.db
      .query("org_orders")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc");

    // optional filter by customer
    if (args.orgCustomerId) {
      // Convex doesn't allow multiple .withIndex in one query chain; filter client-side
      const rows = await q.take(args.limit || 100);
      return rows.filter((o) => o.orgCustomerId === args.orgCustomerId);
    }

    const orders = await q.take(args.limit || 100);

    return orders;
  },
});

// Get org order by ID
export const getOrgOrderById = query({
  args: { orderId: v.id("org_orders") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get order
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Org order not found");
    }

    return order;
  },
});

// Create new org order
export const createOrgOrder = mutation({
  args: {
    clerkOrganizationId: v.optional(v.string()),
    inboundSum: v.optional(v.string()),
    inboundTicker: v.optional(v.string()),
    inboundType: v.optional(v.string()),
    outboundSum: v.optional(v.string()),
    outboundTicker: v.optional(v.string()),
    outboundType: v.optional(v.string()),
    fxRate: v.optional(v.number()),
    finalRate: v.optional(v.number()),
    margin: v.optional(v.number()),
    fee: v.optional(v.number()),
    networkFee: v.optional(v.number()),
    status: v.optional(v.string()),
    orgSessionId: v.id("org_cx_sessions"),
    userId: v.optional(v.id("users")),
    orgCustomerId: v.optional(v.id("org_customers")),
    inboundOrgRepositoryId: v.optional(v.id("org_repositories")),
    outboundOrgRepositoryId: v.optional(v.id("org_repositories")),
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

    // Create order
    const orderId = await ctx.db.insert("org_orders", {
      clerkOrganizationId: orgId,
      clerk_org_id: orgId,
      org_id: organization._id,
      inboundSum: args.inboundSum,
      inboundTicker: args.inboundTicker,
      inboundType: args.inboundType,
      outboundSum: args.outboundSum,
      outboundTicker: args.outboundTicker,
      outboundType: args.outboundType,
      fxRate: args.fxRate,
      finalRate: args.finalRate,
      margin: args.margin,
      fee: args.fee,
      networkFee: args.networkFee || 0,
      status: args.status || "QUOTE",
      orgSessionId: args.orgSessionId,
      userId: args.userId,
      orgCustomerId: args.orgCustomerId,
      inboundOrgRepositoryId: args.inboundOrgRepositoryId,
      outboundOrgRepositoryId: args.outboundOrgRepositoryId,
      batchedStatus: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: user._id,
    });

    return orderId;
  },
});

// Update org order
export const updateOrgOrder = mutation({
  args: {
    orderId: v.id("org_orders"),
    inboundSum: v.optional(v.string()),
    outboundSum: v.optional(v.string()),
    fxRate: v.optional(v.number()),
    finalRate: v.optional(v.number()),
    margin: v.optional(v.number()),
    fee: v.optional(v.number()),
    networkFee: v.optional(v.number()),
    status: v.optional(v.string()),
    closeDt: v.optional(v.number()),
    orgCustomerId: v.optional(v.id("org_customers")),
  },
  handler: async (ctx, args) => {
    console.log("🔍 updateOrgOrder - Called with args:", {
      orderId: args.orderId,
      orgCustomerId: args.orgCustomerId,
      hasOrgCustomerId: args.orgCustomerId !== undefined,
    });

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get order
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Org order not found");
    }

    console.log(
      "🔍 updateOrgOrder - Current order orgCustomerId:",
      (order as any).orgCustomerId
    );

    // Update order
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.inboundSum !== undefined) updateData.inboundSum = args.inboundSum;
    if (args.outboundSum !== undefined)
      updateData.outboundSum = args.outboundSum;
    if (args.fxRate !== undefined) updateData.fxRate = args.fxRate;
    if (args.finalRate !== undefined) updateData.finalRate = args.finalRate;
    if (args.margin !== undefined) updateData.margin = args.margin;
    if (args.fee !== undefined) updateData.fee = args.fee;
    if (args.networkFee !== undefined) updateData.networkFee = args.networkFee;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.closeDt !== undefined) updateData.closeDt = args.closeDt;
    if (args.orgCustomerId !== undefined) {
      updateData.orgCustomerId = args.orgCustomerId;
      console.log(
        "🔍 updateOrgOrder - Setting orgCustomerId to:",
        args.orgCustomerId
      );
    }

    console.log("🔍 updateOrgOrder - Final updateData:", updateData);
    await ctx.db.patch(args.orderId, updateData);
    console.log("✅ updateOrgOrder - Order updated successfully");
    return true;
  },
});

// Delete org order
export const deleteOrgOrder = mutation({
  args: {
    orderId: v.id("org_orders"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get order
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Org order not found");
    }

    // Delete order
    await ctx.db.delete(args.orderId);
    return true;
  },
});
