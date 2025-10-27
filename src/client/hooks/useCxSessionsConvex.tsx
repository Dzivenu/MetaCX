"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// Types to match the existing API interface
export interface CxSession {
  id: string;
  openStartDt?: Date | null;
  openConfirmDt?: Date | null;
  closeStartDt?: Date | null;
  closeConfirmDt?: Date | null;
  userId?: string | null;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  status?: string | null;
  verifiedByUserId?: string | null;
  verifiedDt?: number | null;
  openStartUserId?: string | null;
  openConfirmUserId?: string | null;
  closeStartUserId?: string | null;
  closeConfirmUserId?: string | null;
}

export interface CreateCxSessionData {
  organizationId?: string;
  role?: string;
}

export interface UpdateCxSessionData {
  status?: string;
  role?: string;
}

export interface CxSessionFilters {
  page?: number;
  limit?: number;
  organizationId?: string;
  userId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "createdAt" | "updatedAt" | "openStartDt" | "closeStartDt";
  sortOrder?: "asc" | "desc";
}

export interface CxSessionListResponse {
  data: CxSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface CxSessionMutations {
  createSession: (data: CreateCxSessionData) => Promise<CxSession>;
  updateSession: (id: string, data: UpdateCxSessionData) => Promise<CxSession>;
  deleteSession: (id: string) => Promise<void>;
  joinSession: (id: string) => Promise<CxSession>;
  leaveSession: (id: string) => Promise<CxSession>;
  isLoading: boolean;
  error: string | null;
}

// Hook for listing sessions with pagination and filtering (Convex version)
export function useCxSessions(initialFilters: CxSessionFilters = {}) {
  const { orgId } = useAuth();
  const [filters, setFilters] = useState<CxSessionFilters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  });
  const [error, setError] = useState<string | null>(null);

  // Use Convex query with the current filters
  const response = useQuery(
    api.functions.orgCxSessions.getSessionsWithPagination,
    {
      clerkOrganizationId: filters.organizationId || orgId || undefined,
      page: filters.page,
      limit: filters.limit,
      state: filters.status,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }
  );

  const sessions = useMemo(() => {
    if (!response?.data) return [];
    return response.data.map((session: any) => ({
      ...session,
      id: session.id,
      openStartDt: session.openStartDt ? new Date(session.openStartDt) : null,
      openConfirmDt: session.openConfirmDt
        ? new Date(session.openConfirmDt)
        : null,
      closeStartDt: session.closeStartDt
        ? new Date(session.closeStartDt)
        : null,
      closeConfirmDt: session.closeConfirmDt
        ? new Date(session.closeConfirmDt)
        : null,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
    }));
  }, [response?.data]);

  const pagination = useMemo(() => {
    return (
      response?.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      }
    );
  }, [response?.pagination]);

  const updateFilters = useCallback((newFilters: Partial<CxSessionFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setError(null);
  }, []);

  const nextPage = useCallback(() => {
    if (pagination.hasNext) {
      updateFilters({ page: pagination.page + 1 });
    }
  }, [pagination.hasNext, pagination.page, updateFilters]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrev) {
      updateFilters({ page: pagination.page - 1 });
    }
  }, [pagination.hasPrev, pagination.page, updateFilters]);

  const goToPage = useCallback(
    (page: number) => {
      updateFilters({ page });
    },
    [updateFilters]
  );

  const refresh = useCallback(() => {
    // Convex automatically refreshes, but we can reset error state
    setError(null);
  }, []);

  const isLoading = response === undefined;

  return {
    sessions,
    pagination,
    filters,
    isLoading,
    error,
    updateFilters,
    nextPage,
    prevPage,
    goToPage,
    refresh,
  };
}

// Hook for managing a single session (Convex version)
export function useCxSession(id?: string) {
  const [error, setError] = useState<string | null>(null);

  // Convert string ID to Convex ID if provided
  const convexId = id ? (id as Id<"org_cx_sessions">) : undefined;

  const session = useQuery(
    api.functions.orgCxSessions.getSessionById,
    convexId ? { sessionId: convexId } : "skip"
  );

  const isLoading = session === undefined && !!convexId;

  const updateSession = useCallback(
    async (sessionId: string, data: UpdateCxSessionData) => {
      // This would need a new Convex mutation for updating sessions
      // For now, throw an error
      throw new Error("Update session not yet implemented with Convex");
    },
    []
  );

  const deleteSession = useCallback(async (sessionId: string) => {
    // This would use the deleteSession mutation
    throw new Error("Delete session should use useCxSessionMutations hook");
  }, []);

  const fetchSession = useCallback(async (sessionId: string) => {
    // Convex handles this automatically
    setError(null);
  }, []);

  return {
    session: session
      ? {
          ...session,
          id: (session as any).id ?? (session as any)._id,
          openStartDt: (session as any).openStartDt
            ? new Date((session as any).openStartDt)
            : null,
          openConfirmDt: (session as any).openConfirmDt
            ? new Date((session as any).openConfirmDt)
            : null,
          closeStartDt: (session as any).closeStartDt
            ? new Date((session as any).closeStartDt)
            : null,
          closeConfirmDt: (session as any).closeConfirmDt
            ? new Date((session as any).closeConfirmDt)
            : null,
          createdAt: new Date((session as any).createdAt),
          updatedAt: new Date((session as any).updatedAt),
        }
      : null,
    isLoading,
    error,
    fetchSession,
    updateSession,
    deleteSession,
  };
}

// Hook for creating sessions (Convex version)
export function useCreateCxSession() {
  const [error, setError] = useState<string | null>(null);
  const createSessionMutation = useMutation(
    api.functions.orgCxSessions.createCxSession
  );

  const createSession = useCallback(
    async (data: CreateCxSessionData) => {
      setError(null);
      try {
        const result = await createSessionMutation({
          organizationId: data.organizationId,
          role: data.role,
        });
        return {
          ...result,
          id: result.id,
          openStartDt: result.openStartDt ? new Date(result.openStartDt) : null,
          openConfirmDt: result.openConfirmDt
            ? new Date(result.openConfirmDt)
            : null,
          closeStartDt: result.closeStartDt
            ? new Date(result.closeStartDt)
            : null,
          closeConfirmDt: result.closeConfirmDt
            ? new Date(result.closeConfirmDt)
            : null,
          createdAt: new Date(result.createdAt),
          updatedAt: new Date(result.updatedAt),
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create session";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [createSessionMutation]
  );

  return {
    createSession,
    isLoading: false, // Convex handles loading state differently
    error,
  };
}

// Hook for session mutations (Convex version)
export function useCxSessionMutations(): CxSessionMutations {
  const [error, setError] = useState<string | null>(null);
  const { orgId } = useAuth();

  const createSessionMutation = useMutation(
    api.functions.orgCxSessions.createCxSession
  );
  const joinSessionMutation = useMutation(
    api.functions.orgCxSessions.joinSession
  );
  const leaveSessionMutation = useMutation(
    api.functions.orgCxSessions.leaveSession
  );
  const deleteSessionMutation = useMutation(
    api.functions.orgCxSessions.deleteSession
  );

  const createSession = useCallback(
    async (data: CreateCxSessionData) => {
      setError(null);
      try {
        const result = await createSessionMutation({
          organizationId: data.organizationId,
          role: data.role,
        });
        return {
          ...result,
          id: result.id,
          openStartDt: result.openStartDt ? new Date(result.openStartDt) : null,
          openConfirmDt: result.openConfirmDt
            ? new Date(result.openConfirmDt)
            : null,
          closeStartDt: result.closeStartDt
            ? new Date(result.closeStartDt)
            : null,
          closeConfirmDt: result.closeConfirmDt
            ? new Date(result.closeConfirmDt)
            : null,
          createdAt: new Date(result.createdAt),
          updatedAt: new Date(result.updatedAt),
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create session";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [createSessionMutation]
  );

  const updateSession = useCallback(
    async (id: string, data: UpdateCxSessionData) => {
      setError(null);
      try {
        // For now, this is not implemented
        throw new Error("Update session not yet implemented with Convex");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update session";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    []
  );

  const deleteSession = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await deleteSessionMutation({ sessionId: id as Id<"org_cx_sessions"> });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete session";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [deleteSessionMutation]
  );

  const joinSession = useCallback(
    async (id: string) => {
      setError(null);
      try {
        const result = await joinSessionMutation({
          sessionId: id as Id<"org_cx_sessions">,
          clerkOrganizationId: orgId || undefined,
        });
        return {
          ...result,
          id: result.id,
          openStartDt: result.openStartDt ? new Date(result.openStartDt) : null,
          openConfirmDt: result.openConfirmDt
            ? new Date(result.openConfirmDt)
            : null,
          closeStartDt: result.closeStartDt
            ? new Date(result.closeStartDt)
            : null,
          closeConfirmDt: result.closeConfirmDt
            ? new Date(result.closeConfirmDt)
            : null,
          createdAt: new Date(result.createdAt),
          updatedAt: new Date(result.updatedAt),
        };
      } catch (err) {
        console.error("🔧 joinSessionMutation error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to join session";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [joinSessionMutation, orgId]
  );

  const leaveSession = useCallback(
    async (id: string) => {
      setError(null);
      try {
        const result = await leaveSessionMutation({
          sessionId: id as Id<"org_cx_sessions">,
        });
        return {
          ...result,
          id: result.id,
          openStartDt: result.openStartDt ? new Date(result.openStartDt) : null,
          openConfirmDt: result.openConfirmDt
            ? new Date(result.openConfirmDt)
            : null,
          closeStartDt: result.closeStartDt
            ? new Date(result.closeStartDt)
            : null,
          closeConfirmDt: result.closeConfirmDt
            ? new Date(result.closeConfirmDt)
            : null,
          createdAt: new Date(result.createdAt),
          updatedAt: new Date(result.updatedAt),
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to leave session";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [leaveSessionMutation]
  );

  return {
    createSession,
    updateSession,
    deleteSession,
    joinSession,
    leaveSession,
    isLoading: false, // Convex mutations handle their own loading state
    error,
  };
}
