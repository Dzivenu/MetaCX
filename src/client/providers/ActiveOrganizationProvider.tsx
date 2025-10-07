"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/client/hooks/useClerkAuth";

interface Member {
  id: string;
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  user?: {
    name: string;
    email: string;
    image?: string;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  expiresAt: string;
  createdAt: string;
  inviter?: {
    user: {
      name: string;
      email: string;
    };
  };
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string | null;
  role: "owner" | "admin" | "member";
  createdAt?: string | Date;
  metadata?: {
    description?: string;
    [key: string]: any;
  };
  members?: Member[];
  invitations?: Invitation[];
}

interface ActiveOrganizationContextType {
  activeOrganization: Organization | null;
  loading: boolean;
  error: string | null;
  setActiveOrganization: (
    organizationId: string | null,
    organizationSlug?: string
  ) => Promise<void>;
  clearActiveOrganization: () => Promise<void>;
}

const ActiveOrganizationContext = createContext<
  ActiveOrganizationContextType | undefined
>(undefined);

interface ActiveOrganizationProviderProps {
  children: React.ReactNode;
}

export function ActiveOrganizationProvider({
  children,
}: ActiveOrganizationProviderProps) {
  const { user } = useAuth();
  const [activeOrganization, setActiveOrganizationState] =
    useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local active organization from Clerk user data (id-stable to avoid loops)
  useEffect(() => {
    const ua = user?.activeOrganization as
      | (Partial<Organization> & {
          id: string;
          name: string;
          slug: string | null;
          role: "owner" | "admin" | "member";
          imageUrl?: string | null;
        })
      | undefined;

    if (!ua) {
      if (activeOrganization !== null) {
        setActiveOrganizationState(null);
      }
      return;
    }

    if (activeOrganization?.id === ua.id) {
      // Avoid resetting state if nothing important changed to prevent update loops
      return;
    }

    setActiveOrganizationState({
      id: ua.id,
      name: ua.name,
      slug: ua.slug || "",
      role: ua.role,
      logo: ua.imageUrl ?? null,
      createdAt: ua.createdAt,
      metadata: ua.metadata,
    });
  }, [user?.activeOrganization?.id]);

  const setActiveOrganization = async (
    organizationId: string | null,
    organizationSlug?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Implement organization switching with Convex
      // For now, just clear the organization if null is passed
      if (organizationId === null) {
        setActiveOrganizationState(null);
      } else {
        throw new Error(
          "Organization switching not yet implemented with Convex. Please migrate organization management first."
        );
      }
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

  const clearActiveOrganization = async () => {
    return setActiveOrganization(null);
  };

  const value: ActiveOrganizationContextType = {
    activeOrganization,
    loading,
    error,
    setActiveOrganization,
    clearActiveOrganization,
  };

  return (
    <ActiveOrganizationContext.Provider value={value}>
      {children}
    </ActiveOrganizationContext.Provider>
  );
}

// Custom hook to use the active organization context
export function useActiveOrganizationContext(): ActiveOrganizationContextType {
  const context = useContext(ActiveOrganizationContext);

  if (context === undefined) {
    throw new Error(
      "useActiveOrganizationContext must be used within an ActiveOrganizationProvider"
    );
  }

  return context;
}

// Export the context for advanced use cases
export { ActiveOrganizationContext };
