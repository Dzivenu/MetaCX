// Types
export interface Denomination {
  id: string;
  value: number;
  currencyId: number;
  accepted?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DenominationListResponse {
  data: Denomination[];
}

export interface DenominationResponse {
  data: Denomination;
}

export interface ApiError {
  error: string;
}

import { apiGet, apiPost, apiPut, apiDelete } from '@/client/utils/api-client';

// API functions
const BASE_URL = "/api/denominations";

export const denominations = {
  // Get all denominations for a currency
  async list(currencyId: number): Promise<DenominationListResponse> {
    const params = new URLSearchParams({ currencyId: currencyId.toString() });
    const response = await apiGet(`${BASE_URL}?${params}`);
    return response.json();
  },

  // Get single denomination by ID
  async getById(id: string): Promise<DenominationResponse> {
    const response = await apiGet(`${BASE_URL}/${id}`);
    return response.json();
  },

  // Create new denomination
  async create(data: Partial<Denomination>): Promise<DenominationResponse> {
    const response = await apiPost(BASE_URL, data);
    return response.json();
  },

  // Update existing denomination
  async update(id: string, data: Partial<Denomination>): Promise<DenominationResponse> {
    const response = await apiPut(`${BASE_URL}/${id}`, data);
    return response.json();
  },

  // Delete denomination
  async delete(id: string): Promise<{ message: string }> {
    const response = await apiDelete(`${BASE_URL}/${id}`);
    return response.json();
  },
};
