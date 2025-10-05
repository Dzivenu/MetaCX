// Types
export interface CxSession {
  id: string;
  openStartDt?: Date | null;
  openConfirmDt?: Date | null;
  closeStartDt?: Date | null;
  closeConfirmDt?: Date | null;
  userId?: string | null;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  status?: string | null;
  verifiedByUserId?: number | null;
  verifiedDt?: Date | null;
  openStartUserId?: number | null;
  openConfirmUserId?: number | null;
  closeStartUserId?: number | null;
  closeConfirmUserId?: number | null;
}

export interface CreateCxSessionData {
  openStartDt?: string;
  openConfirmDt?: string;
  closeStartDt?: string;
  closeConfirmDt?: string;
  userId?: string;
  organizationId?: string;
  status?: string;
  verifiedByUserId?: number;
  verifiedDt?: string;
  openStartUserId?: number;
  openConfirmUserId?: number;
  closeStartUserId?: number;
  closeConfirmUserId?: number;
}

export type UpdateCxSessionData = Partial<CreateCxSessionData>;

export interface CxSessionFilters {
  page?: number;
  limit?: number;
  organizationId?: string;
  userId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "createdAt" | "updatedAt" | "openStartDt" | "closeStartDt";
  sortOrder?: "asc" | "desc";
}

export interface CxSessionListResponse {
  data: CxSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CxSessionResponse {
  data: CxSession;
}

export interface ApiError {
  error: string;
}

import { apiGet, apiPost, apiPut, apiDelete } from '@/client/utils/api-client';

// API functions
const BASE_URL = "/api/cx-sessions";

export const cxSessionsApi = {
  // Get all sessions with filtering and pagination
  async list(filters: CxSessionFilters = {}): Promise<CxSessionListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiGet(`${BASE_URL}?${params.toString()}`);
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || "Failed to fetch sessions");
    }

    return response.json();
  },

  // Get single session by ID
  async getById(id: string): Promise<CxSessionResponse> {
    const response = await apiGet(`${BASE_URL}/${id}`);
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || "Failed to fetch session");
    }

    return response.json();
  },

  // Create new session
  async create(data: CreateCxSessionData): Promise<CxSessionResponse> {
    const response = await apiPost(BASE_URL, data);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || "Failed to create session");
    }

    return response.json();
  },

  // Update existing session
  async update(id: string, data: UpdateCxSessionData): Promise<CxSessionResponse> {
    const response = await apiPut(`${BASE_URL}/${id}`, data);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || "Failed to update session");
    }

    return response.json();
  },

  // Delete session
  async delete(id: string): Promise<{ message: string }> {
    const response = await apiDelete(`${BASE_URL}/${id}`);
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || "Failed to delete session");
    }

    return response.json();
  },

  // Join existing session
  async join(id: string): Promise<CxSessionResponse> {
    const response = await apiPost(`${BASE_URL}/${id}/join`);
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || "Failed to join session");
    }

    return response.json();
  },

  // Leave existing session
  async leave(id: string): Promise<CxSessionResponse> {
    const response = await apiPost(`${BASE_URL}/${id}/leave`);
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || "Failed to leave session");
    }

    return response.json();
  },
};