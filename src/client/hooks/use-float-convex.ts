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
  openConfirmedDt: Date | number | string | null;
  closeConfirmedDt: Date | number | string | null;
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
  // Convert string sessionId to Convex ID type, but only if it's a valid ID
  const sessionConvexId =
    sessionId && sessionId.length > 0
      ? (sessionId as Id<"org_cx_sessions">)
      : undefined;

  // State to force refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Get session float data using Convex
  const floatData = useQuery(
    api.functions.orgFloat.getSessionFloat,
    sessionConvexId
      ? {
          sessionId: sessionConvexId,
          _refreshTrigger: refreshTrigger,
        }
      : "skip"
  );

  // Session state transition mutations
  const startFloatOpenMutation = useMutation(
    api.functions.orgCxSessions.startFloatOpen
  );
  const confirmFloatOpenMutation = useMutation(
    api.functions.orgCxSessions.confirmFloatOpen
  );
  const startFloatCloseMutation = useMutation(
    api.functions.orgCxSessions.startFloatClose
  );
  const confirmFloatCloseMutation = useMutation(
    api.functions.orgCxSessions.confirmFloatClose
  );
  const cancelFloatCloseMutation = useMutation(
    api.functions.orgCxSessions.cancelFloatClose
  );

  // Update repository float stacks
  const updateRepositoryFloatMutation = useMutation(
    api.functions.orgFloat.updateRepositoryFloat
  );

  // Validate repository float
  const validateRepositoryFloatMutation = useMutation(
    api.functions.orgFloat.validateRepositoryFloat
  );

  const startFloat = useCallback(
    async (action: "START_OPEN" | "START_CLOSE" | "CANCEL_CLOSE") => {
      if (!sessionConvexId) {
        throw new Error("No session ID provided");
      }

      switch (action) {
        case "START_OPEN":
          return await startFloatOpenMutation({ sessionId: sessionConvexId });
        case "START_CLOSE":
          return await startFloatCloseMutation({ sessionId: sessionConvexId });
        case "CANCEL_CLOSE":
          return await cancelFloatCloseMutation({ sessionId: sessionConvexId });
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    },
    [startFloatOpenMutation, startFloatCloseMutation, cancelFloatCloseMutation, sessionConvexId]
  );

  const confirmFloat = useCallback(
    async (action: "CONFIRM_OPEN" | "CONFIRM_CLOSE") => {
      if (!sessionConvexId) {
        throw new Error("No session ID provided");
      }

      switch (action) {
        case "CONFIRM_OPEN":
          return await confirmFloatOpenMutation({ sessionId: sessionConvexId });
        case "CONFIRM_CLOSE":
          return await confirmFloatCloseMutation({
            sessionId: sessionConvexId,
          });
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    },
    [confirmFloatOpenMutation, confirmFloatCloseMutation, sessionConvexId]
  );

  const updateRepositoryFloat = useCallback(
    async ({
      floatStackId,
      updates,
    }: {
      floatStackId: string;
      updates: {
        openCount?: number;
        closeCount?: number;
        middayCount?: number;
        openConfirmedDt?: number | string | Date | null;
        closeConfirmedDt?: number | string | Date | null;
      };
    }) => {
      const floatStackConvexId = floatStackId as Id<"org_float_stacks">;

      // Convert date fields to timestamps (numbers) for Convex compatibility
      const convertedUpdates: {
        openCount?: number;
        closeCount?: number;
        middayCount?: number;
        openConfirmedDt?: number;
        closeConfirmedDt?: number;
      } = {};

      // Copy numeric fields as-is
      if (updates.openCount !== undefined) {
        convertedUpdates.openCount = updates.openCount;
      }
      if (updates.closeCount !== undefined) {
        convertedUpdates.closeCount = updates.closeCount;
      }
      if (updates.middayCount !== undefined) {
        convertedUpdates.middayCount = updates.middayCount;
      }

      // Convert date fields to numbers (timestamps)
      if (
        updates.openConfirmedDt !== undefined &&
        updates.openConfirmedDt !== null
      ) {
        if (typeof updates.openConfirmedDt === "string") {
          convertedUpdates.openConfirmedDt = new Date(
            updates.openConfirmedDt
          ).getTime();
        } else if (updates.openConfirmedDt instanceof Date) {
          convertedUpdates.openConfirmedDt = updates.openConfirmedDt.getTime();
        } else if (typeof updates.openConfirmedDt === "number") {
          convertedUpdates.openConfirmedDt = updates.openConfirmedDt;
        }
      }

      if (
        updates.closeConfirmedDt !== undefined &&
        updates.closeConfirmedDt !== null
      ) {
        if (typeof updates.closeConfirmedDt === "string") {
          convertedUpdates.closeConfirmedDt = new Date(
            updates.closeConfirmedDt
          ).getTime();
        } else if (updates.closeConfirmedDt instanceof Date) {
          convertedUpdates.closeConfirmedDt =
            updates.closeConfirmedDt.getTime();
        } else if (typeof updates.closeConfirmedDt === "number") {
          convertedUpdates.closeConfirmedDt = updates.closeConfirmedDt;
        }
      }

      return await updateRepositoryFloatMutation({
        floatStackId: floatStackConvexId,
        updates: convertedUpdates,
      });
    },
    [updateRepositoryFloatMutation]
  );

  const validateRepositoryFloat = useCallback(
    async ({ repositoryId }: { repositoryId: string }) => {
      if (!sessionConvexId) {
        throw new Error("No session ID provided");
      }
      const repositoryConvexId = repositoryId as Id<"org_repositories">;
      return await validateRepositoryFloatMutation({
        repositoryId: repositoryConvexId,
        sessionId: sessionConvexId,
      });
    },
    [validateRepositoryFloatMutation, sessionConvexId]
  );

  const refetch = useCallback(() => {
    // Force refetch by updating the trigger
    setRefreshTrigger((prev) => prev + 1);
    return Promise.resolve();
  }, []);

  // Extract data from Convex query result
  const repositories = floatData?.repositories || [];
  const session = floatData?.session || null;
  const isLoading = floatData === undefined && !!sessionConvexId;
  const error = null; // Convex handles errors differently

  return {
    floatData,
    repositories,
    session,
    isLoading,
    error,
    startFloat,
    confirmFloat,
    updateRepositoryFloat,
    validateRepositoryFloat,
    isStartingFloat: false, // TODO: Fix mutation loading state
    isConfirmingFloat: false, // TODO: Fix mutation loading state
    isUpdatingFloat: false, // TODO: Fix mutation loading state
    refetch,
  };
};
