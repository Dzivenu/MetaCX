import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Get active sessions for the user's organization
export const getActiveSessions = query({
  args: {
    clerkOrganizationId: v.optional(v.string()),
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

    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) {
      return [];
    }

    // Prefer sessions where this user is explicitly active
    const activeUserSessions = await ctx.db
      .query("org_cx_sessions")
      .withIndex("by_active_user", (q) => q.eq("activeUserId", user._id))
      .collect();
    console.log("🔍 Active user sessions found:", activeUserSessions.length);
    const validActive = activeUserSessions.filter((s) => {
      const status = s.status;
      return (
        status === "DORMANT" ||
        status === "FLOAT_OPEN_START" ||
        status === "FLOAT_OPEN_COMPLETE" ||
        status === "FLOAT_CLOSE_START" ||
        status === "open" ||
        status === "pending_open" ||
        status === "pending_close"
      );
    });
    console.log("🔍 Valid active sessions:", validActive.length);
    if (validActive.length > 0) {
      console.log(
        "🔍 Returning active user sessions:",
        validActive.map((s) => ({ id: s._id, status: s.status }))
      );
      return validActive
        .sort((a, b) => (b.openStartDt || 0) - (a.openStartDt || 0))
        .map((s) => ({ ...s, id: s._id }));
    }

    // Otherwise, sessions in the org that list this user as authorized
    const orgSessions = await ctx.db
      .query("org_cx_sessions")
      .withIndex("by_organization", (q) => q.eq("clerkOrganizationId", orgId))
      .collect();
    const userIdStr = `${user._id}`;
    const authorizedSessions = orgSessions.filter((s) => {
      const status = s.status;
      const allowed =
        status === "DORMANT" ||
        status === "FLOAT_OPEN_START" ||
        status === "FLOAT_OPEN_COMPLETE" ||
        status === "FLOAT_CLOSE_START" ||
        status === "open" ||
        status === "pending_open" ||
        status === "pending_close";
      return allowed && (s.authorizedUserIds || []).includes(userIdStr);
    });
    if (authorizedSessions.length > 0) {
      return authorizedSessions
        .sort((a, b) => (b.openStartDt || 0) - (a.openStartDt || 0))
        .map((s) => ({ ...s, id: s._id }));
    }

    // Fallback: all open/pending sessions in the org
    const fallback = orgSessions.filter((s) => {
      const status = s.status;
      return (
        status === "DORMANT" ||
        status === "FLOAT_OPEN_START" ||
        status === "FLOAT_OPEN_COMPLETE" ||
        status === "FLOAT_CLOSE_START" ||
        status === "open" ||
        status === "pending_open" ||
        status === "pending_close"
      );
    });
    return fallback
      .sort((a, b) => (b.openStartDt || 0) - (a.openStartDt || 0))
      .map((s) => ({
        ...s,
        id: s._id,
      }));
  },
});

// Get session by ID (org_cx_sessions)
export const getSessionById = query({
  args: { sessionId: v.id("org_cx_sessions") },
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

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const userOrgClerkId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    const currentOrg = userOrgClerkId
      ? await ctx.db
          .query("organizations")
          .withIndex("by_clerk_id", (q) =>
            q.eq("clerkOrganizationId", userOrgClerkId)
          )
          .first()
      : null;
    const authorized = currentOrg
      ? session.org_id
        ? session.org_id === currentOrg._id
        : session.clerkOrganizationId === userOrgClerkId
      : false;
    if (!authorized) {
      throw new Error(
        "Unauthorized: Session belongs to a different organization"
      );
    }

    // Return raw values (numbers/strings/Ids). Do not return Date objects from Convex.
    return {
      id: session._id,
      openStartDt: session.openStartDt ?? null,
      openConfirmDt: session.openConfirmDt ?? null,
      closeStartDt: session.closeStartDt ?? null,
      closeConfirmDt: session.closeConfirmDt ?? null,
      userId: session.userId ?? null,
      organizationId: session.clerkOrganizationId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      status: session.status ?? null,
      verifiedByUserId: session.verifiedByUserId ?? null,
      verifiedDt: session.verifiedDt ?? null,
      openStartUserId: session.openStartUserId ?? null,
      openConfirmUserId: session.openConfirmUserId ?? null,
      closeStartUserId: session.closeStartUserId ?? null,
      closeConfirmUserId: session.closeConfirmUserId ?? null,
    };
  },
});

// List sessions with pagination and filtering for an organization
export const getSessionsWithPagination = query({
  args: {
    clerkOrganizationId: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    state: v.optional(v.string()), // alias for status
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) {
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    const page = args.page || 1;
    const limit = args.limit || 10;
    const skip = (page - 1) * limit;

    let baseQuery = ctx.db
      .query("org_cx_sessions")
      .withIndex("by_organization", (q) => q.eq("clerkOrganizationId", orgId));

    if (args.state) {
      baseQuery = baseQuery.filter((q) => q.eq(q.field("status"), args.state));
    }

    const allSessions = await baseQuery.collect();
    const total = allSessions.length;
    const totalPages = Math.ceil(total / limit);

    let sortedSessions = allSessions;
    if (args.sortBy) {
      const sortKey = args.sortBy as keyof (typeof allSessions)[0];
      sortedSessions = allSessions.sort((a, b) => {
        const aVal = (a as any)[sortKey];
        const bVal = (b as any)[sortKey];
        if (args.sortOrder === "asc") {
          return (aVal || 0) > (bVal || 0) ? 1 : -1;
        } else {
          return (aVal || 0) < (bVal || 0) ? 1 : -1;
        }
      });
    } else {
      sortedSessions = allSessions.sort((a, b) => b.createdAt - a.createdAt);
    }

    const paginatedSessions = sortedSessions.slice(skip, skip + limit);

    return {
      data: paginatedSessions.map((session) => ({
        id: session._id,
        openStartDt: session.openStartDt ?? null,
        openConfirmDt: session.openConfirmDt ?? null,
        closeStartDt: session.closeStartDt ?? null,
        closeConfirmDt: session.closeConfirmDt ?? null,
        userId: session.userId ?? null,
        organizationId: session.clerkOrganizationId,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        status: session.status ?? null,
        verifiedByUserId: session.verifiedByUserId ?? null,
        verifiedDt: session.verifiedDt ?? null,
        openStartUserId: session.openStartUserId ?? null,
        openConfirmUserId: session.openConfirmUserId ?? null,
        closeStartUserId: session.closeStartUserId ?? null,
        closeConfirmUserId: session.closeConfirmUserId ?? null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },
});

// Create new org cx session
export const createCxSession = mutation({
  args: {
    organizationId: v.optional(v.string()), // Clerk org id
    role: v.optional(v.string()),
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

    const clerkOrgId =
      args.organizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!clerkOrgId) {
      throw new Error("No active organization selected");
    }

    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_id", (q) => q.eq("clerkOrganizationId", clerkOrgId))
      .first();
    if (!organization) {
      throw new Error("Organization not found in database");
    }

    const now = Date.now();

    const sessionId = await ctx.db.insert("org_cx_sessions", {
      openStartDt: now,
      userId: user._id,
      clerkOrganizationId: clerkOrgId,
      clerk_org_id: clerkOrgId,
      org_id: organization._id,
      status: "DORMANT", // Start in DORMANT state - must go through float opening process
      verifiedByUserId: undefined,
      verifiedDt: undefined,
      openStartUserId: user._id,
      openConfirmUserId: undefined,
      closeStartUserId: undefined,
      closeConfirmUserId: undefined,
      activeUserId: user._id,
      authorizedUserIds: [`${user._id}`], // Convert to string for proper storage and comparison
      createdAt: now,
      updatedAt: now,
      createdBy: user._id,
    });

    const session = await ctx.db.get(sessionId);
    if (!session) {
      throw new Error("Failed to create session");
    }

    // Automatically join the creator to the session by calling joinSession
    console.log("🔄 Auto-joining creator to newly created session");
    try {
      // The creator is already in authorizedUserIds, so just set them as active
      await ctx.db.patch(sessionId, {
        activeUserId: user._id,
        updatedAt: Date.now(),
      });

      // Create session access log
      await ctx.db.insert("org_cx_session_access_logs", {
        orgSessionId: sessionId,
        clerkOrganizationId: clerkOrgId,
        clerk_org_id: clerkOrgId,
        org_id: organization._id,
        startDt: now,
        startOwnerId: user._id,
        userJoinDt: now,
        userJoinId: user._id,
        authorizedUsers: [`${user._id}`],
        createdAt: now,
        updatedAt: now,
        createdBy: user._id,
      });

      console.log("✅ Creator auto-joined to session successfully", {
        sessionId,
        userId: user._id,
        activeUserId: user._id,
        authorizedUserIds: [`${user._id}`],
      });
    } catch (error) {
      console.error("❌ Failed to auto-join creator to session:", error);
      // Don't throw - session creation succeeded, just log the warning
    }

    // Return raw values (numbers/strings/Ids). Do not return Date objects from Convex.
    return {
      id: session._id,
      openStartDt: session.openStartDt ?? null,
      openConfirmDt: session.openConfirmDt ?? null,
      closeStartDt: session.closeStartDt ?? null,
      closeConfirmDt: session.closeConfirmDt ?? null,
      userId: session.userId ?? null,
      organizationId: session.clerkOrganizationId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      status: session.status ?? null,
      verifiedByUserId: session.verifiedByUserId ?? null,
      verifiedDt: session.verifiedDt ?? null,
      openStartUserId: session.openStartUserId ?? null,
      openConfirmUserId: session.openConfirmUserId ?? null,
      closeStartUserId: session.closeStartUserId ?? null,
      closeConfirmUserId: session.closeConfirmUserId ?? null,
    };
  },
});

// Join session (for multi-user sessions)
export const joinSession = mutation({
  args: {
    sessionId: v.id("org_cx_sessions"),
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("🚀 joinSession mutation called with args:", args);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    console.log("🚀 Identity:", {
      subject: identity.subject,
      org_id: identity.org_id,
    });

    // Resolve current user
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

    const userOrgClerkId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    const currentOrg = userOrgClerkId
      ? await ctx.db
          .query("organizations")
          .withIndex("by_clerk_id", (q) =>
            q.eq("clerkOrganizationId", userOrgClerkId)
          )
          .first()
      : null;
    const authorized = currentOrg
      ? session.org_id
        ? session.org_id === currentOrg._id
        : session.clerkOrganizationId === userOrgClerkId
      : false;
    if (!authorized) {
      throw new Error(
        "Unauthorized: Session belongs to a different organization"
      );
    }

    // Add user to session authorized list and set as active
    const now = Date.now();
    const userIdStr = `${user._id}`; // Convert to string for consistent storage
    const currentAuthorizedUserIds = session.authorizedUserIds || [];

    // Check if user is already authorized (comparing strings)
    const isAlreadyAuthorized = currentAuthorizedUserIds.some(
      (id) => id === userIdStr
    );

    const authorizedUserIds = isAlreadyAuthorized
      ? currentAuthorizedUserIds
      : [...currentAuthorizedUserIds, userIdStr];

    await ctx.db.patch(args.sessionId, {
      authorizedUserIds,
      activeUserId: user._id,
      updatedAt: now,
    });
    console.log("🔄 Session updated - activeUserId set to:", user._id);
    console.log("🔄 Authorized user IDs:", authorizedUserIds);

    // Upsert access log for this session
    let accessLog = await ctx.db
      .query("org_cx_session_access_logs")
      .withIndex("by_org_session", (q) => q.eq("orgSessionId", args.sessionId))
      .first();
    if (!accessLog) {
      accessLog = (await ctx.db.insert("org_cx_session_access_logs", {
        orgSessionId: args.sessionId,
        clerkOrganizationId: session.clerkOrganizationId,
        clerk_org_id: session.clerkOrganizationId,
        org_id: session.org_id,
        startDt: now,
        startOwnerId: session.userId || user._id,
        userJoinDt: now,
        userJoinId: user._id,
        authorizedUsers: [`${user._id}`], // Convert to string for consistency
        createdAt: now,
        updatedAt: now,
        createdBy: user._id,
      })) as any;
    } else {
      const currentAuthorizedUsers = accessLog.authorizedUsers || [];
      const isAlreadyInLog = currentAuthorizedUsers.some(
        (id) => id === userIdStr
      );
      const logAuthorized = isAlreadyInLog
        ? currentAuthorizedUsers
        : [...currentAuthorizedUsers, userIdStr];

      await ctx.db.patch(accessLog._id, {
        userJoinDt: now,
        userJoinId: user._id,
        authorizedUsers: logAuthorized,
        updatedAt: now,
      });
    }

    return {
      id: session._id,
      openStartDt: session.openStartDt ?? null,
      openConfirmDt: session.openConfirmDt ?? null,
      closeStartDt: session.closeStartDt ?? null,
      closeConfirmDt: session.closeConfirmDt ?? null,
      userId: session.userId ?? null,
      organizationId: session.clerkOrganizationId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      status: session.status ?? null,
      verifiedByUserId: session.verifiedByUserId ?? null,
      verifiedDt: session.verifiedDt ?? null,
      openStartUserId: session.openStartUserId ?? null,
      openConfirmUserId: session.openConfirmUserId ?? null,
      closeStartUserId: session.closeStartUserId ?? null,
      closeConfirmUserId: session.closeConfirmUserId ?? null,
    };
  },
});

// Leave session (for multi-user sessions)
export const leaveSession = mutation({
  args: { sessionId: v.id("org_cx_sessions") },
  handler: async (ctx, args) => {
    console.log("🚪 leaveSession mutation called with args:", args);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    console.log("🚪 Identity:", {
      subject: identity.subject,
      org_id: identity.org_id,
    });

    // Resolve current user
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

    // Get user's organization context - try multiple approaches
    let userOrgClerkId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;

    // If no org ID from identity, try to get from user's organization memberships
    if (!userOrgClerkId) {
      const membership = await ctx.db
        .query("org_memberships")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (membership) {
        userOrgClerkId = membership.clerkOrganizationId;
      }
    }

    console.log("🚪 leaveSession authorization check:", {
      userOrgClerkId,
      sessionOrgId: session.clerkOrganizationId,
      sessionConvexOrgId: session.org_id,
      userId: user._id,
    });

    const currentOrg = userOrgClerkId
      ? await ctx.db
          .query("organizations")
          .withIndex("by_clerk_id", (q) =>
            q.eq("clerkOrganizationId", userOrgClerkId)
          )
          .first()
      : null;
    const authorized = currentOrg
      ? session.org_id
        ? session.org_id === currentOrg._id
        : session.clerkOrganizationId === userOrgClerkId
      : false;
    if (!authorized) {
      throw new Error(
        "Unauthorized: Session belongs to a different organization"
      );
    }

    // Remove user from session authorized list and clear activeUserId if it's this user
    const now = Date.now();
    const userIdStr = `${user._id}`;
    const authorizedUserIds = (session.authorizedUserIds || []).filter(
      (id) => id !== userIdStr
    );

    const updateData: any = {
      authorizedUserIds,
      updatedAt: now,
    };

    // If this user is the active user, clear the activeUserId
    if (session.activeUserId === user._id) {
      updateData.activeUserId = null;
    }

    await ctx.db.patch(args.sessionId, updateData);
    console.log(
      "🚪 Session updated - user removed, activeUserId:",
      updateData.activeUserId
    );

    return {
      id: session._id,
      openStartDt: session.openStartDt ?? null,
      openConfirmDt: session.openConfirmDt ?? null,
      closeStartDt: session.closeStartDt ?? null,
      closeConfirmDt: session.closeConfirmDt ?? null,
      userId: session.userId ?? null,
      organizationId: session.clerkOrganizationId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      status: session.status ?? null,
      verifiedByUserId: session.verifiedByUserId ?? null,
      verifiedDt: session.verifiedDt ?? null,
      openStartUserId: session.openStartUserId ?? null,
      openConfirmUserId: session.openConfirmUserId ?? null,
      closeStartUserId: session.closeStartUserId ?? null,
      closeConfirmUserId: session.closeConfirmUserId ?? null,
    };
  },
});

// Validate session can be closed (checks orders and repository floats)
export const validateSessionCanClose = query({
  args: { sessionId: v.id("org_cx_sessions") },
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

    const userOrgClerkId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    const currentOrg = userOrgClerkId
      ? await ctx.db
          .query("organizations")
          .withIndex("by_clerk_id", (q) =>
            q.eq("clerkOrganizationId", userOrgClerkId)
          )
          .first()
      : null;
    if (!currentOrg || session.org_id !== currentOrg._id) {
      throw new Error(
        "Unauthorized: Session belongs to a different organization"
      );
    }

    // Check session status - must be FLOAT_CLOSE_COMPLETE to close
    if (session.status === "CLOSED" || session.status === "CANCELLED") {
      return {
        canClose: false,
        error: "This session is already closed or cancelled",
        blockingItems: [],
      };
    }

    if (session.status !== "FLOAT_CLOSE_START" && session.status !== "FLOAT_CLOSE_COMPLETE") {
      return {
        canClose: false,
        error: `Session must be in FLOAT_CLOSE_START or FLOAT_CLOSE_COMPLETE state to close. Current state: ${session.status}`,
        blockingItems: [{ type: "session", id: session._id, status: session.status }],
      };
    }

    // Check all orders are completed or cancelled
    const orders = await ctx.db
      .query("org_orders")
      .withIndex("by_org_session", (q) => 
        q.eq("orgSessionId", args.sessionId)
      )
      .collect();

    const incompleteOrders = orders.filter(order => 
      order.status !== "COMPLETED" && order.status !== "CANCELLED"
    );

    if (incompleteOrders.length > 0) {
      const orderIds = incompleteOrders.map(o => o._id).join(", ");
      return {
        canClose: false,
        error: `Cannot close session: ${incompleteOrders.length} order(s) are not completed or cancelled. Order IDs: ${orderIds}`,
        blockingItems: incompleteOrders.map(o => ({ type: "order", id: o._id, status: o.status })),
      };
    }

    // Check repository floats are confirmed
    const repositoryLogs = await ctx.db
      .query("org_repository_access_logs")
      .withIndex("by_org_session", (q) => 
        q.eq("orgSessionId", args.sessionId)
      )
      .collect();

    // Get repositories that require float counting
    const repositories = await ctx.db
      .query("org_repositories")
      .withIndex("by_org_id", (q) => q.eq("org_id", session.org_id))
      .filter((q) => q.eq(q.field("floatCountRequired"), true))
      .collect();

    const unconfirmedRepositories = [];
    for (const repository of repositories) {
      const log = repositoryLogs.find(l => l.orgRepositoryId === repository._id);
      if (!log || !log.closeConfirmDt) {
        unconfirmedRepositories.push(repository);
      }
    }

    if (unconfirmedRepositories.length > 0) {
      const repositoryNames = unconfirmedRepositories.map(r => r.name).join(", ");
      return {
        canClose: false,
        error: `Cannot close session: ${unconfirmedRepositories.length} repository(s) are not confirmed. Repository names: ${repositoryNames}`,
        blockingItems: unconfirmedRepositories.map(r => ({ type: "repository", id: r._id, name: r.name })),
      };
    }

    return {
      canClose: true,
      error: null,
      blockingItems: [],
    };
  },
});

// Close session (with validation and proper status change)
export const closeSession = mutation({
  args: { sessionId: v.id("org_cx_sessions") },
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

    // Get the organization from the session
    const sessionOrg = await ctx.db.get(session.org_id);
    if (!sessionOrg) {
      throw new Error("Session organization not found");
    }

    // Check if user is a member of the session's organization
    const membership = await ctx.db
      .query("org_memberships")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", session.org_id).eq("userId", user._id)
      )
      .first();
    
    console.log("🔐 Close Session Authorization check:", {
      userId: user._id,
      sessionOrgId: session.org_id,
      sessionStatus: session.status,
      hasMembership: !!membership
    });
    
    if (!membership) {
      throw new Error(
        `Unauthorized: You are not a member of the organization that owns this session. Session org: ${session.org_id}`
      );
    }

    // Check session status - must be FLOAT_CLOSE_START or FLOAT_CLOSE_COMPLETE to close
    if (session.status === "CLOSED" || session.status === "CANCELLED") {
      throw new Error("This session is already closed or cancelled");
    }

    if (session.status !== "FLOAT_CLOSE_START" && session.status !== "FLOAT_CLOSE_COMPLETE") {
      throw new Error(
        `Session must be in FLOAT_CLOSE_START or FLOAT_CLOSE_COMPLETE state to close. Current state: ${session.status}`
      );
    }

    // Check all orders are completed or cancelled
    const orders = await ctx.db
      .query("org_orders")
      .withIndex("by_org_session", (q) => 
        q.eq("orgSessionId", args.sessionId)
      )
      .collect();

    const incompleteOrders = orders.filter(order => 
      order.status !== "COMPLETED" && order.status !== "CANCELLED"
    );

    if (incompleteOrders.length > 0) {
      const orderIds = incompleteOrders.map(o => o._id).join(", ");
      throw new Error(
        `Cannot close session: ${incompleteOrders.length} order(s) are not completed or cancelled. Order IDs: ${orderIds}`
      );
    }

    // Check repository floats are confirmed
    const repositoryLogs = await ctx.db
      .query("org_repository_access_logs")
      .withIndex("by_org_session", (q) => 
        q.eq("orgSessionId", args.sessionId)
      )
      .collect();

    // Get repositories that require float counting
    const repositories = await ctx.db
      .query("org_repositories")
      .withIndex("by_org_id", (q) => q.eq("org_id", session.org_id))
      .filter((q) => q.eq(q.field("floatCountRequired"), true))
      .collect();

    const unconfirmedRepositories = [];
    for (const repository of repositories) {
      const log = repositoryLogs.find(l => l.orgRepositoryId === repository._id);
      if (!log || !log.closeConfirmDt) {
        unconfirmedRepositories.push(repository);
      }
    }

    if (unconfirmedRepositories.length > 0) {
      const repositoryNames = unconfirmedRepositories.map(r => r.name).join(", ");
      throw new Error(
        `Cannot close session: ${unconfirmedRepositories.length} repository(s) are not confirmed. Repository names: ${repositoryNames}`
      );
    }

    const now = Date.now();

    // Close the session
    await ctx.db.patch(args.sessionId, {
      status: "CLOSED",
      closeConfirmDt: now,
      closeConfirmUserId: user._id,
      updatedAt: now,
    });

    return { success: true, message: "Session closed successfully" };
  },
});

// Delete session (remove from database)
export const deleteSession = mutation({
  args: { sessionId: v.id("org_cx_sessions") },
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

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Get user's organization context - try multiple approaches
    let userOrgClerkId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;

    // If no org ID from identity, try to get from user's organization memberships
    if (!userOrgClerkId) {
      const membership = await ctx.db
        .query("org_memberships")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (membership) {
        userOrgClerkId = membership.clerkOrganizationId;
      }
    }

    console.log("🗑️ deleteSession authorization check:", {
      userOrgClerkId,
      sessionOrgId: session.clerkOrganizationId,
      sessionConvexOrgId: session.org_id,
      userId: user._id,
    });

    const currentOrg = userOrgClerkId
      ? await ctx.db
          .query("organizations")
          .withIndex("by_clerk_id", (q) =>
            q.eq("clerkOrganizationId", userOrgClerkId)
          )
          .first()
      : null;
    const authorized = currentOrg
      ? session.org_id
        ? session.org_id === currentOrg._id
        : session.clerkOrganizationId === userOrgClerkId
      : false;
    if (!authorized) {
      throw new Error(
        "Unauthorized: Session belongs to a different organization"
      );
    }

    await ctx.db.delete(args.sessionId);
    return { success: true };
  },
});

// Float Opening Workflow Functions

export const startFloatOpen = mutation({
  args: { sessionId: v.id("org_cx_sessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Check authorization
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    // Verify user is authorized for this session
    if (!session.authorizedUserIds?.includes(`${user._id}`)) {
      throw new Error("User not authorized for this session");
    }

    // Can only start float open from DORMANT state
    if (session.status !== "DORMANT") {
      throw new Error(`Cannot start float open from ${session.status} state`);
    }

    // Seed float stacks for this session if none exist yet
    const existingStacks = await ctx.db
      .query("org_float_stacks")
      .withIndex("by_org_session", (q) => q.eq("orgSessionId", args.sessionId))
      .collect();

    if (existingStacks.length === 0) {
      const now = Date.now();

      // Fetch repositories for this organization
      const repositories = await ctx.db
        .query("org_repositories")
        .withIndex("by_org_id", (q) => q.eq("org_id", session.org_id))
        .filter((q) => q.eq(q.field("active"), true))
        .collect();

      // Fetch currencies in org and build ticker -> currency map
      const currencies = await ctx.db
        .query("org_currencies")
        .withIndex("by_org_id", (q) => q.eq("org_id", session.org_id))
        .collect();
      const tickerToCurrency: Record<string, any> = {};
      for (const c of currencies) {
        const t = (c.ticker || "").toString();
        if (t) tickerToCurrency[t] = c;
      }

      for (const repo of repositories) {
        const tickers: string[] = (repo.currencyTickers as any) || [];
        for (const ticker of tickers) {
          const currency = tickerToCurrency[ticker];
          if (!currency) continue;

          // Fetch denominations for this currency
          const denominations = await ctx.db
            .query("org_denominations")
            .withIndex("by_org_currency", (q) =>
              q.eq("orgCurrencyId", currency._id)
            )
            .collect();

          for (const denom of denominations) {
            await ctx.db.insert("org_float_stacks", {
              // Org refs
              clerkOrganizationId: session.clerkOrganizationId,
              clerk_org_id: session.clerkOrganizationId,
              org_id: session.org_id,

              // Links
              orgSessionId: args.sessionId,
              orgRepositoryId: repo._id,
              orgDenominationId: denom._id,

              // Counts
              openCount: 0,
              closeCount: 0,
              middayCount: 0,
              lastSessionCount: 0,

              // Tracking
              spentDuringSession: "0.0",
              transferredDuringSession: 0,

              // Value/Pricing
              denominatedValue: denom.value || 0,
              ticker: ticker,
              averageSpot: 0,
              openSpot: 0,
              closeSpot: 0,

              // Previous ref
              previousSessionFloatStackId: undefined,

              // Timestamps
              createdAt: now,
              updatedAt: now,

              // Creator
              createdBy: user._id,
            });
          }
        }
      }
    }

    // Create or update repository access logs to reflect OPEN_START
    {
      const nowLog = Date.now();
      // All repositories for this org
      const repositoriesForLogs = await ctx.db
        .query("org_repositories")
        .withIndex("by_org_id", (q) => q.eq("org_id", session.org_id))
        .filter((q) => q.eq(q.field("active"), true))
        .collect();

      // Existing logs for this session
      const existingLogs = await ctx.db
        .query("org_repository_access_logs")
        .withIndex("by_org_session", (q) =>
          q.eq("orgSessionId", args.sessionId)
        )
        .collect();
      const repoIdToLog = new Map(
        existingLogs.map((l) => [l.orgRepositoryId, l])
      );

      const authorizedUsers = (session.authorizedUserIds || []).map(
        (id) => `${id}`
      );

      for (const repo of repositoriesForLogs) {
        const found = repoIdToLog.get(repo._id);
        if (!found) {
          await ctx.db.insert("org_repository_access_logs", {
            orgSessionId: args.sessionId,
            orgRepositoryId: repo._id,
            userId: user._id,
            clerkOrganizationId: session.clerkOrganizationId,
            clerk_org_id: session.clerkOrganizationId,
            org_id: session.org_id,
            openStartDt: nowLog,
            openConfirmDt: undefined,
            closeStartDt: undefined,
            closeConfirmDt: undefined,
            releaseDt: undefined,
            authorizedUsers,
            createdAt: nowLog,
            updatedAt: nowLog,
            createdBy: user._id,
          });
        } else if (!found.openStartDt) {
          await ctx.db.patch(found._id, {
            openStartDt: nowLog,
            updatedAt: nowLog,
          });
        }
      }
    }

    await ctx.db.patch(args.sessionId, {
      status: "FLOAT_OPEN_START",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const confirmFloatOpen = mutation({
  args: { sessionId: v.id("org_cx_sessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Check authorization
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    // Verify user is authorized for this session
    if (!session.authorizedUserIds?.includes(`${user._id}`)) {
      throw new Error("User not authorized for this session");
    }

    // Can only confirm float open from FLOAT_OPEN_START state
    if (session.status !== "FLOAT_OPEN_START") {
      throw new Error(`Cannot confirm float open from ${session.status} state`);
    }

    await ctx.db.patch(args.sessionId, {
      status: "FLOAT_OPEN_COMPLETE",
      openConfirmDt: Date.now(),
      openConfirmUserId: user._id,
      updatedAt: Date.now(),
    });

    // Mark repositories as OPEN_CONFIRMED
    {
      const nowLog = Date.now();
      const repoLogs = await ctx.db
        .query("org_repository_access_logs")
        .withIndex("by_org_session", (q) =>
          q.eq("orgSessionId", args.sessionId)
        )
        .collect();
      for (const log of repoLogs) {
        if (!log.openConfirmDt) {
          await ctx.db.patch(log._id, {
            openConfirmDt: nowLog,
            updatedAt: nowLog,
          });
        }
      }
    }

    return { success: true };
  },
});

export const startFloatClose = mutation({
  args: { sessionId: v.id("org_cx_sessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Check authorization
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    // Verify user is authorized for this session
    if (!session.authorizedUserIds?.includes(`${user._id}`)) {
      throw new Error("User not authorized for this session");
    }

    // Can only start float close from FLOAT_OPEN_COMPLETE state
    if (session.status !== "FLOAT_OPEN_COMPLETE") {
      throw new Error(`Cannot start float close from ${session.status} state`);
    }

    await ctx.db.patch(args.sessionId, {
      status: "FLOAT_CLOSE_START",
      closeStartDt: Date.now(),
      closeStartUserId: user._id,
      updatedAt: Date.now(),
    });

    // Mark repositories as CLOSE_START
    {
      const nowLog = Date.now();
      const repoLogs = await ctx.db
        .query("org_repository_access_logs")
        .withIndex("by_org_session", (q) =>
          q.eq("orgSessionId", args.sessionId)
        )
        .collect();
      for (const log of repoLogs) {
        if (!log.closeStartDt) {
          await ctx.db.patch(log._id, {
            closeStartDt: nowLog,
            updatedAt: nowLog,
          });
        }
      }
    }

    return { success: true };
  },
});

export const confirmFloatClose = mutation({
  args: { sessionId: v.id("org_cx_sessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Check authorization
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    // Verify user is authorized for this session
    if (!session.authorizedUserIds?.includes(`${user._id}`)) {
      throw new Error("User not authorized for this session");
    }

    // Can only confirm float close from FLOAT_CLOSE_START state
    if (session.status !== "FLOAT_CLOSE_START") {
      throw new Error(
        `Cannot confirm float close from ${session.status} state`
      );
    }

    await ctx.db.patch(args.sessionId, {
      status: "FLOAT_CLOSE_COMPLETE",
      closeConfirmDt: Date.now(),
      closeConfirmUserId: user._id,
      updatedAt: Date.now(),
    });

    // Mark repositories as CLOSE_CONFIRMED
    {
      const nowLog = Date.now();
      const repoLogs = await ctx.db
        .query("org_repository_access_logs")
        .withIndex("by_org_session", (q) =>
          q.eq("orgSessionId", args.sessionId)
        )
        .collect();
      for (const log of repoLogs) {
        if (!log.closeConfirmDt) {
          await ctx.db.patch(log._id, {
            closeConfirmDt: nowLog,
            updatedAt: nowLog,
          });
        }
      }
    }

    return { success: true };
  },
});

export const cancelFloatClose = mutation({
  args: { sessionId: v.id("org_cx_sessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Check authorization
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    // Verify user is authorized for this session
    if (!session.authorizedUserIds?.includes(`${user._id}`)) {
      throw new Error("User not authorized for this session");
    }

    // Can only cancel float close from FLOAT_CLOSE_START state
    if (session.status !== "FLOAT_CLOSE_START") {
      throw new Error(
        `Cannot cancel float close from ${session.status} state`
      );
    }

    await ctx.db.patch(args.sessionId, {
      status: "FLOAT_OPEN_COMPLETE",
      closeStartDt: undefined,
      closeStartUserId: undefined,
      closeConfirmDt: undefined,
      closeConfirmUserId: undefined,
      updatedAt: Date.now(),
    });

    // Clear close-related timestamps from repository access logs
    {
      const repoLogs = await ctx.db
        .query("org_repository_access_logs")
        .withIndex("by_org_session", (q) =>
          q.eq("orgSessionId", args.sessionId)
        )
        .collect();
      for (const log of repoLogs) {
        if (log.closeStartDt || log.closeConfirmDt) {
          await ctx.db.patch(log._id, {
            closeStartDt: undefined,
            closeConfirmDt: undefined,
            updatedAt: Date.now(),
          });
        }
      }
    }

    return { success: true };
  },
});
