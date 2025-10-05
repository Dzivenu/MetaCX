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

import { apiGet, apiPost, apiPut, apiDelete } from '@/client/utils/api-client';

// API functions
const BASE_URL = "/api/repository-access-logs";

export const repositoryAccessLogs = {
  // Get all repository access logs for a repository
  list(repositoryId: number): Promise<RepositoryAccessLogListResponse> {
    const params = new URLSearchParams({ repositoryId: repositoryId.toString() });
    return apiGet(`${BASE_URL}?${params}`);
  },

  // Get single repository access log by ID
  getById(id: string): Promise<RepositoryAccessLogResponse> {
    return apiGet(`${BASE_URL}/${id}`);
  },

  // Create new repository access log
  create(data: Partial<RepositoryAccessLog>): Promise<RepositoryAccessLogResponse> {
    return apiPost(BASE_URL, data);
  },

  // Update existing repository access log
  update(id: string, data: Partial<RepositoryAccessLog>): Promise<RepositoryAccessLogResponse> {
    return apiPut(`${BASE_URL}/${id}`, data);
  },

  // Delete repository access log
  delete(id: string): Promise<{ message: string }> {
    return apiDelete(`${BASE_URL}/${id}`);
  },
};
