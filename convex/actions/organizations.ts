"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

export const getOrganizationBySlug = action({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY not configured");
    }

    try {
      // Get organization by slug from Clerk API
      const response = await fetch(
        `https://api.clerk.com/v1/organizations?slug=${encodeURIComponent(args.slug)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${clerkSecretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch organization from Clerk: ${response.status}`
        );
      }

      const data = await response.json();

      // The API returns a list, get the first match
      const organization = data.data?.[0];
      if (!organization) {
        throw new Error("Organization not found");
      }

      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        imageUrl: organization.image_url,
        createdAt: organization.created_at,
        updatedAt: organization.updated_at,
        membersCount: organization.members_count || 0,
        pendingInvitationsCount: organization.pending_invitations_count || 0,
        publicMetadata: organization.public_metadata || {},
        privateMetadata: organization.private_metadata || {},
      };
    } catch (error) {
      console.error("Failed to fetch organization from Clerk:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch organization"
      );
    }
  },
});

export const getOrganizationMemberships = action({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY not configured");
    }

    try {
      // Get organization memberships from Clerk API
      const response = await fetch(
        `https://api.clerk.com/v1/organizations/${args.organizationId}/memberships`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${clerkSecretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch organization memberships from Clerk: ${response.status}`
        );
      }

      const data = await response.json();

      // Format memberships for UI
      const memberships =
        data.data?.map((membership: any) => ({
          id: membership.id,
          userId: membership.public_user_data?.user_id,
          role: membership.role,
          createdAt: membership.created_at,
          updatedAt: membership.updated_at,
          user: {
            id: membership.public_user_data?.user_id,
            name:
              `${membership.public_user_data?.first_name || ""} ${membership.public_user_data?.last_name || ""}`.trim() ||
              membership.public_user_data?.username ||
              "Unknown User",
            email: membership.public_user_data?.identifier || "No email",
            firstName: membership.public_user_data?.first_name,
            lastName: membership.public_user_data?.last_name,
            username: membership.public_user_data?.username,
            imageUrl: membership.public_user_data?.image_url,
          },
        })) || [];

      return memberships;
    } catch (error) {
      console.error(
        "Failed to fetch organization memberships from Clerk:",
        error
      );
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch organization memberships"
      );
    }
  },
});

// Sync an organization's members from Clerk into Convex org_memberships and users tables
export const syncOrganizationMembers = action({
  args: {
    // Accept either Convex organization id or Clerk organization id
    organizationId: v.optional(v.id("organizations")),
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY not configured");
    }

    // Resolve Clerk organization id and Convex organization record
    let clerkOrgId = args.clerkOrganizationId || "";
    let convexOrgId: Id<"organizations"> | undefined = args.organizationId as
      | Id<"organizations">
      | undefined;

    if (!clerkOrgId && convexOrgId) {
      const orgRecord = await ctx.runQuery(
        api.functions.organizations.getById,
        {
          organizationId: convexOrgId,
        }
      );
      if (!orgRecord) throw new Error("Organization not found in Convex");
      clerkOrgId = orgRecord.clerkOrganizationId as unknown as string;
    }

    if (!clerkOrgId) {
      throw new Error(
        "Provide either organizationId (Convex) or clerkOrganizationId"
      );
    }

    // Ensure we have convex organization record
    if (!convexOrgId) {
      const orgRecord = await ctx.runQuery(
        api.functions.organizations.getByClerkId,
        { clerkOrganizationId: clerkOrgId }
      );
      if (!orgRecord) throw new Error("Organization not found in Convex");
      convexOrgId = orgRecord._id as Id<"organizations">;
    }

    // Fetch memberships from Clerk API
    const response = await fetch(
      `https://api.clerk.com/v1/organizations/${clerkOrgId}/memberships`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Failed to fetch memberships from Clerk: ${response.status} ${text}`
      );
    }

    const data = await response.json();
    const members = (data.data || []) as any[];

    // Upsert each user and membership
    for (const m of members) {
      const clerkUserId: string = m.public_user_data?.user_id || m.user_id;
      // Normalize Clerk role (e.g., "org:admin") to Convex role union
      const rawRole = String(m.role || "").toLowerCase();
      const normalizedRole: "member" | "admin" | "owner" =
        rawRole.endsWith(":owner") || rawRole === "owner"
          ? "owner"
          : rawRole.endsWith(":admin") || rawRole === "admin"
            ? "admin"
            : "member"; // default fallback
      const firstName = m.public_user_data?.first_name ?? "";
      const lastName = m.public_user_data?.last_name ?? "";
      const email = m.public_user_data?.identifier ?? "";
      const username = m.public_user_data?.username ?? "";
      const imageUrl = m.public_user_data?.image_url ?? "";

      // Upsert user in Convex
      const userId = await ctx.runMutation(
        api.functions.users.upsertFromClerkData,
        {
          clerkId: clerkUserId,
          email,
          name:
            `${firstName} ${lastName}`.trim() || username || email || "Unknown",
          firstName,
          lastName,
          username,
          imageUrl,
          emailVerified: undefined,
          active: true,
        }
      );

      // Upsert membership in Convex
      await ctx.runMutation(api.functions.orgMemberships.upsertMembership, {
        organizationId: convexOrgId!,
        userId: userId as Id<"users">,
        clerkOrganizationId: clerkOrgId,
        clerkUserId: clerkUserId,
        role: normalizedRole,
        status: "active",
      });
    }

    return { synced: members.length };
  },
});
export const getUserOrganizationsFromClerk = action({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const userId = identity.subject; // Clerk user ID

    // Get Clerk secret key from environment
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY not configured");
    }

    try {
      // Fetch user's organization memberships from Clerk API
      const response = await fetch(
        `https://api.clerk.com/v1/users/${userId}/organization_memberships`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${clerkSecretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch organizations from Clerk: ${response.status}`
        );
      }

      const data = await response.json();

      // Extract organizations from memberships and format for UI
      const organizations =
        data.data?.map((membership: any) => ({
          id: membership.organization.id,
          name: membership.organization.name,
          slug: membership.organization.slug,
          imageUrl: membership.organization.image_url,
          role: membership.role,
          createdAt: membership.organization.created_at,
          updatedAt: membership.organization.updated_at,
          membersCount: membership.organization.members_count || 0,
          pendingInvitationsCount:
            membership.organization.pending_invitations_count || 0,
        })) || [];

      return organizations;
    } catch (error) {
      console.error("Failed to fetch organizations from Clerk:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch organizations"
      );
    }
  },
});

export const createOrganization = action({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    public_metadata: v.optional(v.object({})),
    private_metadata: v.optional(v.object({})),
    max_allowed_memberships: v.optional(v.number()),
    created_at: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get user identity from Clerk
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const userId = identity.subject; // Clerk user ID

    // Get Clerk secret key from environment
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY not configured");
    }

    try {
      // Call Clerk's Backend API to create organization
      const response = await fetch("https://api.clerk.com/v1/organizations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: args.name,
          created_by: userId,
          slug: args.slug || undefined,
          public_metadata: args.public_metadata || undefined,
          private_metadata: args.private_metadata || undefined,
          max_allowed_memberships: args.max_allowed_memberships || undefined,
          created_at: args.created_at || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error?.error || `Failed to create organization: ${response.status}`
        );
      }

      const org = await response.json();

      // Persist organization to Convex database immediately
      const upsertResult = await ctx.runMutation(
        api.functions.organizations.upsertByClerkId,
        {
          clerkOrganizationId: org.id,
          slug:
            org.slug ||
            args.slug ||
            args.name
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-")
              .trim(),
          name: org.name,
          imageUrl: org.image_url,
        }
      );

      // Ensure creator exists in Convex users table
      const creatorClerkId = identity.subject;
      const creatorUser = await ctx.runQuery(
        api.functions.users.getUserByClerkId,
        { clerkId: creatorClerkId }
      );

      let convexCreatorUserId: Id<"users">;
      if (!creatorUser) {
        convexCreatorUserId = await ctx.runMutation(
          api.functions.users.upsertFromClerkData,
          {
            clerkId: creatorClerkId,
            email: typeof identity.email === "string" ? identity.email : "",
            name: typeof identity.name === "string" ? identity.name : "",
            firstName:
              typeof identity.given_name === "string"
                ? identity.given_name
                : "",
            lastName:
              typeof identity.family_name === "string"
                ? identity.family_name
                : "",
            username:
              typeof identity.nickname === "string" ? identity.nickname : "",
            imageUrl:
              typeof identity.picture === "string" ? identity.picture : "",
            emailVerified:
              typeof identity.email_verified === "boolean"
                ? identity.email_verified
                : false,
            active: true,
          }
        );
      } else {
        convexCreatorUserId = creatorUser._id as Id<"users">;
      }

      // Get Convex organization record
      const orgRecord = await ctx.runQuery(
        api.functions.organizations.getByClerkId,
        { clerkOrganizationId: org.id }
      );

      // Upsert creator membership as owner to keep Convex in sync with Clerk
      if (orgRecord) {
        await ctx.runMutation(api.functions.orgMemberships.upsertMembership, {
          organizationId: orgRecord._id as Id<"organizations">,
          userId: convexCreatorUserId,
          clerkOrganizationId: org.id,
          clerkUserId: creatorClerkId,
          role: "owner",
          status: "active",
        });
      }

      return org;
    } catch (error) {
      console.error("Create organization failed:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to create organization"
      );
    }
  },
});

export const setActiveOrganization = action({
  args: {
    organizationId: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY not configured");
    }

    try {
      const response = await fetch(
        `https://api.clerk.com/v1/sessions/${args.sessionId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${clerkSecretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            active_organization_id: args.organizationId,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `Failed to set active organization: ${response.status} ${errorText}`
        );
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to set active organization via Clerk:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to set active organization"
      );
    }
  },
});
