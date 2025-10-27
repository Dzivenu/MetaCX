"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { notifications } from "@mantine/notifications";

export type TransferBreakdown = {
  floatStackId: Id<"org_float_stacks">;
  repositoryId: Id<"org_repositories">;
  count: string;
  direction: string;
  denominationId: Id<"org_denominations">;
  denominationValue: string;
};

export type CreateTransferParams = {
  sessionId: Id<"org_cx_sessions">;
  outboundRepositoryId: Id<"org_repositories">;
  inboundRepositoryId: Id<"org_repositories">;
  outboundTicker: string;
  inboundTicker: string;
  outboundSum: string;
  inboundSum: string;
  breakdowns: TransferBreakdown[];
};

export const useTransfers = (sessionId?: Id<"org_cx_sessions">) => {
  const transfers = useQuery(
    api.functions.orgFloatTransfers.getSessionTransfers,
    sessionId ? { sessionId } : "skip"
  );

  const createTransferMutation = useMutation(
    api.functions.orgFloatTransfers.createTransfer
  );

  const createTransfer = async (params: CreateTransferParams) => {
    try {
      const result = await createTransferMutation(params);
      notifications.show({
        title: "Success",
        message: `Transfer created successfully`,
        color: "green",
      });
      return result;
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to create transfer",
        color: "red",
      });
      throw error;
    }
  };

  return {
    transfers: transfers || [],
    isLoading: transfers === undefined,
    createTransfer,
  };
};
