import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface CreateOrderPayload {
  sessionId: string;
  userId: string;
  inboundTicker: string;
  inboundSum: number | string;
  outboundTicker: string;
  outboundSum: number | string;
  fxRate?: number;
  rateWoFees?: number;
  finalRate?: number;
  finalRateWithoutFees?: number;
  margin?: number;
  fee?: number;
  networkFee?: number;
  status: string;
  btcFeeRate?: string;
  quoteSource?: string;
  inboundRepositoryId?: string | null;
  outboundRepositoryId?: string | null;
  batchedStatus?: 0 | 1 | 2;
}

export const useOrder = () => {
  const queryClient = useQueryClient();

  const createOrder = useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create order");
      return res.json();
    },
  });

  const createBreakdowns = useMutation({
    mutationFn: async ({
      orderId,
      usagePercentage,
    }: {
      orderId: string;
      usagePercentage?: number;
    }) => {
      const res = await fetch(`/api/orders/${orderId}/breakdowns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intention: "CREATE", usagePercentage }),
      });
      if (!res.ok) throw new Error("Failed to create breakdowns");
      return res.json();
    },
  });

  const commitBreakdowns = useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const res = await fetch(`/api/orders/${orderId}/breakdowns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intention: "COMMIT" }),
      });
      if (!res.ok) throw new Error("Failed to commit breakdowns");
      return res.json();
    },
  });

  const uncommitBreakdowns = useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const res = await fetch(`/api/orders/${orderId}/breakdowns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intention: "UNCOMMIT" }),
      });
      if (!res.ok) throw new Error("Failed to uncommit breakdowns");
      return res.json();
    },
  });

  const deleteBreakdowns = useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const res = await fetch(`/api/orders/${orderId}/breakdowns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intention: "DELETE" }),
      });
      if (!res.ok) throw new Error("Failed to delete breakdowns");
      return res.json();
    },
  });

  return {
    createOrder,
    createBreakdowns,
    commitBreakdowns,
    uncommitBreakdowns,
    deleteBreakdowns,
  };
};


