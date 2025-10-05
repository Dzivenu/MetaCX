"use client";

import { useCallback, useMemo } from "react";
import {
  useOrgCustomers,
  type OrgCustomer,
  type CreateOrgCustomerData,
} from "./useOrgCustomersConvex";

// Legacy interface for backward compatibility
export interface Customer {
  id: string;
  organizationId?: string;
  title?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dob?: string | null;
  occupation?: string | null;
  employer?: string | null;
  info?: string | null;
  telephone?: string | null;
  email?: string | null;
  duplicate?: boolean | null;
  mergedId?: string | null;
  riskScore?: string | null;
  active?: boolean | null;
  blacklisted?: boolean | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface UseCustomersResult {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createCustomer: (data: Partial<Customer>) => Promise<Customer | null>;
  getCustomer: (id: string) => Promise<Customer | null>;
}

// Adapter function to convert OrgCustomer to legacy Customer format
function adaptOrgCustomerToCustomer(orgCustomer: OrgCustomer): Customer {
  return {
    id: orgCustomer.id,
    organizationId: orgCustomer.clerkOrganizationId,
    title: orgCustomer.title,
    firstName: orgCustomer.firstName,
    middleName: orgCustomer.middleName,
    lastName: orgCustomer.lastName,
    dob: orgCustomer.dob
      ? new Date(orgCustomer.dob).toISOString().split("T")[0]
      : null,
    occupation: orgCustomer.occupation,
    employer: orgCustomer.employer,
    info: null,
    telephone: orgCustomer.telephone,
    email: orgCustomer.email,
    duplicate: false,
    mergedId: null,
    riskScore: null,
    active: orgCustomer.active,
    blacklisted: orgCustomer.blacklisted,
    createdAt: orgCustomer.createdAt,
    updatedAt: orgCustomer.updatedAt,
  };
}

// Adapter function to convert legacy Customer data to CreateOrgCustomerData
function adaptCustomerToCreateOrgCustomer(
  data: Partial<Customer>
): CreateOrgCustomerData {
  return {
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    title: data.title || undefined,
    middleName: data.middleName || undefined,
    email: data.email || undefined,
    telephone: data.telephone || undefined,
    dob: data.dob ? new Date(data.dob).getTime() : undefined,
    occupation: data.occupation || undefined,
    employer: data.employer || undefined,
  };
}

export const useCustomers = (): UseCustomersResult => {
  const { orgCustomers, loading, error, refresh, createOrgCustomer } =
    useOrgCustomers();

  // Convert OrgCustomers to legacy Customer format
  const customers = useMemo(() => {
    // Ensure we always return an array, even if orgCustomers is undefined/null
    const safeOrgCustomers = orgCustomers || [];
    return safeOrgCustomers.map(adaptOrgCustomerToCustomer);
  }, [orgCustomers]);

  const createCustomer = useCallback(
    async (data: Partial<Customer>): Promise<Customer | null> => {
      try {
        const createData = adaptCustomerToCreateOrgCustomer(data);
        const result = await createOrgCustomer(createData);
        return result ? adaptOrgCustomerToCustomer(result) : null;
      } catch (error) {
        console.error("Failed to create customer:", error);
        return null;
      }
    },
    [createOrgCustomer]
  );

  const getCustomer = useCallback(
    async (id: string): Promise<Customer | null> => {
      const orgCustomer = orgCustomers?.find((c) => c.id === id);
      return orgCustomer ? adaptOrgCustomerToCustomer(orgCustomer) : null;
    },
    [orgCustomers]
  );

  return {
    customers, // This is now guaranteed to be an array
    loading,
    error,
    refresh,
    createCustomer,
    getCustomer,
  };
};
