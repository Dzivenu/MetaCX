// This file has been migrated to use Convex instead of API client
// The customer types are now imported from the useCustomers hook
// which provides the legacy interface for backward compatibility

// Legacy interfaces maintained for backward compatibility
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

export interface CustomerListResponse {
  data: Customer[];
}
export interface CustomerResponse {
  data: Customer;
}

// DEPRECATED: Use the useCustomers hook instead
// This API client has been replaced with Convex integration
export const customersApi = {
  async list(): Promise<CustomerListResponse> {
    throw new Error(
      "customersApi.list() has been deprecated. Use the useCustomers hook instead."
    );
  },

  async getById(id: string): Promise<CustomerResponse> {
    throw new Error(
      "customersApi.getById() has been deprecated. Use the useCustomers hook instead."
    );
  },

  async create(data: Partial<Customer>): Promise<CustomerResponse> {
    throw new Error(
      "customersApi.create() has been deprecated. Use the useCustomers hook instead."
    );
  },
};
