"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export interface ConvexOrganizationMember {
  id: Id<"org_memberships">;
  organizationId: Id<"organizations">;
  userId: Id<"users">;
  role: "member" | "admin" | "owner";
  joinedAt: number;
  createdAt: number;
  // Metadata to track data source
  _dataSource?: "convex" | "clerk";
  _clerkMembershipId?: string; // Store original Clerk membership ID if from Clerk
  user: {
    id: Id<"users">;
    name: string;
    email: string;
    image?: string;
    firstName?: string;
    lastName?: string;
  } | null;
}

export interface ConvexOrganizationInvitation {
  id: Id<"orgInvitations">;
  email: string;
  role: "member" | "admin" | "owner";
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  expiresAt: string;
  createdAt: string;
  inviter: {
    user: {
      name: string;
      email: string;
    };
  } | null;
}

export interface ConvexFullOrganization {
  id: Id<"organizations">;
  name: string;
  slug: string;
  logo?: string;
  createdAt: string;
  metadata: Record<string, any>;
  members: ConvexOrganizationMember[];
  invitations: ConvexOrganizationInvitation[];
}

export function useOrgMembershipsConvex(
  organizationId?: Id<"organizations">,
  clerkOrganizationId?: string
) {
  // Query for organization members
  const convexMembers = useQuery(
    api.functions.orgMemberships.getOrganizationMembers,
    organizationId || clerkOrganizationId
      ? { organizationId, clerkOrganizationId }
      : "skip"
  );

  // Query for organization invitations
  const invitations = useQuery(
    api.functions.orgMemberships.getOrganizationInvitations,
    organizationId || clerkOrganizationId
      ? { organizationId, clerkOrganizationId }
      : "skip"
  );

  // Query for full organization details
  const fullOrganization = useQuery(
    api.functions.orgMemberships.getFullOrganization,
    organizationId || clerkOrganizationId
      ? { organizationId, clerkOrganizationId }
      : "skip"
  );

  // Query for current user's role
  const currentUserRole = useQuery(
    api.functions.orgMemberships.getCurrentUserRole,
    organizationId || clerkOrganizationId
      ? { organizationId, clerkOrganizationId }
      : "skip"
  );

  // No fallback to Clerk: admin/users should load only from Convex

  // Unified members list
  const members = useMemo(() => {
    if (fullOrganization && fullOrganization.members.length > 0) {
      return fullOrganization.members.map((member) => ({
        ...member,
        _dataSource: "convex" as const,
      }));
    }
    return (convexMembers || []).map((member) => ({
      ...member,
      _dataSource: "convex" as const,
    }));
  }, [fullOrganization, convexMembers]);

  const membersLoading =
    fullOrganization === undefined && convexMembers === undefined;

  // Mutations
  const updateMemberRoleMutation = useMutation(
    api.functions.orgMemberships.updateMemberRole
  );
  const removeMemberMutation = useMutation(
    api.functions.orgMemberships.removeMember
  );
  const inviteMemberMutation = useMutation(
    api.functions.orgMemberships.inviteMember
  );

  const updateMemberRole = async (
    membershipId: Id<"org_memberships">,
    role: "member" | "admin" | "owner"
  ) => {
    try {
      await updateMemberRoleMutation({ membershipId, role });
    } catch (error) {
      console.error("Failed to update member role:", error);
      throw error;
    }
  };

  const removeMember = async (membershipId: Id<"org_memberships">) => {
    try {
      await removeMemberMutation({ membershipId });
    } catch (error) {
      console.error("Failed to remove member:", error);
      throw error;
    }
  };

  const inviteMember = async (
    email: string,
    role: "member" | "admin" | "owner"
  ) => {
    if (!organizationId && !clerkOrganizationId) {
      throw new Error("Organization ID is required to invite members");
    }

    try {
      const result = await inviteMemberMutation({
        organizationId: organizationId!,
        clerkOrganizationId: clerkOrganizationId!,
        email,
        role,
      });
      return result;
    } catch (error) {
      console.error("Failed to invite member:", error);
      throw error;
    }
  };

  return {
    // Data
    members,
    invitations,
    fullOrganization,
    currentUserRole,

    // Loading states
    membersLoading,
    invitationsLoading: invitations === undefined,
    fullOrganizationLoading: fullOrganization === undefined,
    currentUserRoleLoading: currentUserRole === undefined,

    // Actions
    updateMemberRole,
    removeMember,
    inviteMember,

    // Computed values
    canManageMembers:
      currentUserRole === "admin" || currentUserRole === "owner",
    isOwner: currentUserRole === "owner",
    isAdmin: currentUserRole === "admin" || currentUserRole === "owner",
  };
}
