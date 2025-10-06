import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface FloatStack {
  id: string;
  openCount: number;
  closeCount: number;
  middayCount: number;
  lastSessionCount: number;
  spentDuringSession: string;
  transferredDuringSession: number;
  denominatedValue: number;
  ticker: string;
  openSpot: number;
  closeSpot: number;
  averageSpot: number;
  openConfirmedDt: Date | null;
  closeConfirmedDt: Date | null;
  value: number;
  denomination: {
    id: string;
    value: number;
    name: string;
  };
}

interface CurrencyFloat {
  id: string;
  ticker: string;
  name: string;
  typeof: string;
  floatStacks: FloatStack[];
}

interface Repository {
  id: string;
  name: string;
  floatCountRequired: boolean;
  active: boolean;
  state: string;
  accessLogs: any[];
  float: CurrencyFloat[];
}

interface FloatData {
  session: any;
  repositories: Repository[];
  branches: any[];
}

export const useFloat = (sessionId: string) => {
  // Convert string sessionId to Convex ID type
  const sessionConvexId = sessionId as Id<"org_cx_sessions">;

  // Get session float data using Convex
  const floatData = useQuery(
    api.functions.orgFloat.getSessionFloat,
    sessionId ? { sessionId: sessionConvexId } : "skip"
  );

  // Start float operation (open/close)
  const startFloatMutation = useMutation(api.functions.orgFloat.startFloat);

  // Confirm float operation
  const confirmFloatMutation = useMutation(api.functions.orgFloat.confirmFloat);

  // Update repository float stacks
  const updateRepositoryFloat = async ({
    repositoryId,
    floatStacks,
  }: {
    repositoryId: string;
    floatStacks: Partial<FloatStack>[];
  }) => {
    const response = await fetch(`/api/repositories/${repositoryId}/float`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId, floatStacks }),
    });
    if (!response.ok) {
      throw new Error("Failed to update repository float");
    }
    return response.json();
  };

  // Validate repository float
  const validateRepositoryFloat = async ({
    repositoryId,
    action,
  }: {
    repositoryId: string;
    action?: string;
  }) => {
    const response = await fetch(`/api/repositories/${repositoryId}/float`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId, action }),
    });
    if (!response.ok) {
      throw new Error("Failed to validate repository float");
    }
    return response.json();
  };

  const startFloat = useCallback(
    async (action: "START_OPEN" | "START_CLOSE" | "CANCEL_CLOSE") => {
      return await startFloatMutation({ sessionId: sessionConvexId, action });
    },
    [startFloatMutation, sessionConvexId]
  );

  const confirmFloat = useCallback(
    async (action: "CONFIRM_OPEN" | "CONFIRM_CLOSE") => {
      return await confirmFloatMutation({ sessionId: sessionConvexId, action });
    },
    [confirmFloatMutation, sessionConvexId]
  );

  const updateRepositoryFloatCallback = useCallback(
    (repositoryId: string, floatStacks: Partial<FloatStack>[]) => {
      return updateRepositoryFloat({
        repositoryId,
        floatStacks,
      });
    },
    []
  );

  const validateRepositoryFloatCallback = useCallback(
    (repositoryId: string, action?: string) => {
      return validateRepositoryFloat({
        repositoryId,
        action,
      });
    },
    []
  );

  return {
    // Data
    floatData,
    repositories: floatData?.repositories || [],
    session: floatData?.session,
    branches: floatData?.branches || [],

    // Loading states
    isLoading: !floatData,
    isStartingFloat: false, // Convex mutations don't expose pending state the same way
    isConfirmingFloat: false,
    isUpdatingFloat: false, // These are now synchronous API calls
    isValidatingFloat: false,

    // Error states
    startFloatError: null, // Convex mutations don't expose error state the same way
    confirmFloatError: null,
    updateFloatError: null, // These are now synchronous API calls
    validateFloatError: null,

    // Actions
    startFloat,
    confirmFloat,
    updateRepositoryFloat: updateRepositoryFloatCallback,
    validateRepositoryFloat: validateRepositoryFloatCallback,
  };
};
