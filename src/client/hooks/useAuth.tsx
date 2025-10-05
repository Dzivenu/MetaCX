"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth as useClerkAuth } from "@/client/hooks/useClerkAuth";

interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  active?: boolean;
  emailVerified?: boolean;
  // Organization-related fields
  activeOrganization?: {
    id: string;
    name: string;
    slug: string;
    role: "owner" | "admin" | "member";
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

interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  metadata?: any;
  members?: Member[];
  invitations?: Invitation[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<any>;
  refreshUserInfo: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  // Organization methods
  createOrganization: (name: string, slug: string) => Promise<any>;
  updateOrganization: (
    organizationId: string,
    data: { name?: string; slug?: string; description?: string }
  ) => Promise<any>;
  deleteOrganization: (organizationId: string) => Promise<void>;
  inviteMember: (
    organizationId: string,
    email: string,
    role?: "member" | "admin" | "owner"
  ) => Promise<void>;
  removeMember: (organizationId: string, userId: string) => Promise<void>;
  updateMemberRole: (
    organizationId: string,
    userId: string,
    role: "member" | "admin" | "owner"
  ) => Promise<void>;
  leaveOrganization: (organizationId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // This provider is now just a wrapper - Clerk handles auth context internally
  return <>{children}</>;
}

export function useAuth() {
  // Return the Clerk-based auth directly
  return useClerkAuth();
}
