"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// Types for org addresses
export interface OrgAddress {
  id: string;
  clerkOrganizationId: string;
  parentType: string;
  parentId: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode?: string;
  primary?: boolean;
  active?: boolean;
  addressFull?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrgAddressData {
  parentType: string;
  parentId: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode?: string;
  primary?: boolean;
  addressFull?: string;
}

interface UseOrgAddressesResult {
  orgAddresses: OrgAddress[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateOrgAddress: (
    id: string,
    data: Partial<OrgAddress>
  ) => Promise<OrgAddress | null>;
  createOrgAddress: (data: CreateOrgAddressData) => Promise<OrgAddress | null>;
  deleteOrgAddress: (id: string) => Promise<boolean>;
}

// Hook for org addresses using Convex
export function useOrgAddresses(
  parentType?: string,
  parentId?: string
): UseOrgAddressesResult {
  const { orgId } = useAuth();
  const [error, setError] = useState<string | null>(null);

  console.log(
    "🔍 useOrgAddresses - orgId:",
    orgId,
    "parentType:",
    parentType,
    "parentId:",
    parentId
  );

  // Use Convex query to get org addresses
  const addressesData = useQuery(
    api.functions.orgAddresses.getOrgAddressesByParent,
    orgId && parentType && parentId
      ? {
          parentType: parentType,
          parentId: parentId,
          clerkOrganizationId: orgId,
        }
      : "skip"
  );

  console.log("🔍 useOrgAddresses - addressesData:", addressesData);

  // Mutations
  const createOrgAddressMutation = useMutation(
    api.functions.orgAddresses.createOrgAddress
  );
  const updateOrgAddressMutation = useMutation(
    api.functions.orgAddresses.updateOrgAddress
  );
  const deleteOrgAddressMutation = useMutation(
    api.functions.orgAddresses.deleteOrgAddress
  );

  const orgAddresses = useMemo(() => {
    if (!addressesData) return [];
    return addressesData.map((address: any) => ({
      id: address._id,
      clerkOrganizationId: address.clerkOrganizationId,
      parentType: address.parentType,
      parentId: address.parentId,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      countryCode: address.countryCode,
      primary: address.primary || false,
      active: address.active !== false,
      addressFull: address.addressFull,
      createdAt: new Date(address.createdAt).toISOString(),
      updatedAt: new Date(address.updatedAt).toISOString(),
    }));
  }, [addressesData]);

  // Timeout logic
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (orgId && parentType && parentId && addressesData === undefined) {
      const timer = setTimeout(() => {
        console.log(
          "🔍 useOrgAddresses - Convex query timed out, assuming no data available"
        );
        setHasTimedOut(true);
      }, 5000);

      return () => clearTimeout(timer);
    } else if (addressesData !== undefined) {
      setHasTimedOut(false);
    }
  }, [orgId, parentType, parentId, addressesData]);

  const isLoading =
    addressesData === undefined &&
    !!orgId &&
    !!parentType &&
    !!parentId &&
    !hasTimedOut;

  console.log(
    "🔍 useOrgAddresses - isLoading:",
    isLoading,
    "addresses count:",
    orgAddresses.length,
    "hasTimedOut:",
    hasTimedOut
  );

  const createOrgAddress = useCallback(
    async (data: CreateOrgAddressData): Promise<OrgAddress | null> => {
      setError(null);
      try {
        const result = await createOrgAddressMutation({
          parentType: data.parentType,
          parentId: data.parentId,
          line1: data.line1,
          line2: data.line2,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          countryCode: data.countryCode,
          primary: data.primary,
          addressFull: data.addressFull,
        });

        return {
          id: result,
          clerkOrganizationId: orgId || "",
          parentType: data.parentType,
          parentId: data.parentId,
          line1: data.line1,
          line2: data.line2,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          countryCode: data.countryCode,
          primary: data.primary || false,
          active: true,
          addressFull: data.addressFull,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create org address";
        setError(errorMessage);
        console.error("Error creating org address:", err);
        return null;
      }
    },
    [createOrgAddressMutation, orgId]
  );

  const updateOrgAddress = useCallback(
    async (
      id: string,
      data: Partial<OrgAddress>
    ): Promise<OrgAddress | null> => {
      setError(null);
      try {
        await updateOrgAddressMutation({
          addressId: id as Id<"org_addresses">,
          line1: data.line1,
          line2: data.line2,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          countryCode: data.countryCode,
          primary: data.primary,
          addressFull: data.addressFull,
          active: data.active,
        });

        // Return the updated address (optimistic update)
        const existingAddress = orgAddresses.find((a) => a.id === id);
        if (existingAddress) {
          return {
            ...existingAddress,
            ...data,
            updatedAt: new Date().toISOString(),
          };
        }
        return null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update org address";
        setError(errorMessage);
        console.error("Error updating org address:", err);
        return null;
      }
    },
    [updateOrgAddressMutation, orgAddresses]
  );

  const deleteOrgAddress = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        await deleteOrgAddressMutation({
          addressId: id as Id<"org_addresses">,
        });
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete org address";
        setError(errorMessage);
        console.error("Error deleting org address:", err);
        return false;
      }
    },
    [deleteOrgAddressMutation]
  );

  const refresh = useCallback(async () => {
    // Convex automatically refreshes, but we can reset error state
    setError(null);
  }, []);

  return {
    orgAddresses,
    loading: isLoading,
    error,
    refresh,
    updateOrgAddress,
    createOrgAddress,
    deleteOrgAddress,
  };
}
