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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to confirm float operation");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["float", sessionId] });
    },
  });

  // Update repository float stacks
  const updateRepositoryFloatMutation = useMutation({
    mutationFn: async ({
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["float", sessionId] });
    },
  });

  // Validate repository float
  const validateRepositoryFloatMutation = useMutation({
    mutationFn: async ({
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["float", sessionId] });
    },
  });

  const startFloat = useCallback(
    (action: "START_OPEN" | "START_CLOSE" | "CANCEL_CLOSE") => {
      return startFloatMutation.mutateAsync(action);
    },
    [startFloatMutation]
  );

  const confirmFloat = useCallback(
    (action: "CONFIRM_OPEN" | "CONFIRM_CLOSE") => {
      return confirmFloatMutation.mutateAsync(action);
    },
    [confirmFloatMutation]
  );

  const updateRepositoryFloat = useCallback(
    (repositoryId: string, floatStacks: Partial<FloatStack>[]) => {
      return updateRepositoryFloatMutation.mutateAsync({
        repositoryId,
        floatStacks,
      });
    },
    [updateRepositoryFloatMutation]
  );

  const validateRepositoryFloat = useCallback(
    (repositoryId: string, action?: string) => {
      return validateRepositoryFloatMutation.mutateAsync({
        repositoryId,
        action,
      });
    },
    [validateRepositoryFloatMutation]
  );

  return {
    // Data
    floatData,
    repositories: floatData?.repositories || [],
    session: floatData?.session,
    branches: floatData?.branches || [],

    // Loading states
    isLoading,
    isStartingFloat: startFloatMutation.isPending,
    isConfirmingFloat: confirmFloatMutation.isPending,
    isUpdatingFloat: updateRepositoryFloatMutation.isPending,
    isValidatingFloat: validateRepositoryFloatMutation.isPending,

    // Error states
    error,
    startFloatError: startFloatMutation.error,
    confirmFloatError: confirmFloatMutation.error,
    updateFloatError: updateRepositoryFloatMutation.error,
    validateFloatError: validateRepositoryFloatMutation.error,

    // Actions
    startFloat,
    confirmFloat,
    updateRepositoryFloat,
    validateRepositoryFloat,
    refetch,
  };
};
