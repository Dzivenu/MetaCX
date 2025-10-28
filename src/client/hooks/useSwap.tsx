"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { notifications } from "@mantine/notifications";

export type SwapBreakdown = {
  floatStackId: Id<"org_float_stacks">;
  repositoryId: Id<"org_repositories">;
  count: string;
  direction: string;
  denominationId: Id<"org_denominations">;
  denominationValue: string;
};

export type CreateSwapParams = {
  sessionId: Id<"org_cx_sessions">;
  inboundRepositoryId: Id<"org_repositories">;
  outboundRepositoryId: Id<"org_repositories">;
  ticker: string;
  inboundSum: string;
  outboundSum: string;
  breakdowns: SwapBreakdown[];
};

export const useSwap = (sessionId?: Id<"org_cx_sessions">) => {
  const swaps = useQuery(
    api.functions.orgCurrencySwaps.getSessionSwaps,
    sessionId ? { sessionId } : "skip"
  );

  const createSwapMutation = useMutation(
    api.functions.orgCurrencySwaps.createSwap
  );

  const createSwap = async (params: CreateSwapParams) => {
    try {
      const result = await createSwapMutation(params);
      notifications.show({
        title: "Success",
        message: `Swap created successfully`,
        color: "green",
      });
      return result;
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to create swap",
        color: "red",
      });
      throw error;
    }
  };

  return {
    swaps: swaps || [],
    isLoading: swaps === undefined,
    createSwap,
  };
};
