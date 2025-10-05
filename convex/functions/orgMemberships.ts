import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Get all members of an organization
export const getOrganizationMembers = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    let orgId = args.organizationId;

    // If no org ID provided but clerk org ID is provided, find the org
    if (!orgId && args.clerkOrganizationId) {
      const clerkOrgId = args.clerkOrganizationId;
      const org = await ctx.db
        .query("organizations")
        .withIndex("by_clerk_id", (q) =>
          q.eq("clerkOrganizationId", clerkOrgId)
        )
        .first();
      orgId = org?._id;
    }

    if (!orgId) {
      // Gracefully handle missing org by returning empty list
      return [];
    }

    // Get all active memberships for this organization
    const memberships = await ctx.db
      .query("org_memberships")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Get user details for each member
    const membersWithUsers = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        const memberData = {
          id: membership._id,
          organizationId: membership.organizationId,
          userId: membership.userId,
          role: membership.role,
          joinedAt: membership.joinedAt || membership.createdAt,
          createdAt: membership.createdAt,
          firstName: membership.firstName,
          lastName: membership.lastName,
          authorizedRepoIds: membership.authorizedRepoIds || [],
          user: user
            ? {
                id: user._id,
                name:
                  user.name ||
                  `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                  "Unknown User",
                email: user.email,
                image: user.imageUrl,
                firstName: user.firstName,
                lastName: user.lastName,
                clerkId: user.clerkId,
              }
            : null,
        };
        return memberData;
      })
    );

    // Filter out memberships where user was not found
    return membersWithUsers.filter((member) => member.user !== null);
  },
});

// Get pending invitations for an organization
export const getOrganizationInvitations = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    let orgId = args.organizationId;

    // If no org ID provided but clerk org ID is provided, find the org
    if (!orgId && args.clerkOrganizationId) {
      const clerkOrgId = args.clerkOrganizationId;
      const org = await ctx.db
        .query("organizations")
        .withIndex("by_clerk_id", (q) =>
          q.eq("clerkOrganizationId", clerkOrgId)
        )
        .first();
      orgId = org?._id;
    }

    if (!orgId) {
      // Gracefully handle missing org by returning empty list
      return [];
    }

    // Get all pending invitations for this organization
    const invitations = await ctx.db
      .query("orgInvitations")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Get inviter details for each invitation
    const invitationsWithInviters = await Promise.all(
      invitations.map(async (invitation) => {
        const inviter = await ctx.db.get(invitation.invitedBy);
        return {
          id: invitation._id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: new Date(invitation.expiresAt).toISOString(),
          createdAt: new Date(invitation.createdAt).toISOString(),
          inviter: inviter
            ? {
                user: {
                  name:
                    inviter.name ||
                    `${inviter.firstName || ""} ${inviter.lastName || ""}`.trim() ||
                    "Unknown User",
                  email: inviter.email,
                },
              }
            : null,
        };
      })
    );

    return invitationsWithInviters;
  },
});

// Get full organization with members and invitations
export const getFullOrganization = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    let orgId = args.organizationId;
    let org = null;

    // If no org ID provided but clerk org ID is provided, find the org
    if (!orgId && args.clerkOrganizationId) {
      org = await ctx.db
        .query("organizations")
        .withIndex("by_clerk_id", (q) =>
          q.eq("clerkOrganizationId", args.clerkOrganizationId!)
        )
        .first();
      orgId = org?._id;
    } else if (orgId) {
      org = await ctx.db.get(orgId);
    }

    if (!orgId || !org) {
      // Gracefully handle missing org by returning a minimal stub
      return {
        id: (orgId as any) || ("unknown" as any),
        name: "Unknown Organization",
        slug: "",
        logo: undefined,
        createdAt: new Date().toISOString(),
        metadata: {},
        members: [],
        invitations: [],
      } as any;
    }

    // Get members directly to avoid circular dependency
    const memberships = await ctx.db
      .query("org_memberships")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId!))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Get user details for each member
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        return {
          id: membership._id,
          organizationId: membership.organizationId,
          userId: membership.userId,
          role: membership.role,
          joinedAt: membership.joinedAt || membership.createdAt,
          createdAt: membership.createdAt,
          // expose editable membership-level fields so UI can reflect updates
          firstName: membership.firstName,
          lastName: membership.lastName,
          authorizedRepoIds: membership.authorizedRepoIds || [],
          user: user
            ? {
                id: user._id,
                name:
                  user.name ||
                  `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                  "Unknown User",
                email: user.email,
                image: user.imageUrl,
                firstName: user.firstName,
                lastName: user.lastName,
              }
            : null,
        };
      })
    ).then((results) => results.filter((member) => member.user !== null));

    // Get invitations directly
    const invitationRecords = await ctx.db
      .query("orgInvitations")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId!))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Get inviter details for each invitation
    const invitations = await Promise.all(
      invitationRecords.map(async (invitation) => {
        const inviter = await ctx.db.get(invitation.invitedBy);
        return {
          id: invitation._id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: new Date(invitation.expiresAt).toISOString(),
          createdAt: new Date(invitation.createdAt).toISOString(),
          inviter: inviter
            ? {
                user: {
                  name:
                    inviter.name ||
                    `${inviter.firstName || ""} ${inviter.lastName || ""}`.trim() ||
                    "Unknown User",
                  email: inviter.email,
                },
              }
            : null,
        };
      })
    );

    return {
      id: org._id,
      name: org.name,
      slug: org.slug,
      logo: org.imageUrl,
      createdAt: new Date(org.createdAt).toISOString(),
      metadata: {},
      members,
      invitations,
    };
  },
});

// Add or update organization membership
export const upsertMembership = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    clerkOrganizationId: v.string(),
    clerkUserId: v.string(),
    role: v.union(v.literal("member"), v.literal("admin"), v.literal("owner")),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("invited"),
        v.literal("suspended"),
        v.literal("removed")
      )
    ),
    invitedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    // Check if membership already exists
    const existing = await ctx.db
      .query("org_memberships")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId)
      )
      .first();

    const membershipData = {
      organizationId: args.organizationId,
      userId: args.userId,
      clerkOrganizationId: args.clerkOrganizationId,
      clerkUserId: args.clerkUserId,
      role: args.role,
      status: args.status || "active",
      joinedAt: args.status === "active" ? now : undefined,
      invitedAt: args.status === "invited" ? now : undefined,
      invitedBy: args.invitedBy,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, membershipData);
      return existing._id;
    } else {
      return await ctx.db.insert("org_memberships", {
        ...membershipData,
        createdAt: now,
      });
    }
  },
});

// Update member role
export const updateMemberRole = mutation({
  args: {
    membershipId: v.id("org_memberships"),
    role: v.union(v.literal("member"), v.literal("admin"), v.literal("owner")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    // Get the membership to update
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }

    // Check if current user has permission to update roles
    const currentUserMembership = await ctx.db
      .query("org_memberships")
      .withIndex("by_org_user", (q) =>
        q
          .eq("organizationId", membership.organizationId)
          .eq("userId", currentUser._id)
      )
      .first();

    if (
      !currentUserMembership ||
      !["admin", "owner"].includes(currentUserMembership.role)
    ) {
      throw new Error("Insufficient permissions to update member roles");
    }

    // Update the role
    await ctx.db.patch(args.membershipId, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return true;
  },
});

// Remove member from organization
export const removeMember = mutation({
  args: {
    membershipId: v.id("org_memberships"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    // Get the membership to remove
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }

    // Check if current user has permission to remove members
    const currentUserMembership = await ctx.db
      .query("org_memberships")
      .withIndex("by_org_user", (q) =>
        q
          .eq("organizationId", membership.organizationId)
          .eq("userId", currentUser._id)
      )
      .first();

    if (
      !currentUserMembership ||
      !["admin", "owner"].includes(currentUserMembership.role)
    ) {
      throw new Error("Insufficient permissions to remove members");
    }

    // Don't allow removing the owner
    if (membership.role === "owner") {
      throw new Error("Cannot remove organization owner");
    }

    // Update status to removed instead of deleting
    await ctx.db.patch(args.membershipId, {
      status: "removed",
      updatedAt: Date.now(),
    });

    return true;
  },
});

// Invite member to organization
export const inviteMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    clerkOrganizationId: v.string(),
    email: v.string(),
    role: v.union(v.literal("member"), v.literal("admin"), v.literal("owner")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    // Check if current user has permission to invite members
    const currentUserMembership = await ctx.db
      .query("org_memberships")
      .withIndex("by_org_user", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", currentUser._id)
      )
      .first();

    if (
      !currentUserMembership ||
      !["admin", "owner"].includes(currentUserMembership.role)
    ) {
      throw new Error("Insufficient permissions to invite members");
    }

    // Check if user is already a member or has pending invitation
    const existingMembership = await ctx.db
      .query("org_memberships")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => {
        // Note: This is a simplified check. In a real app, you'd need to match by email
        // For now, we'll just check if the user exists and is already a member
        return q.eq(q.field("status"), "active");
      })
      .collect();

    const existingInvitation = await ctx.db
      .query("orgInvitations")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => q.eq(q.field("email"), args.email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingInvitation) {
      throw new Error("User already has a pending invitation");
    }

    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days from now
    const token = crypto.randomUUID();

    // Create invitation
    const invitationId = await ctx.db.insert("orgInvitations", {
      organizationId: args.organizationId,
      clerkOrganizationId: args.clerkOrganizationId,
      email: args.email,
      role: args.role,
      status: "pending",
      invitedBy: currentUser._id,
      invitedAt: now,
      expiresAt,
      token,
      createdAt: now,
      updatedAt: now,
    });

    return { invitationId, token };
  },
});

// Get current user's role in an organization
export const getCurrentUserRole = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      return null;
    }

    let orgId = args.organizationId;

    // If no org ID provided but clerk org ID is provided, find the org
    if (!orgId && args.clerkOrganizationId) {
      const clerkOrgId = args.clerkOrganizationId;
      const org = await ctx.db
        .query("organizations")
        .withIndex("by_clerk_id", (q) =>
          q.eq("clerkOrganizationId", clerkOrgId)
        )
        .first();
      orgId = org?._id;
    }

    if (!orgId) {
      return null;
    }

    // Get user's membership in this organization
    const membership = await ctx.db
      .query("org_memberships")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", orgId).eq("userId", currentUser._id)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    return membership?.role || null;
  },
});

// Update member details and repository access
export const updateMemberDetails = mutation({
  args: {
    membershipId: v.string(), // Using string to avoid ID validation issues
    organizationId: v.optional(v.string()), // Using string to avoid ID validation issues
    clerkOrganizationId: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    authorizedRepoIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    // Get organization ID
    let orgId: Id<"organizations"> | undefined;

    // If organizationId is provided as string, convert it
    if (args.organizationId) {
      orgId = args.organizationId as Id<"organizations">;
    }

    // If no org ID provided but clerk org ID is provided, find the org
    if (!orgId && args.clerkOrganizationId) {
      const clerkOrgId = args.clerkOrganizationId;
      const org = await ctx.db
        .query("organizations")
        .withIndex("by_clerk_id", (q) =>
          q.eq("clerkOrganizationId", clerkOrgId)
        )
        .first();
      orgId = org?._id;
    }

    if (!orgId) {
      throw new Error("Organization not found or not specified");
    }

    // Try to get the membership by ID within the organization. Note: caller may pass
    // either a Convex membership ID, a Convex user ID, or a Clerk membership/user ID.
    let membership;
    try {
      // First, try to convert string to ID and use db.get (for Convex IDs)
      const membershipId = args.membershipId as Id<"org_memberships">;
      membership = await ctx.db.get(membershipId);
    } catch (error) {
      // If direct ID lookup fails, this might be a Clerk membership ID
      // Try to find it by querying the specific organization
      let orgMemberships = await ctx.db
        .query("org_memberships")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      // If no results, try with clerk organization ID
      if (orgMemberships.length === 0 && args.clerkOrganizationId) {
        orgMemberships = await ctx.db
          .query("org_memberships")
          .withIndex("by_clerk_org", (q) =>
            q.eq("clerkOrganizationId", args.clerkOrganizationId!)
          )
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();
      }

      // Look for membership with matching Convex ID, or by user ID if membershipId is actually a user ID
      membership = orgMemberships.find((m) => {
        // Check if it's a Convex membership ID match
        if (
          m._id === args.membershipId ||
          m._id.toString() === args.membershipId
        ) {
          return true;
        }

        // Check if membershipId matches the Clerk user ID of this membership
        if (m.clerkUserId === args.membershipId) {
          return true;
        }

        // Check if membershipId matches the Convex user ID of this membership
        if (m.userId.toString() === args.membershipId) {
          return true;
        }

        // If membershipId starts with 'orgmem_', it's a Clerk membership ID
        // We need to find the corresponding Convex membership by user
        // For now, we'll try to find by user ID if we can extract it
        if (args.membershipId.startsWith("orgmem_")) {
          console.warn(
            `Received Clerk membership ID ${args.membershipId}, attempting to find corresponding Convex membership`
          );

          // If we can't find a direct match, we might need to create the membership first
          // or find it by other means. For now, return null and let the error be thrown
          return false;
        }

        return false;
      });

      if (!membership) {
        // As a fallback, attempt to upsert a membership using available identifiers
        // Find Convex user by Clerk ID if membershipId looks like a Clerk user id (starts with 'user_')
        let targetUserId: Id<"users"> | undefined;
        if (args.membershipId.startsWith("user_")) {
          const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.membershipId))
            .first();
          if (user) {
            targetUserId = user._id as Id<"users">;
          }
        }

        // If we still don't have a membership, but we can resolve a user in this org, create one
        if (targetUserId) {
          const now = Date.now();
          const newMembershipId = await ctx.db.insert("org_memberships", {
            organizationId: orgId,
            userId: targetUserId,
            clerkOrganizationId: args.clerkOrganizationId || "",
            clerkUserId: args.membershipId,
            role: "member",
            status: "active",
            joinedAt: now,
            createdAt: now,
            updatedAt: now,
          });
          membership = await ctx.db.get(newMembershipId);
        }

        if (!membership) {
          const errorMsg =
            `Membership not found with ID: ${args.membershipId}. ` +
            `Available memberships: ${orgMemberships.length}. ` +
            `Organization ID: ${orgId}. ` +
            `This may indicate the membership needs to be synced from Clerk to Convex first.`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
      }
    }

    if (!membership) {
      throw new Error(`Membership not found with ID: ${args.membershipId}`);
    }

    // Check if current user has permission to update member details
    const currentUserMembership = await ctx.db
      .query("org_memberships")
      .withIndex("by_org_user", (q) =>
        q
          .eq("organizationId", membership.organizationId)
          .eq("userId", currentUser._id)
      )
      .first();

    if (
      !currentUserMembership ||
      !["admin", "owner"].includes(currentUserMembership.role)
    ) {
      throw new Error("Insufficient permissions to update member details");
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: Date.now(),
    };

    // Allow explicit empty string to clear names
    if (Object.prototype.hasOwnProperty.call(args, "firstName")) {
      updateData.firstName = args.firstName as any;
    }
    if (Object.prototype.hasOwnProperty.call(args, "lastName")) {
      updateData.lastName = args.lastName as any;
    }
    if (args.authorizedRepoIds !== undefined) {
      updateData.authorizedRepoIds = args.authorizedRepoIds;
    }

    // Update the membership
    await ctx.db.patch(membership._id, updateData);

    // Also update the underlying user record if first/last name provided
    if (
      Object.prototype.hasOwnProperty.call(args, "firstName") ||
      Object.prototype.hasOwnProperty.call(args, "lastName")
    ) {
      const userRecord = await ctx.db.get(membership.userId);
      if (userRecord) {
        const userUpdate: any = { updatedAt: Date.now() };
        if (Object.prototype.hasOwnProperty.call(args, "firstName"))
          userUpdate.firstName = args.firstName as any;
        if (Object.prototype.hasOwnProperty.call(args, "lastName"))
          userUpdate.lastName = args.lastName as any;

        // Update composite name when we have at least one provided field
        const computedFirst = Object.prototype.hasOwnProperty.call(
          args,
          "firstName"
        )
          ? (args.firstName as any) || ""
          : userRecord.firstName || "";
        const computedLast = Object.prototype.hasOwnProperty.call(
          args,
          "lastName"
        )
          ? (args.lastName as any) || ""
          : userRecord.lastName || "";
        const composed = `${computedFirst} ${computedLast}`.trim();
        userUpdate.name = composed; // can be empty

        await ctx.db.patch(membership.userId, userUpdate);
      }
    }

    return { success: true };
  },
});

// Get member repository access
export const getMemberRepositoryAccess = query({
  args: {
    membershipId: v.id("org_memberships"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get the membership
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }

    return {
      authorizedRepoIds: membership.authorizedRepoIds || [],
      firstName: membership.firstName,
      lastName: membership.lastName,
    };
  },
});
