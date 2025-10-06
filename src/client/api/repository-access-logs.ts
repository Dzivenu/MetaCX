// Types
export interface RepositoryAccessLog {
  id: string;
  repositoryId?: number | null;
  sessionId?: string | null;
  possessionAt?: Date | null;
  releaseAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  openStartAt?: Date | null;
  openConfirmAt?: Date | null;
  closeStartAt?: Date | null;
  closeConfirmAt?: Date | null;
  openStartUserId?: number | null;
  openConfirmUserId?: number | null;
  closeStartUserId?: number | null;
  closeConfirmUserId?: number | null;
}

export interface RepositoryAccessLogListResponse {
  data: RepositoryAccessLog[];
}

export interface RepositoryAccessLogResponse {
  data: RepositoryAccessLog;
}

export interface ApiError {
  error: string;
}

import { apiGet, apiPost, apiPut, apiDelete } from "@/client/utils/api-client";

// API functions
const BASE_URL = "/api/repository-access-logs";

export const repositoryAccessLogs = {
  // Get all repository access logs for a repository
  async list(repositoryId: number): Promise<RepositoryAccessLogListResponse> {
    const params = new URLSearchParams({
      repositoryId: repositoryId.toString(),
    });
    const response = await apiGet(`${BASE_URL}?${params}`);
    return response.json();
  },

  // Get single repository access log by ID
  async getById(id: string): Promise<RepositoryAccessLogResponse> {
    const response = await apiGet(`${BASE_URL}/${id}`);
    return response.json();
  },

  // Create new repository access log
  async create(
    data: Partial<RepositoryAccessLog>
  ): Promise<RepositoryAccessLogResponse> {
    const response = await apiPost(BASE_URL, data);
    return response.json();
  },

  // Update existing repository access log
  async update(
    id: string,
    data: Partial<RepositoryAccessLog>
  ): Promise<RepositoryAccessLogResponse> {
    const response = await apiPut(`${BASE_URL}/${id}`, data);
    return response.json();
  },

  // Delete repository access log
  async delete(id: string): Promise<{ message: string }> {
    const response = await apiDelete(`${BASE_URL}/${id}`);
    return response.json();
  },
};
