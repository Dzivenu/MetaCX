"use client";

import React, { useCallback, useMemo } from "react";
import { useOrganization } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export interface OrgIdentification {
  _id: Id<"org_identifications">;
  _creationTime: number;
  clerkOrganizationId: string;
  clerk_org_id: string;
  org_id: Id<"organizations">;
  orgCustomerId: Id<"org_customers">;
  orgAddressId?: Id<"org_addresses">;
  typeOf: string;
  referenceNumber: string;
  issuingCountryCode?: string;
  issuingCountryName?: string;
  issuingStateCode?: string;
  issuingStateName?: string;
  issueDate?: number;
  expiryDate?: number;
  photo?: string;
  dateOfBirth?: number;
  originOfFunds?: string;
  purposeOfFunds?: string;
  description?: string;
  verified?: boolean;
  verifiedAt?: number;
  reviewerId?: Id<"users">;
  primary?: boolean;
  typeCode?: string;
  countryCode?: string;
  countryName?: string;
  provinceCode?: string;
  provinceName?: string;
  provinceOther?: string;
  active?: boolean;
  orderId?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: Id<"users">;
}

export interface CreateIdentificationData {
  orgCustomerId: Id<"org_customers">;
  orgAddressId?: Id<"org_addresses">;
  typeOf: string;
  referenceNumber: string;
  issuingCountryCode?: string;
  issuingCountryName?: string;
  issuingStateCode?: string;
  issuingStateName?: string;
  issueDate?: number;
  expiryDate?: number;
  photo?: string;
  dateOfBirth?: number;
  originOfFunds?: string;
  purposeOfFunds?: string;
  description?: string;
  verified?: boolean;
  primary?: boolean;
  typeCode?: string;
  countryCode?: string;
  countryName?: string;
  provinceCode?: string;
  provinceName?: string;
}

export interface UpdateIdentificationData
  extends Partial<CreateIdentificationData> {
  id: Id<"org_identifications">;
  active?: boolean;
}

interface UseOrgIdentificationsOptions {
  orgCustomerId?: Id<"org_customers">;
}

interface UseOrgIdentificationsResult {
  items: OrgIdentification[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createItem: (
    data: CreateIdentificationData
  ) => Promise<Id<"org_identifications"> | null>;
  updateItem: (data: UpdateIdentificationData) => Promise<boolean>;
  deleteItem: (id: Id<"org_identifications">) => Promise<boolean>;
}

export const useOrgIdentifications = ({
  orgCustomerId,
}: UseOrgIdentificationsOptions): UseOrgIdentificationsResult => {
  const { organization } = useOrganization();
  const [error, setError] = React.useState<string | null>(null);
  const orgId = organization?.id;

  const listQuery = useQuery(
    api.functions.orgIdentifications.listByCustomer,
    orgId && orgCustomerId
      ? { orgCustomerId, clerkOrganizationId: orgId }
      : "skip"
  );

  const createMutation = useMutation(api.functions.orgIdentifications.create);
  const updateMutation = useMutation(api.functions.orgIdentifications.update);
  const deleteMutation = useMutation(api.functions.orgIdentifications.remove);

  React.useEffect(() => {
    if (!orgId) setError("No active organization selected.");
    else setError(null);
  }, [orgId]);

  const items = useMemo(() => listQuery || [], [listQuery]);
  const loading = useMemo(
    () => listQuery === undefined && !!orgId && !!orgCustomerId,
    [listQuery, orgId, orgCustomerId]
  );

  const refresh = useCallback(async () => {
    setError(null);
  }, []);

  const createItem = useCallback(
    async (data: CreateIdentificationData) => {
      setError(null);
      if (!orgId) throw new Error("No active organization selected");
      try {
        const id = await createMutation({
          ...data,
          clerkOrganizationId: orgId,
        });
        return id;
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to create identification";
        setError(msg);
        console.error("create identification error:", err);
        return null;
      }
    },
    [createMutation, orgId]
  );

  const updateItem = useCallback(
    async (data: UpdateIdentificationData) => {
      setError(null);
      if (!orgId) throw new Error("No active organization selected");
      try {
        const ok = await updateMutation({
          ...data,
          clerkOrganizationId: orgId,
        });
        return ok;
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to update identification";
        setError(msg);
        console.error("update identification error:", err);
        return false;
      }
    },
    [updateMutation, orgId]
  );

  const deleteItem = useCallback(
    async (id: Id<"org_identifications">) => {
      setError(null);
      try {
        const ok = await deleteMutation({ id });
        return ok;
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to delete identification";
        setError(msg);
        console.error("delete identification error:", err);
        return false;
      }
    },
    [deleteMutation]
  );

  return { items, loading, error, refresh, createItem, updateItem, deleteItem };
};
