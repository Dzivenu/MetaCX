"use client";

import React, { useCallback, useMemo } from "react";
import { useQuery, useMutation, useConvex } from "convex/react";
import { useOrganization } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// Address data interface
export interface OrgAddress {
  _id: Id<"org_addresses">;
  _creationTime: number;
  clerkOrganizationId: string;
  clerk_org_id: string;
  org_id: Id<"organizations">;
  parentType: string;
  parentId: string;
  addressType?: string;
  line1: string;
  line2?: string;
  line3?: string;
  city: string;
  county?: string;
  stateCode: string;
  stateName: string;
  postalCode: string;
  countryCode?: string;
  countryName: string;
  sublocality?: string;
  administrativeArea?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  validated?: boolean;
  standardized?: boolean;
  validationService?: string;
  validationDate?: number;
  deliveryInstructions?: string;
  accessInstructions?: string;
  contactPhone?: string;
  contactEmail?: string;
  departmentName?: string;
  buildingName?: string;
  floorNumber?: string;
  roomNumber?: string;
  primary?: boolean;
  active?: boolean;
  verified?: boolean;
  confidential?: boolean;
  effectiveDate?: number;
  expirationDate?: number;
  addressFull?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: Id<"users">;
  lastModifiedBy?: Id<"users">;
}

// Create address data interface
export interface CreateOrgAddressData {
  parentType: string;
  parentId: string;
  addressType?: string;
  line1: string;
  line2?: string;
  line3?: string;
  city: string;
  county?: string;
  stateCode: string;
  stateName: string;
  postalCode: string;
  countryCode: string;
  countryName: string;
  primary?: boolean;
  verified?: boolean;
  deliveryInstructions?: string;
  accessInstructions?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  addressFull?: string;
}

// Update address data interface
export interface UpdateOrgAddressData {
  addressId: Id<"org_addresses">;
  line1?: string;
  line2?: string;
  line3?: string;
  city?: string;
  county?: string;
  stateCode?: string;
  stateName?: string;
  postalCode?: string;
  countryCode?: string;
  countryName?: string;
  addressType?: string;
  primary?: boolean;
  verified?: boolean;
  deliveryInstructions?: string;
  accessInstructions?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  addressFull?: string;
  active?: boolean;
}

interface UseOrgAddressesOptions {
  parentType: string;
  parentId?: string;
}

interface UseOrgAddressesResult {
  addresses: OrgAddress[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createAddress: (
    data: CreateOrgAddressData
  ) => Promise<Id<"org_addresses"> | null>;
  updateAddress: (data: UpdateOrgAddressData) => Promise<boolean>;
  deleteAddress: (addressId: Id<"org_addresses">) => Promise<boolean>;
  getAddressById: (
    addressId: Id<"org_addresses">
  ) => Promise<OrgAddress | null>;
  setPrimaryAddress: (addressId: Id<"org_addresses">) => Promise<boolean>;
}

export const useOrgAddresses = ({
  parentType,
  parentId,
}: UseOrgAddressesOptions): UseOrgAddressesResult => {
  const { organization } = useOrganization();
  const [error, setError] = React.useState<string | null>(null);

  const orgId = organization?.id;
  const convex = useConvex();

  // Debug logging
  console.log("useOrgAddresses hook:", {
    parentType,
    parentId,
    orgId,
    hasOrganization: !!organization,
  });

  // Queries
  const addressesQuery = useQuery(
    api.functions.orgAddresses.getOrgAddressesByParent,
    orgId && parentId
      ? {
          parentType,
          parentId,
          clerkOrganizationId: orgId,
        }
      : "skip"
  );

  // Mutations
  const createAddressMutation = useMutation(
    api.functions.orgAddresses.createOrgAddress
  );
  const updateAddressMutation = useMutation(
    api.functions.orgAddresses.updateOrgAddress
  );
  const deleteAddressMutation = useMutation(
    api.functions.orgAddresses.deleteOrgAddress
  );

  // Set error if no organization is selected
  React.useEffect(() => {
    if (!orgId) {
      setError(
        "No active organization selected. Please create or select an organization first."
      );
    } else {
      setError(null);
    }
  }, [orgId]);

  // Computed values
  const addresses = useMemo(() => {
    const result = addressesQuery || [];
    console.log(
      "🏠 Loaded addresses:",
      result.map((addr) => ({
        id: addr._id,
        clerkOrganizationId: addr.clerkOrganizationId,
        line1: addr.line1,
        parentType: addr.parentType,
        parentId: addr.parentId,
      }))
    );
    console.log("🏠 Current orgId for comparison:", orgId);
    return result;
  }, [addressesQuery, orgId]);

  const loading = useMemo(() => {
    return addressesQuery === undefined && !!orgId && !!parentId;
  }, [addressesQuery, orgId, parentId]);

  // Create address
  const createAddress = useCallback(
    async (data: CreateOrgAddressData): Promise<Id<"org_addresses"> | null> => {
      console.log("🔧 createAddress called with data:", data);
      console.log("🔧 orgId:", orgId);
      setError(null);

      if (!orgId) {
        const errorMessage =
          "Cannot create address: No active organization selected.";
        console.error("❌ No orgId available:", errorMessage);
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      try {
        console.log("📡 Calling createAddressMutation...");
        const result = await createAddressMutation({
          clerkOrganizationId: orgId,
          parentType: data.parentType,
          parentId: data.parentId,
          addressType: data.addressType,
          line1: data.line1,
          line2: data.line2,
          line3: data.line3,
          city: data.city,
          county: data.county,
          stateCode: data.stateCode,
          stateName: data.stateName,
          postalCode: data.postalCode,
          countryCode: data.countryCode,
          countryName: data.countryName,
          primary: data.primary,
          verified: data.verified,
          deliveryInstructions: data.deliveryInstructions,
          accessInstructions: data.accessInstructions,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
          notes: data.notes,
          addressFull: data.addressFull,
        });

        console.log("✅ createAddressMutation returned:", result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create address";
        console.error("❌ Error creating address:", err);
        setError(errorMessage);
        return null;
      }
    },
    [createAddressMutation, orgId]
  );

  // Update address
  const updateAddress = useCallback(
    async (data: UpdateOrgAddressData): Promise<boolean> => {
      console.log("🔧 updateAddress called with data:", data);
      console.log("🔧 Current orgId:", orgId);
      setError(null);

      if (!orgId) {
        const errorMessage =
          "Cannot update address: No active organization selected.";
        console.error("❌ No orgId available for update:", errorMessage);
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      try {
        console.log("📡 Calling updateAddressMutation...");
        const result = await updateAddressMutation({
          ...data,
          clerkOrganizationId: orgId, // Explicitly pass organization ID
        });
        console.log("✅ updateAddressMutation returned:", result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update address";
        console.error("❌ Error updating address:", err);
        console.error("❌ Update data was:", data);
        console.error("❌ Current orgId:", orgId);
        setError(errorMessage);
        return false;
      }
    },
    [updateAddressMutation, orgId]
  );

  // Delete address
  const deleteAddress = useCallback(
    async (addressId: Id<"org_addresses">): Promise<boolean> => {
      setError(null);

      if (!orgId) {
        const errorMessage =
          "Cannot delete address: No active organization selected.";
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      try {
        const result = await deleteAddressMutation({ addressId });
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete address";
        setError(errorMessage);
        console.error("Error deleting address:", err);
        return false;
      }
    },
    [deleteAddressMutation, orgId]
  );

  // Get address by ID
  const getAddressById = useCallback(
    async (addressId: Id<"org_addresses">): Promise<OrgAddress | null> => {
      setError(null);

      if (!orgId) {
        const errorMessage =
          "Cannot get address: No active organization selected.";
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      try {
        const result = await convex.query(
          api.functions.orgAddresses.getOrgAddressById,
          { addressId }
        );
        return result as OrgAddress;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get address";
        setError(errorMessage);
        console.error("Error getting address:", err);
        return null;
      }
    },
    [convex, orgId]
  );

  // Set primary address
  const setPrimaryAddress = useCallback(
    async (addressId: Id<"org_addresses">): Promise<boolean> => {
      return await updateAddress({
        addressId,
        primary: true,
      });
    },
    [updateAddress]
  );

  // Refresh function
  const refresh = useCallback(async (): Promise<void> => {
    // The query will automatically refresh when dependencies change
    setError(null);
  }, []);

  return {
    addresses,
    loading,
    error,
    refresh,
    createAddress,
    updateAddress,
    deleteAddress,
    getAddressById,
    setPrimaryAddress,
  };
};
