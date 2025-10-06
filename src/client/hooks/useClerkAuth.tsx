"use client";

import {
  useUser,
  useAuth as useClerkAuth,
  useOrganization,
  useOrganizationList,
} from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  active?: boolean;
  emailVerified?: boolean;
  // Organization-related fields from Clerk
  activeOrganization?: {
    id: string;
    name: string;
    slug: string | null;
    role: string; // Clerk organization role
    imageUrl?: string;
    membersCount?: number;
  };

  // Permission flags for quick access
  permissions?: {
    isAdmin: boolean;
    isOrgAdmin: boolean;
    isOrgOwner: boolean;
    canManageUsers: boolean;
    canManageOrganizations: boolean;
  };
}

export function useAuth() {
  const { isSignedIn, userId, orgId, orgRole, orgSlug } = useClerkAuth();
  const { user: clerkUser, isLoaded } = useUser();
  const { organization: activeOrganization } = useOrganization();
  const { userMemberships } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  // Get user data from Convex
  const convexUser = useQuery(api.functions.auth.getCurrentUser);

  // Auto-sync user to Convex when they sign in
  const syncUser = useMutation(api.functions.auth.syncCurrentUser);

  // Auto-sync user data to Convex when Clerk user loads
  useEffect(() => {
    if (isSignedIn && clerkUser && !convexUser) {
      syncUser();
    }
  }, [isSignedIn, clerkUser, convexUser, syncUser]);

  // Convert Clerk + Convex user to our User interface
  const user: User | null =
    isSignedIn && (convexUser || clerkUser)
      ? {
          id: convexUser?.clerkId || userId || "",
          email:
            convexUser?.email ||
            clerkUser?.emailAddresses[0]?.emailAddress ||
            "",
          name: convexUser?.name || clerkUser?.fullName || "",
          username: clerkUser?.username || undefined,
          firstName: clerkUser?.firstName || undefined,
          lastName: clerkUser?.lastName || undefined,
          active: true,
          emailVerified:
            convexUser?.emailVerified ||
            clerkUser?.emailAddresses[0]?.verification?.status === "verified",
          // Use Clerk organization data
          activeOrganization: activeOrganization
            ? {
                id: activeOrganization.id,
                name: activeOrganization.name,
                slug: activeOrganization.slug,
                role: orgRole || "member",
                imageUrl: activeOrganization.imageUrl,
                membersCount: activeOrganization.membersCount,
              }
            : undefined,
          permissions: {
            isAdmin: false, // TODO: Implement based on user metadata
            isOrgAdmin: orgRole === "admin" || orgRole === "org:admin",
            isOrgOwner: orgRole === "owner" || orgRole === "org:owner",
            canManageUsers: orgRole === "admin" || orgRole === "owner",
            canManageOrganizations: orgRole === "owner",
          },
        }
      : null;

  return {
    user,
    isLoading: !isLoaded,
    isAuthenticated: isSignedIn && (!!convexUser || !!clerkUser),
    // Organization data
    activeOrganization,
    organizationList: userMemberships?.data || [],
    orgId,
    orgRole,
    orgSlug,
    // Legacy methods - redirect to Clerk components
    refreshSession: async () => {
      // Clerk handles session management automatically
      return { user };
    },
    refreshUserInfo: async () => {
      // Convex and Clerk handle real-time updates automatically
      if (isSignedIn && clerkUser) {
        await syncUser();
      }
    },
    login: async (email: string, password: string) => {
      throw new Error("Use Clerk's SignIn component for authentication");
    },
    signup: async (name: string, email: string, password: string) => {
      throw new Error("Use Clerk's SignUp component for authentication");
    },
    logout: async () => {
      throw new Error(
        "Use Clerk's UserButton or signOut from @clerk/nextjs for logout"
      );
    },
    resetPassword: async (email: string) => {
      throw new Error("Use Clerk's password reset flow");
    },
    // Organization methods - now use Clerk's organization system
    createOrganization: async (name: string, slug: string) => {
      throw new Error(
        "Use Clerk's CreateOrganization component to create organizations"
      );
    },
    updateOrganization: async (
      organizationId: string,
      data: { name?: string; slug?: string; description?: string }
    ) => {
      throw new Error(
        "Use Clerk's OrganizationProfile component to update organizations"
      );
    },
    deleteOrganization: async (organizationId: string) => {
      throw new Error(
        "Use Clerk's OrganizationProfile component to delete organizations"
      );
    },
    inviteMember: async (
      organizationId: string,
      email: string,
      role?: "member" | "admin" | "owner"
    ) => {
      throw new Error(
        "Use Clerk's OrganizationProfile component to invite members"
      );
    },
    removeMember: async (organizationId: string, userId: string) => {
      throw new Error(
        "Use Clerk's OrganizationProfile component to remove members"
      );
    },
    updateMemberRole: async (
      organizationId: string,
      userId: string,
      role: "member" | "admin" | "owner"
    ) => {
      throw new Error(
        "Use Clerk's OrganizationProfile component to update member roles"
      );
    },
    leaveOrganization: async (organizationId: string) => {
      throw new Error(
        "Use Clerk's OrganizationProfile component to leave organizations"
      );
    },
  };
}
