"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { authClient } from '@/client/auth';

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

  // Load organizations
  const loadOrganizations = async () => {
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
      console.error('Failed to load organizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  // Create organization
  const createOrganization = async (data: { name: string; slug: string; description?: string }) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await organization.create({
        name: data.name,
        slug: data.slug,
        metadata: data.description ? { description: data.description } : undefined,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      await loadOrganizations();
      return result.data;
    } catch (err) {
      console.error('Failed to create organization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create organization';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update organization
  const updateOrganization = async (organizationId: string, data: { 
    name?: string; 
    slug?: string; 
    description?: string;
    logo?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await organization.update({
        organizationId,
        data: {
          ...data,
          metadata: data.description ? { description: data.description } : undefined,
        },
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      await loadOrganizations();
      
      return result.data;
    } catch (err) {
      console.error('Failed to update organization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update organization';
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
      
      const result = await organization.delete({ organizationId });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      await loadOrganizations();
      if (activeOrganization?.id === organizationId) {
        setActiveOrganization(null);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to delete organization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete organization';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Set active organization
  const setActive = async (organizationId: string | null) => {
    try {
      const result = await organization.setActive({ organizationId });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      await loadActiveOrganization();
      return true;
    } catch (err) {
      console.error('Failed to set active organization:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to set active organization');
    }
  };

  // Invite member
  const inviteMember = async (organizationId: string, email: string, role: string = 'member') => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await organization.inviteMember({
        organizationId,
        email,
        role,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Refresh organization data to show new invitation
      if (activeOrganization?.id === organizationId) {
        await loadActiveOrganization();
      }
      
      return result.data;
    } catch (err) {
      console.error('Failed to invite member:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite member';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Remove member
  const removeMember = async (organizationId: string, memberIdOrEmail: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await organization.removeMember({
        organizationId,
        memberIdOrEmail,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Refresh organization data
      if (activeOrganization?.id === organizationId) {
        await loadActiveOrganization();
      }
      
      return true;
    } catch (err) {
      console.error('Failed to remove member:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update member role
  const updateMemberRole = async (organizationId: string, memberId: string, role: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await organization.updateMemberRole({
        organizationId,
        memberId,
        role,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Refresh organization data
      if (activeOrganization?.id === organizationId) {
        await loadActiveOrganization();
      }
      
      return true;
    } catch (err) {
      console.error('Failed to update member role:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update member role';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cancel invitation
  const cancelInvitation = async (invitationId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await organization.cancelInvitation({ invitationId });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Refresh active organization to update invitations
      await loadActiveOrganization();
      
      return true;
    } catch (err) {
      console.error('Failed to cancel invitation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel invitation';
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
      
      const result = await organization.leave({ organizationId });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      await loadOrganizations();
      if (activeOrganization?.id === organizationId) {
        setActiveOrganization(null);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to leave organization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave organization';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get full organization details with members
  const getFullOrganization = async (organizationId: string) => {
    try {
      setError(null);
      
      console.log('🔍 Fetching full organization with ID:', organizationId);
      
      // First set the organization as active, then get full details
      await organization.setActive({ organizationId });
      const result = await organization.getFullOrganization();
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      console.log('📝 Full organization data:', result.data);
      return result.data;
    } catch (err) {
      console.error('Failed to get full organization details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get full organization details';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Load data on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadOrganizations();
      loadActiveOrganization();
    } else {
      setOrganizations([]);
      setActiveOrganization(null);
    }
  }, [isAuthenticated]);

  return {
    organizations,
    activeOrganization,
    loading,
    error,
    // Actions
    createOrganization,
    updateOrganization,
    deleteOrganization,
    setActive,
    inviteMember,
    removeMember,
    updateMemberRole,
    cancelInvitation,
    leaveOrganization,
    getFullOrganization,
    // Refresh functions
    loadOrganizations,
    loadActiveOrganization,
  };
}