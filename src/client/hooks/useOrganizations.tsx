"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { authClient } from "@/client/auth";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  members?: Member[];
  invitations?: Invitation[];
}

export interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  inviter: {
    user: {
      name: string;
      email: string;
    };
  };
}

export function useOrganizations() {
  const { isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load organizations using better-auth
  const loadOrganizations = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      const result = await authClient.organization.list();

      if (result.error) {
        throw new Error(result.error.message);
      }

      setOrganizations(result.data || []);
    } catch (err) {
      console.error("Failed to load organizations:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load organizations"
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Create organization
  const createOrganization = async (data: {
    name: string;
    slug: string;
    description?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authClient.organization.create({
        name: data.name,
        slug: data.slug,
        metadata: data.description
          ? { description: data.description }
          : undefined,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      await loadOrganizations();
      return result.data;
    } catch (err) {
      console.error("Failed to create organization:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create organization";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update organization
  const updateOrganization = async (
    organizationId: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      logo?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authClient.organization.update({
        organizationId,
        data: {
          ...data,
          metadata: data.description
            ? { description: data.description }
            : undefined,
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      await loadOrganizations();
      return result.data;
    } catch (err) {
      console.error("Failed to update organization:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update organization";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Delete organization
  const deleteOrganization = async (organizationId: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authClient.organization.delete({ organizationId });

      if (result.error) {
        throw new Error(result.error.message);
      }

      await loadOrganizations();
      return true;
    } catch (err) {
      console.error("Failed to delete organization:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete organization";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Invite member
  const inviteMember = async (
    organizationId: string,
    email: string,
    role: "member" | "admin" | "owner"
  ) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authClient.organization.inviteMember({
        organizationId,
        email,
        role,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      await loadOrganizations();
      return result.data;
    } catch (err) {
      console.error("Failed to invite member:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to invite member";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Remove member
  const removeMember = async (organizationId: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authClient.organization.removeMember({
        organizationId,
        userId,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      await loadOrganizations();
      return true;
    } catch (err) {
      console.error("Failed to remove member:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove member";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update member role
  const updateMemberRole = async (
    organizationId: string,
    userId: string,
    role: "member" | "admin" | "owner"
  ) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authClient.organization.updateMemberRole({
        organizationId,
        userId,
        role,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      await loadOrganizations();
      return result.data;
    } catch (err) {
      console.error("Failed to update member role:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update member role";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Leave organization
  const leaveOrganization = async (organizationId: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authClient.organization.leaveOrganization({
        organizationId,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      await loadOrganizations();
      return true;
    } catch (err) {
      console.error("Failed to leave organization:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to leave organization";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getFullOrganization = async (
    organizationId: string
  ): Promise<Organization> => {
    try {
      setLoading(true);
      setError(null);

      // First set the organization as active, then get full details
      await authClient.organization.setActive({ organizationId });
      const result = await authClient.organization.getFullOrganization();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    } catch (err) {
      console.error("Failed to get full organization:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load organization details";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load organizations on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadOrganizations();
    } else {
      setOrganizations([]);
    }
  }, [isAuthenticated, loadOrganizations]);

  return {
    organizations,
    loading,
    error,
    loadOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    inviteMember,
    removeMember,
    updateMemberRole,
    leaveOrganization,
    getFullOrganization,
  };
}
