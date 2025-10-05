"use client";

import { useState, useEffect, useCallback } from "react";
import {
  cxSessionsApi,
  CxSession,
  CreateCxSessionData,
  UpdateCxSessionData,
  CxSessionFilters,
} from "@/client/api/cx-sessions";

interface CxSessionMutations {
  createSession: (data: CreateCxSessionData) => Promise<CxSession>;
  updateSession: (id: string, data: UpdateCxSessionData) => Promise<CxSession>;
  deleteSession: (id: string) => Promise<void>;
  joinSession: (id: string) => Promise<CxSession>;
  leaveSession: (id: string) => Promise<CxSession>;
  isLoading: boolean;
  error: string | null;
}

// Hook for listing sessions with pagination and filtering
export function useCxSessions(initialFilters: CxSessionFilters = {}) {
  const [sessions, setSessions] = useState<CxSession[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<CxSessionFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async (newFilters?: CxSessionFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const filtersToUse = newFilters || filters;
      const response = await cxSessionsApi.list(filtersToUse);
      
      // Ensure we have valid data and pagination
      setSessions(response.data || []);
      
      // Provide default pagination if not present
      const defaultPagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };
      
      setPagination(response.pagination || defaultPagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sessions");
      // Reset to empty state on error
      setSessions([]);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<CxSessionFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchSessions(updatedFilters);
  }, [filters, fetchSessions]);

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

  const goToPage = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  const refresh = useCallback(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

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

// Hook for managing a single session
export function useCxSession(id?: string) {
  const [session, setSession] = useState<CxSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await cxSessionsApi.getById(sessionId);
      setSession(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch session");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSession = useCallback(async (sessionId: string, data: UpdateCxSessionData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await cxSessionsApi.update(sessionId, data);
      setSession(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update session";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await cxSessionsApi.delete(sessionId);
      setSession(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete session";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchSession(id);
    }
  }, [id, fetchSession]);

  return {
    session,
    isLoading,
    error,
    fetchSession,
    updateSession,
    deleteSession,
  };
}

// Hook for creating sessions
export function useCreateCxSession() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async (data: CreateCxSessionData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await cxSessionsApi.create(data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create session";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createSession,
    isLoading,
    error,
  };
}

// Hook for session mutations (create, update, delete) with optimistic updates
export function useCxSessionMutations(): CxSessionMutations {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async (data: CreateCxSessionData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await cxSessionsApi.create(data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create session";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSession = useCallback(async (id: string, data: UpdateCxSessionData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await cxSessionsApi.update(id, data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update session";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await cxSessionsApi.delete(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete session";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinSession = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await cxSessionsApi.join(id);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to join session";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const leaveSession = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await cxSessionsApi.leave(id);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to leave session";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createSession,
    updateSession,
    deleteSession,
    joinSession,
    leaveSession,
    isLoading,
    error,
  };
}