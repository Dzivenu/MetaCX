"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// Types to match the existing API interface
export interface Repository {
  id: string;
  name: string;
  typeOf: string;
  currencyType: string;
  form: string;
  key: string;
  floatThresholdBottom: number;
  floatThresholdTop: number;
  floatCountRequired: boolean;
  active: boolean;
  currencyTickers: string[];
  createdAt: string;
  updatedAt: string;
  displayOrderId?: number;
}

export interface CreateRepositoryData {
  name: string;
  key: string;
  typeOf?: string;
  currencyType?: string;
  form?: string;
  floatThresholdBottom?: number;
  floatThresholdTop?: number;
  floatCountRequired?: boolean;
  currencyTickers?: string[];
}

export interface UseRepositoriesResult {
  repositories: Repository[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refetch: () => Promise<void>;
  updateRepository: (id: string, data: Partial<Repository>) => Promise<boolean>;
  createRepository: (data: CreateRepositoryData) => Promise<string | null>;
  deleteRepository: (id: string) => Promise<boolean>;
  reorderRepositories: (orderedIds: string[]) => Promise<boolean>;
  getUserAccess: (clerkUserId: string) => Promise<Repository[]>;
  toggleUserAccess: (
    repoId: string,
    clerkUserId: string,
    next: boolean
  ) => Promise<boolean>;
}

// Hook for repositories using Convex
export function useRepositories(): UseRepositoriesResult {
  const { orgId } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Memoize orgId to prevent infinite re-renders
  const stableOrgId = useMemo(() => orgId, [orgId]);

  // Use Convex query to get repositories
  const repositoriesData = useQuery(
    api.functions.repositories.getRepositories,
    stableOrgId ? { clerkOrganizationId: stableOrgId } : "skip"
  );

  // Mutations
  const createRepositoryMutation = useMutation(
    api.functions.repositories.createRepository
  );
  const updateRepositoryMutation = useMutation(
    api.functions.repositories.updateRepository
  );
  const deleteRepositoryMutation = useMutation(
    api.functions.repositories.deleteRepository
  );
  const reorderRepositoriesMutation = useMutation(
    api.functions.repositories.reorderRepositories
  );
  const getUserAccessQuery = useQuery as unknown as <T>(
    fn: any,
    args: any
  ) => T | undefined;
  const grantAccessMutation = useMutation(
    api.functions.repositories.grantUserRepositoryAccess
  );
  const revokeAccessMutation = useMutation(
    api.functions.repositories.revokeUserRepositoryAccess
  );

  const repositories = useMemo(() => {
    if (!repositoriesData) return [];
    const parseMaybeNumber = (value: unknown): number => {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length === 0) return 0;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    return repositoriesData.map((repo: any) => ({
      id: repo._id,
      name: repo.name || "",
      typeOf: repo.typeOf || "",
      currencyType: repo.currencyType || "",
      form: repo.form || "",
      key: repo.key || "",
      floatThresholdBottom: parseMaybeNumber(repo.floatThresholdBottom),
      floatThresholdTop: parseMaybeNumber(repo.floatThresholdTop),
      floatCountRequired: repo.floatCountRequired || false,
      active: repo.active !== false,
      currencyTickers: repo.currencyTickers || [],
      createdAt: new Date(repo.createdAt).toISOString(),
      updatedAt: new Date(repo.updatedAt).toISOString(),
      displayOrderId: repo.displayOrderId,
    }));
  }, [repositoriesData]);

  // If orgId exists but data is undefined for more than a few seconds, assume Convex is not available
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (stableOrgId && repositoriesData === undefined) {
      const timer = setTimeout(() => {
        setHasTimedOut(true);
      }, 5000); // 5 second timeout

      return () => clearTimeout(timer);
    } else if (repositoriesData !== undefined) {
      setHasTimedOut(false);
    }
  }, [stableOrgId, repositoriesData]);

  const isLoading =
    repositoriesData === undefined && !!stableOrgId && !hasTimedOut;

  const createRepository = useCallback(
    async (data: CreateRepositoryData): Promise<string | null> => {
      setError(null);

      try {
        // Add timeout to prevent hanging forever
        const result = await Promise.race([
          createRepositoryMutation({
            name: data.name,
            key: data.key,
            typeOf: data.typeOf,
            currencyType: data.currencyType,
            form: data.form,
            floatThresholdBottom: data.floatThresholdBottom,
            floatThresholdTop: data.floatThresholdTop,
            floatCountRequired: data.floatCountRequired,
            currencyTickers: data.currencyTickers,
            // Ensure backend receives organization context
            clerkOrganizationId: stableOrgId || undefined,
          }),
          new Promise((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    "Repository creation timed out - Convex may not be available"
                  )
                ),
              10000
            )
          ),
        ]);

        return result as string;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create repository";
        console.error("🔍 useRepositories - createRepository error:", err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [createRepositoryMutation]
  );

  const updateRepository = useCallback(
    async (id: string, data: Partial<Repository>): Promise<boolean> => {
      setError(null);
      try {
        const toOptionalNumber = (value: unknown): number | undefined => {
          if (typeof value === "number") return value;
          if (typeof value === "string") {
            const trimmed = value.trim();
            if (trimmed.length === 0) return undefined;
            const parsed = Number(trimmed);
            return Number.isFinite(parsed) ? parsed : undefined;
          }
          return undefined;
        };

        await updateRepositoryMutation({
          repositoryId: id as Id<"org_repositories">,
          name: data.name,
          key: data.key,
          typeOf: data.typeOf,
          currencyType: data.currencyType,
          form: data.form,
          floatThresholdBottom: toOptionalNumber(data.floatThresholdBottom),
          floatThresholdTop: toOptionalNumber(data.floatThresholdTop),
          floatCountRequired: data.floatCountRequired,
          currencyTickers: data.currencyTickers,
        });
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update repository";
        setError(errorMessage);
        console.error("Error updating repository:", err);
        return false;
      }
    },
    [updateRepositoryMutation]
  );

  const deleteRepository = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        await deleteRepositoryMutation({
          repositoryId: id as Id<"org_repositories">,
        });
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete repository";
        setError(errorMessage);
        console.error("Error deleting repository:", err);
        return false;
      }
    },
    [deleteRepositoryMutation]
  );

  const reorderRepositories = useCallback(
    async (orderedIds: string[]): Promise<boolean> => {
      setError(null);
      try {
        await reorderRepositoriesMutation({
          orderedRepositoryIds: orderedIds as Id<"org_repositories">[],
          // Pass org to be explicit (server can also infer)
          clerkOrganizationId: stableOrgId || undefined,
        });
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to reorder repositories";
        setError(errorMessage);
        console.error("Error reordering repositories:", err);
        return false;
      }
    },
    [reorderRepositoriesMutation, stableOrgId]
  );

  const refresh = useCallback(async () => {
    // Convex automatically refreshes, but we can reset error state
    setError(null);
  }, []);

  return {
    repositories,
    loading: isLoading,
    error,
    refresh,
    refetch: refresh,
    updateRepository,
    createRepository,
    deleteRepository,
    reorderRepositories,
    getUserAccess: async (clerkUserId: string) => {
      // Call via useQuery-like shape imperatively: we expose a helper hook below if needed
      const data = getUserAccessQuery(
        api.functions.repositories.getUserRepositoryAccess,
        stableOrgId ? { clerkUserId, clerkOrganizationId: stableOrgId } : "skip"
      ) as any[] | undefined;
      return (data || []).map((repo: any) => ({
        id: repo._id,
        name: repo.name || "",
        typeOf: repo.typeOf || "",
        currencyType: repo.currencyType || "",
        form: repo.form || "",
        key: repo.key || "",
        floatThresholdBottom: Number(repo.floatThresholdBottom || 0),
        floatThresholdTop: Number(repo.floatThresholdTop || 0),
        floatCountRequired: repo.floatCountRequired || false,
        active: repo.active !== false,
        currencyTickers: repo.currencyTickers || [],
        createdAt: new Date(repo.createdAt).toISOString(),
        updatedAt: new Date(repo.updatedAt).toISOString(),
        displayOrderId: repo.displayOrderId,
      }));
    },
    toggleUserAccess: async (
      repoId: string,
      clerkUserId: string,
      next: boolean
    ): Promise<boolean> => {
      try {
        if (next) {
          await grantAccessMutation({
            repositoryId: repoId as Id<"org_repositories">,
            clerkUserId,
          });
        } else {
          await revokeAccessMutation({
            repositoryId: repoId as Id<"org_repositories">,
            clerkUserId,
          });
        }
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update access";
        setError(errorMessage);
        return false;
      }
    },
  };
}

// Hook for managing a single repository
export function useRepository(id?: string) {
  const [error, setError] = useState<string | null>(null);

  // Convert string ID to Convex ID if provided
  const convexId = id ? (id as Id<"org_repositories">) : undefined;

  const repository = useQuery(
    api.functions.repositories.getRepositoryById,
    convexId ? { repositoryId: convexId } : "skip"
  );

  const isLoading = repository === undefined && !!convexId;

  return {
    repository: repository
      ? {
          id: repository._id,
          name: repository.name || "",
          typeOf: repository.typeOf || "",
          currencyType: repository.currencyType || "",
          form: repository.form || "",
          key: repository.key || "",
          floatThresholdBottom:
            typeof repository.floatThresholdBottom === "number"
              ? repository.floatThresholdBottom
              : repository.floatThresholdBottom
                ? Number(repository.floatThresholdBottom)
                : 0,
          floatThresholdTop:
            typeof repository.floatThresholdTop === "number"
              ? repository.floatThresholdTop
              : repository.floatThresholdTop
                ? Number(repository.floatThresholdTop)
                : 0,
          floatCountRequired: repository.floatCountRequired || false,
          active: repository.active !== false,
          currencyTickers: repository.currencyTickers || [],
          createdAt: new Date(repository.createdAt).toISOString(),
          updatedAt: new Date(repository.updatedAt).toISOString(),
          displayOrderId: repository.displayOrderId,
        }
      : null,
    isLoading,
    error,
  };
}

// Hook for creating repositories
export function useCreateRepository() {
  const [error, setError] = useState<string | null>(null);
  const createRepositoryMutation = useMutation(
    api.functions.repositories.createRepository
  );
  const { orgId } = useAuth();

  // Memoize orgId to prevent infinite re-renders
  const stableOrgId = useMemo(() => orgId, [orgId]);

  const createRepository = useCallback(
    async (data: CreateRepositoryData) => {
      setError(null);

      try{
        // Add timeout to prevent hanging forever
        const result = await Promise.race([
          createRepositoryMutation({
            name: data.name,
            key: data.key,
            typeOf: data.typeOf,
            currencyType: data.currencyType,
            form: data.form,
            floatThresholdBottom: data.floatThresholdBottom,
            floatThresholdTop: data.floatThresholdTop,
            floatCountRequired: data.floatCountRequired,
            currencyTickers: data.currencyTickers,
            clerkOrganizationId: stableOrgId || undefined,
          }),
          new Promise((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    "Repository creation timed out - Convex may not be available"
                  )
                ),
              10000
            )
          ),
        ]);

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create repository";
        console.error("🔍 useCreateRepository - createRepository error:", err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [createRepositoryMutation]
  );

  return {
    createRepository,
    isLoading: false, // Convex handles loading state differently
    error,
  };
}
