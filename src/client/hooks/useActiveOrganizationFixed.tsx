"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/client/hooks/useAuth";
import { authClient } from "@/client/auth";

type Organization = {
  id: string;
  name: string;
  slug: string;
  [key: string]: any;
};

/**
 * Custom hook to manage active organization with proper state management
 * This replaces the broken better-auth useActiveOrganization hook
 */
export function useActiveOrganizationFixed() {
  const { organizations } = useAuth();
  const [activeOrganization, setActiveOrganizationState] =
    useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load active organization from better-auth session
  
  useEffect(() => {
    const loadActiveOrganization = async () => {
      if (organizations.length > 0) {
        try {
          const { data: sessionData } = await authClient.getSession();
          const activeOrgId = sessionData?.session?.activeOrganizationId;
          
          if (activeOrgId) {
            const foundOrg = organizations.find((org) => org.id === activeOrgId);
            if (foundOrg) {
              setActiveOrganizationState(foundOrg);
            }
          } else {
            setActiveOrganizationState(null);
          }
        } catch (error) {
          console.error('❌ Error loading active organization from session:', error);
        }
      }
    };
    
    loadActiveOrganization();
  }, [organizations]);

  /**
   * Set the active organization
   * @param organizationId - The organization ID to set as active, or null to unset
   */
  const setActiveOrganization = async (organizationId: string | null) => {
    setLoading(true);
    setError(null);

    try {
      if (organizationId === null) {
        // Clear active organization
        setActiveOrganizationState(null);
      } else {
        // Find the organization in the user's organizations list
        const organization = organizations.find(
          (org) => org.id === organizationId
        );

        if (!organization) {
          throw new Error("Organization not found in user's organizations");
        }

        // Set the active organization
        setActiveOrganizationState(organization);

        console.log(
          "✅ Active organization set successfully:",
          organization.name
        );
      }

      return { data: activeOrganization, error: null };
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to set active organization";
      setError(errorMessage);
      console.error("❌ Error setting active organization:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear the active organization (set to null)
   */
  const clearActiveOrganization = async () => {
    return setActiveOrganization(null);
  };

  return {
    activeOrganization,
    loading,
    error,
    setActiveOrganization,
    clearActiveOrganization,
  };
}
