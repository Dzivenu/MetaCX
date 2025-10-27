"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useConvex } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// Types for org customers
export interface OrgCustomer {
  id: string;
  clerkOrganizationId: string;
  title?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dob?: number;
  occupation?: string;
  employer?: string;
  email?: string;
  telephone?: string;
  active?: boolean;
  blacklisted?: boolean;
  blacklistReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrgCustomerData {
  firstName: string;
  lastName: string;
  title?: string;
  middleName?: string;
  email?: string;
  telephone?: string;
  dob?: number;
  occupation?: string;
  employer?: string;
}

interface UseOrgCustomersResult {
  orgCustomers: OrgCustomer[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateOrgCustomer: (
    id: string,
    data: Partial<OrgCustomer>
  ) => Promise<OrgCustomer | null>;
  createOrgCustomer: (
    data: CreateOrgCustomerData
  ) => Promise<OrgCustomer | null>;
  deleteOrgCustomer: (id: string) => Promise<boolean>;
  searchOrgCustomers: (searchTerm: string) => Promise<OrgCustomer[]>;
}

// Hook for org customers using Convex
export function useOrgCustomers(
  limit?: number,
  searchTerm?: string
): UseOrgCustomersResult {
  const { orgId } = useAuth();
  const convex = useConvex();
  const [error, setError] = useState<string | null>(null);

  // Set error if no organization is active
  React.useEffect(() => {
    if (orgId === undefined || orgId === null) {
      setError(
        "No active organization selected. Please create or select an organization to manage customers."
      );
    } else {
      setError(null);
    }
  }, [orgId]);

  // Use Convex query to get org customers
  const customersData = useQuery(
    api.functions.orgCustomers.getOrgCustomers,
    orgId
      ? {
          clerkOrganizationId: orgId,
          limit: limit,
          searchTerm: searchTerm,
        }
      : "skip"
  );

  // Mutations
  const createOrgCustomerMutation = useMutation(
    api.functions.orgCustomers.createOrgCustomer
  );
  const updateOrgCustomerMutation = useMutation(
    api.functions.orgCustomers.updateOrgCustomer
  );
  const deleteOrgCustomerMutation = useMutation(
    api.functions.orgCustomers.deleteOrgCustomer
  );
  const searchOrgCustomersQuery = api.functions.orgCustomers.searchOrgCustomers;

  const orgCustomers = useMemo(() => {
    if (!customersData) return [];
    return customersData.map((customer: any) => ({
      id: customer._id,
      clerkOrganizationId: customer.clerkOrganizationId,
      title: customer.title,
      firstName: customer.firstName,
      middleName: customer.middleName,
      lastName: customer.lastName,
      dob: customer.dob,
      occupation: customer.occupation,
      employer: customer.employer,
      email: customer.email,
      telephone: customer.telephone,
      active: customer.active !== false,
      blacklisted: customer.blacklisted || false,
      blacklistReason: customer.blacklistReason,
      createdAt: new Date(customer.createdAt).toISOString(),
      updatedAt: new Date(customer.updatedAt).toISOString(),
    }));
  }, [customersData]);

  // Timeout logic
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (orgId && customersData === undefined) {
      const timer = setTimeout(() => {
        setHasTimedOut(true);
      }, 5000);

      return () => clearTimeout(timer);
    } else if (customersData !== undefined) {
      setHasTimedOut(false);
    }
  }, [orgId, customersData]);

  const isLoading = customersData === undefined && !!orgId && !hasTimedOut;

  const createOrgCustomer = useCallback(
    async (data: CreateOrgCustomerData): Promise<OrgCustomer | null> => {
      setError(null);

      // Prevent creation if no organization is active
      if (!orgId) {
        const errorMessage =
          "Cannot create customer: No active organization selected. Please create or select an organization first.";
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      try {
        const result = await createOrgCustomerMutation({
          clerkOrganizationId: orgId, // ← This was missing!
          firstName: data.firstName,
          lastName: data.lastName,
          title: data.title,
          middleName: data.middleName,
          email: data.email,
          telephone: data.telephone,
          dob: data.dob,
          occupation: data.occupation,
          employer: data.employer,
        });

        return {
          id: result,
          clerkOrganizationId: orgId || "",
          title: data.title,
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          dob: data.dob,
          occupation: data.occupation,
          employer: data.employer,
          email: data.email,
          telephone: data.telephone,
          active: true,
          blacklisted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create org customer";
        setError(errorMessage);
        console.error("Error creating org customer:", err);
        return null;
      }
    },
    [createOrgCustomerMutation, orgId]
  );

  const updateOrgCustomer = useCallback(
    async (
      id: string,
      data: Partial<OrgCustomer>
    ): Promise<OrgCustomer | null> => {
      setError(null);
      try {
        await updateOrgCustomerMutation({
          customerId: id as Id<"org_customers">,
          clerkOrganizationId: orgId || undefined,
          firstName: data.firstName,
          lastName: data.lastName,
          title: data.title,
          middleName: data.middleName,
          email: data.email,
          telephone: data.telephone,
          dob: data.dob,
          occupation: data.occupation,
          employer: data.employer,
          active: data.active,
          blacklisted: data.blacklisted,
          blacklistReason: data.blacklistReason,
        });

        // Return the updated customer (optimistic update)
        const existingCustomer = orgCustomers.find((c) => c.id === id);
        if (existingCustomer) {
          return {
            ...existingCustomer,
            ...data,
            updatedAt: new Date().toISOString(),
          };
        }
        return null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update org customer";
        setError(errorMessage);
        console.error("Error updating org customer:", err);
        return null;
      }
    },
    [updateOrgCustomerMutation, orgCustomers]
  );

  const deleteOrgCustomer = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        await deleteOrgCustomerMutation({
          customerId: id as Id<"org_customers">,
        });
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete org customer";
        setError(errorMessage);
        console.error("Error deleting org customer:", err);
        return false;
      }
    },
    [deleteOrgCustomerMutation]
  );

  const searchOrgCustomers = useCallback(
    async (searchTerm: string): Promise<OrgCustomer[]> => {
      setError(null);
      try {
        const results = await convex.query(searchOrgCustomersQuery, {
          searchTerm: searchTerm,
          clerkOrganizationId: orgId || undefined,
          limit: 20,
        });

        return results.map((customer: any) => ({
          id: customer._id,
          clerkOrganizationId: customer.clerkOrganizationId,
          title: customer.title,
          firstName: customer.firstName,
          middleName: customer.middleName,
          lastName: customer.lastName,
          dob: customer.dob,
          occupation: customer.occupation,
          employer: customer.employer,
          email: customer.email,
          telephone: customer.telephone,
          active: customer.active !== false,
          blacklisted: customer.blacklisted || false,
          blacklistReason: customer.blacklistReason,
          createdAt: new Date(customer.createdAt).toISOString(),
          updatedAt: new Date(customer.updatedAt).toISOString(),
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to search org customers";
        setError(errorMessage);
        console.error("Error searching org customers:", err);
        return [];
      }
    },
    [convex, searchOrgCustomersQuery, orgId]
  );

  const refresh = useCallback(async () => {
    // Convex automatically refreshes, but we can reset error state
    setError(null);
  }, []);

  return {
    orgCustomers,
    loading: isLoading,
    error,
    refresh,
    updateOrgCustomer,
    createOrgCustomer,
    deleteOrgCustomer,
    searchOrgCustomers,
  };
}
