import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const getSessionTransfers = query({
  args: {
    sessionId: v.id("org_cx_sessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const transfers = await ctx.db
      .query("org_float_transfers")
      .withIndex("by_org_session", (q) => q.eq("orgSessionId", args.sessionId))
      .order("desc")
      .collect();

    const enrichedTransfers = await Promise.all(
      transfers.map(async (transfer) => {
        const fromRepo = await ctx.db.get(transfer.outboundOrgRepositoryId);
        const toRepo = await ctx.db.get(transfer.inboundOrgRepositoryId);
        const creator = await ctx.db.get(transfer.createdBy);

        const breakdowns = await ctx.db
          .query("org_breakdowns")
          .withIndex("by_breakable", (q) =>
            q
              .eq("breakableType", "FLOAT_TRANSFER")
              .eq("breakableId", transfer._id)
          )
          .collect();

        return {
          ...transfer,
          from: fromRepo?.name || "Unknown",
          to: toRepo?.name || "Unknown",
          createdByName: creator?.name || "Unknown",
          breakdowns,
        };
      })
    );

    return enrichedTransfers;
  },
});

export const createTransfer = mutation({
  args: {
    sessionId: v.id("org_cx_sessions"),
    outboundRepositoryId: v.id("org_repositories"),
    inboundRepositoryId: v.id("org_repositories"),
    outboundTicker: v.string(),
    inboundTicker: v.string(),
    outboundSum: v.string(),
    inboundSum: v.string(),
    breakdowns: v.array(
      v.object({
        floatStackId: v.id("org_float_stacks"),
        repositoryId: v.id("org_repositories"),
        count: v.string(),
        direction: v.string(),
        denominationId: v.id("org_denominations"),
        denominationValue: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "FLOAT_OPEN_COMPLETE") {
      throw new Error("Session must be open for business");
    }

    if (!user.active) {
      throw new Error("User must be active");
    }

    if (parseFloat(args.inboundSum) === 0) {
      throw new Error("Inbound sum cannot be 0 for FloatTransfer");
    }

    if (parseFloat(args.outboundSum) === 0) {
      throw new Error("Outbound sum cannot be 0 for FloatTransfer");
    }

    const outboundRepo = await ctx.db.get(args.outboundRepositoryId);
    const inboundRepo = await ctx.db.get(args.inboundRepositoryId);

    if (!outboundRepo || !inboundRepo) {
      throw new Error("Repository not found");
    }

    const organization = await ctx.db.get(session.org_id);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const transferId = await ctx.db.insert("org_float_transfers", {
      clerkOrganizationId: organization.clerkOrganizationId,
      clerk_org_id: organization.clerk_org_id,
      org_id: session.org_id,
      orgSessionId: args.sessionId,
      userId: user._id,
      inboundOrgRepositoryId: args.inboundRepositoryId,
      outboundOrgRepositoryId: args.outboundRepositoryId,
      inboundTicker: args.inboundTicker,
      outboundTicker: args.outboundTicker,
      inboundSum: args.inboundSum,
      outboundSum: args.outboundSum,
      status: "COMPLETED",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: user._id,
    });

    try {
      for (const breakdown of args.breakdowns) {
        const floatStack = await ctx.db.get(breakdown.floatStackId);
        if (!floatStack) {
          throw new Error(`Float stack not found: ${breakdown.floatStackId}`);
        }

        const count = parseFloat(breakdown.count);
        const isOutbound = breakdown.direction === "OUTBOUND";

        const currentCloseCount = floatStack.closeCount ?? 0;
        const newCloseCount = isOutbound
          ? currentCloseCount - count
          : currentCloseCount + count;

        await ctx.db.patch(breakdown.floatStackId, {
          closeCount: newCloseCount,
          updatedAt: Date.now(),
        });

        await ctx.db.insert("org_breakdowns", {
          clerkOrganizationId: organization.clerkOrganizationId,
          clerk_org_id: organization.clerk_org_id,
          org_id: session.org_id,
          breakableType: "FLOAT_TRANSFER",
          breakableId: transferId.toString(),
          orgFloatStackId: breakdown.floatStackId,
          orgDenominationId: breakdown.denominationId,
          count: breakdown.count,
          direction: breakdown.direction,
          status: "COMMITTED",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: user._id,
        });
      }

      await ctx.db.insert("org_activities", {
        clerkOrganizationId: organization.clerkOrganizationId,
        clerk_org_id: organization.clerk_org_id,
        org_id: session.org_id,
        event: "TRANSFER_CREATED",
        userId: user._id,
        orgSessionId: args.sessionId,
        referenceId: transferId.toString(),
        comment: "",
        meta: "",
        createdAt: Date.now(),
        createdBy: user._id,
      });

      return { success: true, transferId };
    } catch (error) {
      await ctx.db.delete(transferId);
      throw error;
    }
  },
});
