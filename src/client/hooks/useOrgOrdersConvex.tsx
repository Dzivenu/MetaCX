"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useActiveSession } from "./useActiveSession";

// Types for org orders
export interface OrgOrder {
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
  customerName?: string; // Enriched from Convex query
  inboundOrgRepositoryId?: string;
  outboundOrgRepositoryId?: string;
  createdAt: string;
  updatedAt: string;
  openDt?: string;
  closeDt?: string;
}

export interface CreateOrgOrderData {
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
  inboundOrgRepositoryId?: string;
  outboundOrgRepositoryId?: string;
}

interface UseOrgOrdersResult {
  orgOrders: OrgOrder[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateOrgOrder: (
    id: string,
    data: Partial<OrgOrder>
  ) => Promise<OrgOrder | null>;
  createOrgOrder: (data: CreateOrgOrderData) => Promise<OrgOrder | null>;
  deleteOrgOrder: (id: string) => Promise<boolean>;
  getOrgOrdersBySession: (orgSessionId: string) => Promise<OrgOrder[]>;
  getOrgOrdersByStatus: (status: string) => Promise<OrgOrder[]>;
}

// Hook for org orders using Convex
export function useOrgOrders(
  orgSessionId?: string,
  status?: string,
  useActiveSessionFilter?: boolean
): UseOrgOrdersResult {
  const { orgId } = useAuth();
  const { activeSession } = useActiveSession();
  const [error, setError] = useState<string | null>(null);

  // Determine the actual session ID to use
  const effectiveSessionId = useActiveSessionFilter
    ? activeSession?._id
    : orgSessionId;

  console.log(
    "🔍 useOrgOrders - orgId:",
    orgId,
    "originalSessionId:",
    orgSessionId,
    "effectiveSessionId:",
    effectiveSessionId,
    "status:",
    status,
    "useActiveSessionFilter:",
    useActiveSessionFilter
  );

  // Use different queries based on parameters
  const ordersByStatus = useQuery(
    api.functions.orgOrders.getOrgOrdersByStatus,
    status ? { status: status, limit: 100 } : "skip"
  );

  // Main query using listOrgOrders with optional session filtering
  const ordersQuery = useQuery(api.functions.orgOrders.listOrgOrders, {
    clerkOrganizationId: orgId || undefined,
    orgSessionId: effectiveSessionId
      ? (effectiveSessionId as Id<"org_cx_sessions">)
      : undefined,
    limit: 100,
  });

  // Use the appropriate data source
  const ordersData = status ? ordersByStatus : ordersQuery;

  console.log("🔍 useOrgOrders - ordersData:", ordersData);

  // Mutations
  const createOrgOrderMutation = useMutation(
    api.functions.orgOrders.createOrgOrder
  );
  const updateOrgOrderMutation = useMutation(
    api.functions.orgOrders.updateOrgOrder
  );
  const deleteOrgOrderMutation = useMutation(
    api.functions.orgOrders.deleteOrgOrder
  );

  const orgOrders = useMemo(() => {
    if (!ordersData) return [];
    return ordersData.map((order: any) => ({
      id: order._id,
      inboundSum: order.inboundSum,
      inboundTicker: order.inboundTicker,
      inboundType: order.inboundType,
      outboundSum: order.outboundSum,
      outboundTicker: order.outboundTicker,
      outboundType: order.outboundType,
      fxRate: order.fxRate,
      finalRate: order.finalRate,
      margin: order.margin,
      fee: order.fee,
      networkFee: order.networkFee,
      status: order.status,
      orgSessionId: order.orgSessionId,
      userId: order.userId,
      orgCustomerId: order.orgCustomerId,
      customerName: order.customerName, // From Convex enrichment
      inboundOrgRepositoryId: order.inboundOrgRepositoryId,
      outboundOrgRepositoryId: order.outboundOrgRepositoryId,
      createdAt: new Date(order.createdAt).toISOString(),
      updatedAt: new Date(order.updatedAt).toISOString(),
      openDt: order.openDt ? new Date(order.openDt).toISOString() : undefined,
      closeDt: order.closeDt
        ? new Date(order.closeDt).toISOString()
        : undefined,
    }));
  }, [ordersData]);

  // Timeout logic
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    // Only set timeout if we're actually waiting for data
    const shouldWaitForData =
      orgSessionId || status || (!orgSessionId && !status);
    if (shouldWaitForData && ordersData === undefined) {
      const timer = setTimeout(() => {
        console.log(
          "🔍 useOrgOrders - Convex query timed out, assuming no data available"
        );
        setHasTimedOut(true);
      }, 5000);

      return () => clearTimeout(timer);
    } else if (ordersData !== undefined) {
      setHasTimedOut(false);
    }
  }, [orgSessionId, status, ordersData]);

  const isLoading =
    ordersData === undefined &&
    (!!orgSessionId || !!status || (!orgSessionId && !status)) &&
    !hasTimedOut;

  console.log(
    "🔍 useOrgOrders - isLoading:",
    isLoading,
    "orders count:",
    orgOrders.length,
    "hasTimedOut:",
    hasTimedOut
  );

  const createOrgOrder = useCallback(
    async (data: CreateOrgOrderData): Promise<OrgOrder | null> => {
      setError(null);
      try {
        const result = await createOrgOrderMutation({
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
          orgSessionId: data.orgSessionId! as Id<"org_cx_sessions">,
          userId: data.userId as Id<"users"> | undefined,
          inboundOrgRepositoryId: data.inboundOrgRepositoryId as
            | Id<"org_repositories">
            | undefined,
          outboundOrgRepositoryId: data.outboundOrgRepositoryId as
            | Id<"org_repositories">
            | undefined,
        });

        return {
          id: result,
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
          inboundOrgRepositoryId: data.inboundOrgRepositoryId,
          outboundOrgRepositoryId: data.outboundOrgRepositoryId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create org order";
        setError(errorMessage);
        console.error("Error creating org order:", err);
        return null;
      }
    },
    [createOrgOrderMutation]
  );

  const updateOrgOrder = useCallback(
    async (id: string, data: Partial<OrgOrder>): Promise<OrgOrder | null> => {
      setError(null);
      try {
        await updateOrgOrderMutation({
          orderId: id as Id<"org_orders">,
          inboundSum: data.inboundSum,
          outboundSum: data.outboundSum,
          fxRate: data.fxRate,
          finalRate: data.finalRate,
          margin: data.margin,
          fee: data.fee,
          networkFee: data.networkFee,
          status: data.status,
          closeDt: data.closeDt ? new Date(data.closeDt).getTime() : undefined,
        });

        // Return the updated order (optimistic update)
        const existingOrder = orgOrders.find((o) => o.id === id);
        if (existingOrder) {
          return {
            ...existingOrder,
            ...data,
            updatedAt: new Date().toISOString(),
          };
        }
        return null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update org order";
        setError(errorMessage);
        console.error("Error updating org order:", err);
        return null;
      }
    },
    [updateOrgOrderMutation, orgOrders]
  );

  const deleteOrgOrder = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        await deleteOrgOrderMutation({
          orderId: id as Id<"org_orders">,
        });
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete org order";
        setError(errorMessage);
        console.error("Error deleting org order:", err);
        return false;
      }
    },
    [deleteOrgOrderMutation]
  );

  const getOrgOrdersBySession = useCallback(
    async (orgSessionId: string): Promise<OrgOrder[]> => {
      // This would normally use a separate query, but we can reuse existing logic
      // In a real implementation, you might want to use a separate query function
      return orgOrders.filter((order) => order.orgSessionId === orgSessionId);
    },
    [orgOrders]
  );

  const getOrgOrdersByStatus = useCallback(
    async (status: string): Promise<OrgOrder[]> => {
      // This would normally use a separate query, but we can reuse existing logic
      return orgOrders.filter((order) => order.status === status);
    },
    [orgOrders]
  );

  const refresh = useCallback(async () => {
    // Convex automatically refreshes, but we can reset error state
    setError(null);
  }, []);

  return {
    orgOrders,
    loading: isLoading,
    error,
    refresh,
    updateOrgOrder,
    createOrgOrder,
    deleteOrgOrder,
    getOrgOrdersBySession,
    getOrgOrdersByStatus,
  };
}
