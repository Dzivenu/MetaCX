import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Get float data for a session including repositories and float stacks
export const getSessionFloat = query({
  args: {
    sessionId: v.id("org_cx_sessions"),
    _refreshTrigger: v.optional(v.number()), // Force refresh parameter
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Resolve current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    // Get the session
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Check if user is authorized for this session (IDs stored as strings)
    const isAuthorized = (session.authorizedUserIds || []).includes(
      `${user._id}`
    );
    if (!isAuthorized) {
      throw new Error("User not authorized for this session");
    }

    // Allow float data to load for UI guidance during lifecycle states
    // Hard-block only when session is explicitly closed or cancelled
    const allowedStates = [
      "DORMANT",
      "FLOAT_OPEN_START",
      "FLOAT_OPEN_COMPLETE",
      "FLOAT_CLOSE_START",
    ];
    if (session.status && !allowedStates.includes(session.status)) {
      throw new Error(
        `Float access not allowed in ${session.status} state. ` +
          `Allowed states: ${allowedStates.join(", ")}.`
      );
    }

    // Get organization
    const organization = await ctx.db.get(session.org_id);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Get repositories for this organization
    const repositories = await ctx.db
      .query("org_repositories")
      .withIndex("by_org_id", (q) => q.eq("org_id", session.org_id))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    // Get float stacks for this session (use direct session index)
    const floatStacks = await ctx.db
      .query("org_float_stacks")
      .withIndex("by_org_session", (q) => q.eq("orgSessionId", args.sessionId))
      .collect();

    // Get denominations to enrich float stack data
    const denominationIds = floatStacks.map((stack) => stack.orgDenominationId);
    const denominations = await Promise.all(
      denominationIds.map((id) => ctx.db.get(id))
    );

    // Build denominationId -> denomination map for quick lookups
    const denomMap = new Map(
      denominations
        .filter((d): d is NonNullable<typeof d> => !!d)
        .map((d) => [d._id, d])
    );

    // Load currencies for this org to enrich currency name/type
    const orgCurrencies = await ctx.db
      .query("org_currencies")
      .withIndex("by_org_id", (q) => q.eq("org_id", session.org_id))
      .collect();
    const tickerToCurrency = new Map<string, any>();
    for (const c of orgCurrencies) {
      const t = (c.ticker || "").toString();
      if (t) tickerToCurrency.set(t, c);
    }

    // Get repository access logs for this session
    const accessLogs = await ctx.db
      .query("org_repository_access_logs")
      .withIndex("by_org_id", (q) => q.eq("org_id", session.org_id))
      .filter((q) => q.eq(q.field("orgSessionId"), args.sessionId))
      .collect();

    // Group float stacks by repository and denomination to create currency float structure
    const repositoryFloatMap = new Map();

    floatStacks.forEach((stack) => {
      const repoId = stack.orgRepositoryId;
      const denomination = denomMap.get(stack.orgDenominationId);

      if (!repositoryFloatMap.has(repoId)) {
        repositoryFloatMap.set(repoId, {});
      }

      const ticker = stack.ticker;
      const currency = tickerToCurrency.get(ticker);
      if (!repositoryFloatMap.get(repoId)[ticker]) {
        repositoryFloatMap.get(repoId)[ticker] = {
          id: `${repoId}_${ticker}`,
          ticker,
          name: (currency?.name as string) || ticker,
          typeof: (currency?.typeOf as string) || "currency",
          floatStacks: [],
        };
      }

      repositoryFloatMap.get(repoId)[ticker].floatStacks.push({
        id: stack._id,
        openCount: stack.openCount || 0,
        closeCount: stack.closeCount || 0,
        middayCount: stack.middayCount || 0,
        lastSessionCount: stack.lastSessionCount || 0,
        spentDuringSession: stack.spentDuringSession || "0.0",
        transferredDuringSession: stack.transferredDuringSession || 0,
        denominatedValue: stack.denominatedValue || 0,
        ticker: stack.ticker,
        openSpot: stack.openSpot || 0,
        closeSpot: stack.closeSpot || 0,
        averageSpot: stack.averageSpot || 0,
        openConfirmedDt: stack.openConfirmedDt || null,
        closeConfirmedDt: stack.closeConfirmedDt || null,
        value: stack.denominatedValue || 0,
        denomination: {
          id: denomination?._id || "",
          value: denomination?.value || 0,
          name: denomination?.name || ticker,
        },
      });
    });

    // Build the final repository structure
    const enrichedRepositories = repositories.map((repo) => {
      // Access logs for this repository
      const repoAccessLogs = accessLogs
        .filter((log) => log.orgRepositoryId === repo._id)
        .sort(
          (a, b) => (a.updatedAt || a.createdAt) - (b.updatedAt || b.createdAt)
        );

      // Derive repository state from access log timestamps
      let state = "DORMANT" as
        | "DORMANT"
        | "OPEN_START"
        | "OPEN_CONFIRMED"
        | "CLOSE_START";
      if (repoAccessLogs.length > 0) {
        const latest = repoAccessLogs[repoAccessLogs.length - 1];
        console.log(`🔍 Repository ${repo.name} latest access log:`, {
          openStartDt: latest.openStartDt,
          openConfirmDt: latest.openConfirmDt,
          closeStartDt: latest.closeStartDt,
          closeConfirmDt: latest.closeConfirmDt,
        });
        if (latest.closeConfirmDt) {
          state = "DORMANT";
        } else if (latest.closeStartDt) {
          state = "CLOSE_START";
        } else if (latest.openConfirmDt) {
          state = "OPEN_CONFIRMED";
        } else if (latest.openStartDt) {
          state = "OPEN_START";
        }
        console.log(`🏪 Repository ${repo.name} state determined: ${state}`);
      }

      const repoFloatData = repositoryFloatMap.get(repo._id) || {};
      const floatArray = Object.values(repoFloatData);

      console.log(`💰 Repository ${repo.name} float data:`, {
        floatCurrencies: floatArray.length,
        currencies: floatArray.map((f: any) => ({
          ticker: f.ticker,
          stackCount: f.floatStacks.length,
        })),
      });

      return {
        id: repo._id,
        name: repo.name,
        type_of_currencies: repo.currencyType || repo.typeOf || "currency", // Add currency type field
        floatCountRequired: repo.floatCountRequired || false,
        active: repo.active !== false,
        state,
        accessLogs: repoAccessLogs,
        float: floatArray,
      };
    });

    return {
      session: {
        id: session._id,
        status: session.status || "DORMANT",
        userId: session.userId,
        clerkOrganizationId: session.clerkOrganizationId,
      },
      repositories: enrichedRepositories,
      branches: [], // TODO: Add branches if needed
    };
  },
});

// Start float operation (open/close)
export const startFloat = mutation({
  args: {
    sessionId: v.id("org_cx_sessions"),
    action: v.union(
      v.literal("START_OPEN"),
      v.literal("START_CLOSE"),
      v.literal("CANCEL_CLOSE")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Resolve current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    // Get the session
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    let newState;
    let updateData: any = {
      updatedAt: Date.now(),
    };

    switch (args.action) {
      case "START_OPEN":
        newState = "FLOAT_OPEN_START";
        updateData.openStartDt = Date.now();
        updateData.openStartUserId = user._id;
        break;
      case "START_CLOSE":
        newState = "FLOAT_CLOSE_START";
        updateData.closeStartDt = Date.now();
        updateData.closeStartUserId = user._id;
        break;
      case "CANCEL_CLOSE":
        newState = "FLOAT_OPEN_COMPLETE";
        break;
    }

    updateData.status = newState;

    await ctx.db.patch(args.sessionId, updateData);

    return { success: true, newState };
  },
});

// Confirm float operation
export const confirmFloat = mutation({
  args: {
    sessionId: v.id("org_cx_sessions"),
    action: v.union(v.literal("CONFIRM_OPEN"), v.literal("CONFIRM_CLOSE")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Resolve current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    // Get the session
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    let newState;
    let updateData: any = {
      updatedAt: Date.now(),
    };

    switch (args.action) {
      case "CONFIRM_OPEN":
        newState = "FLOAT_OPEN_COMPLETE";
        updateData.openConfirmDt = Date.now();
        updateData.openConfirmUserId = user._id;
        break;
      case "CONFIRM_CLOSE":
        newState = "FLOAT_CLOSE_COMPLETE";
        updateData.closeConfirmDt = Date.now();
        updateData.closeConfirmUserId = user._id;
        break;
    }

    updateData.status = newState;

    await ctx.db.patch(args.sessionId, updateData);

    return { success: true, newState };
  },
});

// Update repository float stack
export const updateRepositoryFloat = mutation({
  args: {
    floatStackId: v.id("org_float_stacks"),
    updates: v.object({
      openCount: v.optional(v.number()),
      closeCount: v.optional(v.number()),
      middayCount: v.optional(v.number()),
      openConfirmedDt: v.optional(v.number()),
      closeConfirmedDt: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const updateData = {
      ...args.updates,
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.floatStackId, updateData);

    return { success: true };
  },
});

// Validate repository float (placeholder for validation logic)
export const validateRepositoryFloat = mutation({
  args: {
    repositoryId: v.id("org_repositories"),
    sessionId: v.id("org_cx_sessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // TODO: Implement validation logic
    return { success: true, isValid: true };
  },
});
