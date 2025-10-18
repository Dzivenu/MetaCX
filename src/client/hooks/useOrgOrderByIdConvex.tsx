"use client";

import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export interface OrgOrderById {
  id: string;
  inboundSum?: string;
  inboundTicker?: string;
  inboundType?: string;
  outboundSum?: string;
  outboundTicker?: string;
  outboundType?: string;
  fxRate?: number;
  finalRate?: number;
  margin?: number;
  fee?: number;
  networkFee?: number;
  status?: string;
  orgSessionId?: string;
  userId?: string;
  orgCustomerId?: string;
  inboundOrgRepositoryId?: string;
  outboundOrgRepositoryId?: string;
  clerkOrganizationId?: string;
  createdAt: string;
  updatedAt: string;
  openDt?: string;
  closeDt?: string;
}

export function useOrgOrderById(orderId?: string) {
  const data = useQuery(
    api.functions.orgOrders.getOrgOrderById,
    orderId ? { orderId: orderId as Id<"org_orders"> } : "skip"
  );

  const updateOrgOrder = useMutation(api.functions.orgOrders.updateOrgOrder);

  const order = useMemo<OrgOrderById | null>(() => {
    if (!data) return null;
    return {
      id: data._id,
      inboundSum: data.inboundSum,
      inboundTicker: data.inboundTicker,
      inboundType: data.inboundType,
      outboundSum: data.outboundSum,
      outboundTicker: data.outboundTicker,
      outboundType: data.outboundType,
      fxRate: data.fxRate,
      finalRate: data.finalRate,
      margin: data.margin,
      fee: data.fee,
      networkFee: data.networkFee,
      status: data.status,
      orgSessionId: data.orgSessionId,
      userId: data.userId,
      orgCustomerId: (data as any).orgCustomerId,
      inboundOrgRepositoryId: data.inboundOrgRepositoryId,
      outboundOrgRepositoryId: data.outboundOrgRepositoryId,
      clerkOrganizationId: (data as any).clerkOrganizationId,
      createdAt: new Date(data.createdAt).toISOString(),
      updatedAt: new Date(data.updatedAt).toISOString(),
      openDt: data.openDt ? new Date(data.openDt).toISOString() : undefined,
      closeDt: data.closeDt ? new Date(data.closeDt).toISOString() : undefined,
    };
  }, [data]);

  return { order, isLoading: data === undefined, updateOrgOrder };
}
