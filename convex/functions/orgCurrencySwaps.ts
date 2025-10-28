import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const getSessionSwaps = query({
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

    const swaps = await ctx.db
      .query("org_currency_swaps")
      .withIndex("by_org_session", (q) => q.eq("orgSessionId", args.sessionId))
      .order("desc")
      .collect();

    const enrichedSwaps = await Promise.all(
      swaps.map(async (swap) => {
        const inboundRepo = await ctx.db.get(swap.inboundOrgRepositoryId);
        const outboundRepo = await ctx.db.get(swap.outboundOrgRepositoryId);
        const creator = await ctx.db.get(swap.createdBy);

        const breakdowns = await ctx.db
          .query("org_breakdowns")
          .withIndex("by_breakable", (q) =>
            q
              .eq("breakableType", "CURRENCY_SWAP")
              .eq("breakableId", swap._id)
          )
          .collect();

        return {
          ...swap,
          inboundRepositoryName: inboundRepo?.name || "Unknown",
          outboundRepositoryName: outboundRepo?.name || "Unknown",
          createdByName: creator?.name || "Unknown",
          breakdowns,
        };
      })
    );

    return enrichedSwaps;
  },
});

export const createSwap = mutation({
  args: {
    sessionId: v.id("org_cx_sessions"),
    inboundRepositoryId: v.id("org_repositories"),
    outboundRepositoryId: v.id("org_repositories"),
    ticker: v.string(),
    inboundSum: v.string(),
    outboundSum: v.string(),
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
      throw new Error("Inbound sum cannot be 0 for CurrencySwap");
    }

    if (parseFloat(args.outboundSum) === 0) {
      throw new Error("Outbound sum cannot be 0 for CurrencySwap");
    }

    const inboundRepo = await ctx.db.get(args.inboundRepositoryId);
    const outboundRepo = await ctx.db.get(args.outboundRepositoryId);

    if (!inboundRepo || !outboundRepo) {
      throw new Error("Repository not found");
    }

    const organization = await ctx.db.get(session.org_id);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const currency = await ctx.db
      .query("org_currencies")
      .withIndex("by_ticker", (q) => q.eq("ticker", args.ticker))
      .filter((q) => q.eq(q.field("org_id"), session.org_id))
      .first();

    if (!currency) {
      throw new Error("Currency not found");
    }

    const swapId = await ctx.db.insert("org_currency_swaps", {
      clerkOrganizationId: organization.clerkOrganizationId,
      clerk_org_id: organization.clerk_org_id,
      org_id: session.org_id,
      orgSessionId: args.sessionId,
      userId: user._id,
      orgCurrencyId: currency._id,
      inboundOrgRepositoryId: args.inboundRepositoryId,
      outboundOrgRepositoryId: args.outboundRepositoryId,
      inboundTicker: args.ticker,
      outboundTicker: args.ticker,
      inboundSum: args.inboundSum,
      outboundSum: args.outboundSum,
      swapValue: args.inboundSum,
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
          breakableType: "CURRENCY_SWAP",
          breakableId: swapId.toString(),
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
        event: "SWAP_CREATED",
        userId: user._id,
        orgSessionId: args.sessionId,
        referenceId: swapId.toString(),
        comment: "",
        meta: "",
        createdAt: Date.now(),
        createdBy: user._id,
      });

      return { success: true, swapId };
    } catch (error) {
      await ctx.db.delete(swapId);
      throw error;
    }
  },
});
