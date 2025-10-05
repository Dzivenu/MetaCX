// Types
export interface FloatStack {
  id: string;
  openCount?: number | null;
  closeCount?: number | null;
  cxSessionId?: string | null;
  repositoryId: number;
  denominationId?: number | null;
  spentDuringCxSession?: boolean | null;
  lastCxSessionCount?: number | null;
  previousCxSessionFloatStackId?: number | null;
  denominatedValue?: number | null;
  ticker?: string | null;
  openSpot?: number | null;
  closeSpot?: number | null;
  transferredDuringCxSession?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FloatStackListResponse {
  data: FloatStack[];
}

export interface FloatStackResponse {
  data: FloatStack;
}

export interface ApiError {
  error: string;
}

import { apiGet, apiPost, apiPut, apiDelete } from '@/client/utils/api-client';

// API functions
const BASE_URL = "/api/float-stacks";

export const floatStacks = {
  // Get all float stacks for a repository
  async list(repositoryId: number): Promise<FloatStackListResponse> {
    const params = new URLSearchParams({ repositoryId: repositoryId.toString() });
    const response = await apiGet(`${BASE_URL}?${params}`);
    return response.json();
  },

  // Get single float stack by ID
  async getById(id: string): Promise<FloatStackResponse> {
    const response = await apiGet(`${BASE_URL}/${id}`);
    return response.json();
  },

  // Create new float stack
  async create(data: Partial<FloatStack>): Promise<FloatStackResponse> {
    const response = await apiPost(BASE_URL, data);
    return response.json();
  },

  // Update existing float stack
  async update(id: string, data: Partial<FloatStack>): Promise<FloatStackResponse> {
    const response = await apiPut(`${BASE_URL}/${id}`, data);
    return response.json();
  },

  // Delete float stack
  async delete(id: string): Promise<{ message: string }> {
    const response = await apiDelete(`${BASE_URL}/${id}`);
    return response.json();
  },
};
