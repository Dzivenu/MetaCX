import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// List breakdowns for a breakable entity (e.g., order)
export const listByBreakable = query({
  args: {
    breakableType: v.string(),
    breakableId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const rows = await ctx.db
      .query("org_breakdowns")
      .withIndex("by_breakable", (q) =>
        q
          .eq("breakableType", args.breakableType)
          .eq("breakableId", args.breakableId)
      )
      .order("asc")
      .collect();

    // Enrich with denomination data
    const enrichedRows = await Promise.all(
      rows.map(async (row) => {
        let denominatedValue = 0;
        if (row.orgDenominationId) {
          const denomination = await ctx.db.get(row.orgDenominationId);
          if (denomination) {
            denominatedValue = Number(denomination.value || 0);
          }
        }
        return {
          ...row,
          denominatedValue,
        };
      })
    );

    return enrichedRows;
  },
});

// Upsert a set of breakdowns for a breakable entity
export const setForBreakable = mutation({
  args: {
    breakableType: v.string(),
    breakableId: v.string(),
    breakdowns: v.array(
      v.object({
        orgDenominationId: v.id("org_denominations"),
        orgFloatStackId: v.optional(v.id("org_float_stacks")),
        count: v.string(),
        direction: v.string(), // INBOUND | OUTBOUND
        status: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Resolve user and organization
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Try to infer organization from an order if applicable
    let orgId: any = null;
    let orderDoc: any = null;
    if (args.breakableType === "org_orders") {
      // Fetch the order by direct id; infer organization from it
      orderDoc = await ctx.db.get(args.breakableId as any);
      if (orderDoc && (orderDoc as any).org_id) {
        orgId = (orderDoc as any).org_id;
      }
    }

    // Fallback: resolve organization from Clerk organization id on identity
    if (!orgId) {
      const clerkOrgId =
        typeof (identity as any).org_id === "string"
          ? ((identity as any).org_id as string)
          : undefined;
      if (clerkOrgId) {
        const organization = await ctx.db
          .query("organizations")
          .withIndex("by_clerk_id", (q) =>
            q.eq("clerkOrganizationId", clerkOrgId)
          )
          .first();
        if (organization) {
          orgId = organization._id;
        }
      }
    }

    if (!orgId) {
      throw new Error("Unable to resolve organization for breakdowns");
    }

    const now = Date.now();

    // Determine the direction(s) being updated
    const directions = new Set(args.breakdowns.map((b) => b.direction));

    // Remove existing breakdowns for this breakable AND specific direction(s)
    const existing = await ctx.db
      .query("org_breakdowns")
      .withIndex("by_breakable", (q) =>
        q
          .eq("breakableType", args.breakableType)
          .eq("breakableId", args.breakableId)
      )
      .collect();

    // Only delete breakdowns that match the directions being updated
    for (const row of existing) {
      if (row.direction && directions.has(row.direction)) {
        await ctx.db.delete(row._id);
      }
    }

    // Insert new breakdowns
    for (const b of args.breakdowns) {
      await ctx.db.insert("org_breakdowns", {
        clerkOrganizationId:
          (typeof (identity as any).org_id === "string"
            ? ((identity as any).org_id as string)
            : "") || "",
        clerk_org_id:
          (typeof (identity as any).org_id === "string"
            ? ((identity as any).org_id as string)
            : "") || "",
        org_id: orgId,
        breakableType: args.breakableType,
        breakableId: args.breakableId,
        orgDenominationId: b.orgDenominationId,
        count: b.count,
        direction: b.direction,
        orgFloatStackId: b.orgFloatStackId,
        status: b.status || "CREATED",
        createdAt: now,
        updatedAt: now,
        createdBy: user._id,
      });
    }

    return { success: true };
  },
});

// Commit or uncommit breakdowns (status change only)
export const setCommitted = mutation({
  args: {
    breakableType: v.string(),
    breakableId: v.string(),
    committed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const status = args.committed ? "COMMITTED" : "CREATED";
    const rows = await ctx.db
      .query("org_breakdowns")
      .withIndex("by_breakable", (q) =>
        q
          .eq("breakableType", args.breakableType)
          .eq("breakableId", args.breakableId)
      )
      .collect();
    for (const row of rows) {
      await ctx.db.patch(row._id, { status, updatedAt: Date.now() });
    }
    return { success: true };
  },
});

// Delete breakdowns for a breakable entity
export const clearForBreakable = mutation({
  args: {
    breakableType: v.string(),
    breakableId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const rows = await ctx.db
      .query("org_breakdowns")
      .withIndex("by_breakable", (q) =>
        q
          .eq("breakableType", args.breakableType)
          .eq("breakableId", args.breakableId)
      )
      .collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
    return { success: true };
  },
});
