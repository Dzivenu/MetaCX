"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// Types for org float data
export interface OrgFloatDenomination {
  id: string;
  value: number;
  ticker: string;
  currentCount: number;
  startingCount: number;
  totalSpent: number;
  totalTransferred: number;
}

export interface OrgFloatCurrency {
  name: string;
  ticker: string;
  denominations: OrgFloatDenomination[];
}

export interface OrgFloatRepository {
  id: string;
  name: string;
  type_of_currencies: string; // Add currency type field
  currencies: OrgFloatCurrency[];
}

export interface OrgFloat {
  sessionId: string;
  repositories: OrgFloatRepository[];
  sessionStatus: string;
}

interface UseOrgFloatResult {
  orgFloat: OrgFloat | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  startFloat: (
    action: "START_OPEN" | "START_CLOSE" | "CANCEL_CLOSE"
  ) => Promise<boolean>;
  confirmFloat: (action: "CONFIRM_OPEN" | "CONFIRM_CLOSE") => Promise<boolean>;
  updateRepositoryFloat: (
    floatStackId: string,
    updates: {
      openCount?: number;
      closeCount?: number;
      middayCount?: number;
      openConfirmedDt?: number;
      closeConfirmedDt?: number;
    }
  ) => Promise<boolean>;
  validateRepositoryFloat: (repositoryId: string) => Promise<boolean>;
}

// Hook for org float using Convex
export function useOrgFloat(
  sessionId?: string,
  filterTicker?: string
): UseOrgFloatResult {
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Query for float data
  const floatData = useQuery(
    api.functions.orgFloat.getSessionFloat,
    sessionId
      ? {
          sessionId: sessionId as Id<"org_cx_sessions">,
          _refreshTrigger: refreshTrigger,
        }
      : "skip"
  );

  // Mutations
  const startFloatMutation = useMutation(api.functions.orgFloat.startFloat);
  const confirmFloatMutation = useMutation(api.functions.orgFloat.confirmFloat);
  const updateRepositoryFloatMutation = useMutation(
    api.functions.orgFloat.updateRepositoryFloat
  );
  const validateRepositoryFloatMutation = useMutation(
    api.functions.orgFloat.validateRepositoryFloat
  );

  const isLoading = floatData === undefined;

  // Transform the data to our expected format
  const orgFloat: OrgFloat | null = floatData
    ? {
        sessionId: floatData.session.id,
        sessionStatus: floatData.session.status,
        repositories: (floatData.repositories || []).map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          type_of_currencies: repo.type_of_currencies, // Add currency type field
          currencies: (repo.currencies || [])
            .filter(
              (curr: any) => !filterTicker || curr.ticker === filterTicker
            )
            .map((curr: any) => ({
              name: curr.name,
              ticker: curr.ticker,
              denominations: (curr.denominations || []).map((denom: any) => ({
                id: denom.id,
                value: denom.value,
                ticker: curr.ticker,
                currentCount: denom.currentCount || 0,
                startingCount: denom.startingCount || 0,
                totalSpent: denom.totalSpent || 0,
                totalTransferred: denom.totalTransferred || 0,
              })),
            })),
        })),
      }
    : null;

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const startFloat = useCallback(
    async (
      action: "START_OPEN" | "START_CLOSE" | "CANCEL_CLOSE"
    ): Promise<boolean> => {
      try {
        setError(null);
        if (!sessionId) {
          throw new Error("Session ID is required");
        }

        await startFloatMutation({
          sessionId: sessionId as Id<"org_cx_sessions">,
          action,
        });

        refresh();
        return true;
      } catch (e: any) {
        setError(e?.message || "Failed to start float");
        return false;
      }
    },
    [startFloatMutation, sessionId, refresh]
  );

  const confirmFloat = useCallback(
    async (action: "CONFIRM_OPEN" | "CONFIRM_CLOSE"): Promise<boolean> => {
      try {
        setError(null);
        if (!sessionId) {
          throw new Error("Session ID is required");
        }

        await confirmFloatMutation({
          sessionId: sessionId as Id<"org_cx_sessions">,
          action,
        });

        refresh();
        return true;
      } catch (e: any) {
        setError(e?.message || "Failed to confirm float");
        return false;
      }
    },
    [confirmFloatMutation, sessionId, refresh]
  );

  const updateRepositoryFloat = useCallback(
    async (
      floatStackId: string,
      updates: {
        openCount?: number;
        closeCount?: number;
        middayCount?: number;
        openConfirmedDt?: number;
        closeConfirmedDt?: number;
      }
    ): Promise<boolean> => {
      try {
        setError(null);

        await updateRepositoryFloatMutation({
          floatStackId: floatStackId as Id<"org_float_stacks">,
          updates,
        });

        refresh();
        return true;
      } catch (e: any) {
        setError(e?.message || "Failed to update repository float");
        return false;
      }
    },
    [updateRepositoryFloatMutation, sessionId, refresh]
  );

  const validateRepositoryFloat = useCallback(
    async (repositoryId: string): Promise<boolean> => {
      try {
        setError(null);
        if (!sessionId) {
          throw new Error("Session ID is required");
        }

        await validateRepositoryFloatMutation({
          sessionId: sessionId as Id<"org_cx_sessions">,
          repositoryId: repositoryId as Id<"org_repositories">,
        });

        refresh();
        return true;
      } catch (e: any) {
        setError(e?.message || "Failed to validate repository float");
        return false;
      }
    },
    [validateRepositoryFloatMutation, sessionId, refresh]
  );

  return {
    orgFloat,
    loading: isLoading,
    error,
    refresh,
    startFloat,
    confirmFloat,
    updateRepositoryFloat,
    validateRepositoryFloat,
  };
}
