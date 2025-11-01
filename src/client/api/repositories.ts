// Types - updated to match Convex schema
export interface Repository {
  _id: string; // Convex uses _id instead of id
  name: string;
  typeOf?: string | null;
  clerkOrganizationId: string; // Required field from schema
  clerk_org_id: string; // Required field from schema
  org_id: string; // Convex ID reference
  createdAt: number; // Convex uses numbers for timestamps
  updatedAt: number;
  currencyType?: string | null;
  form?: string | null;
  uid?: number | null;
  key: string;
  currencyTickers?: string[];
  displayOrderId?: number | null;
  floatThresholdBottom?: string | null; // Stored as string in Convex
  floatThresholdTop?: string | null; // Stored as string in Convex
  floatCountRequired?: boolean | null;
  active?: boolean | null;
  authorizedUserIds?: string | null; // JSON string
  createdBy: string; // Convex ID reference
}

export interface RepositoryListResponse {
  data: Repository[];
}

export interface RepositoryResponse {
  data: Repository;
}

export interface ApiError {
  error: string;
}

import { apiGet, apiPost, apiPut, apiDelete } from '@/client/utils/api-client';

// API functions
const BASE_URL = "/api/repositories";

export const repositories = {
  // Get all repositories
  async list(): Promise<RepositoryListResponse> {
    const response = await apiGet(BASE_URL);
    return response.json();
  },

  // Get single repository by ID
  async getById(id: string): Promise<RepositoryResponse> {
    const response = await apiGet(`${BASE_URL}/${id}`);
    return response.json();
  },

  // Create new repository
  async create(data: Partial<Repository>): Promise<RepositoryResponse> {
    const response = await apiPost(BASE_URL, data);
    return response.json();
  },

  // Update existing repository
  async update(id: string, data: Partial<Repository>): Promise<RepositoryResponse> {
    const response = await apiPut(`${BASE_URL}/${id}`, data);
    return response.json();
  },

  // Delete repository
  async delete(id: string): Promise<{ message: string }> {
    const response = await apiDelete(`${BASE_URL}/${id}`);
    return response.json();
  },
};
