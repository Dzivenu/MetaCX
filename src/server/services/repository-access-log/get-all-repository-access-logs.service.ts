import { RepositoryAccessLogModel, RepositoryAccessLogData } from "@/server/models/RepositoryAccessLogModel";

export interface GetAllRepositoryAccessLogsParams {
  repositoryId: number;
}

export interface GetAllRepositoryAccessLogsResult {
  repositoryAccessLogs: RepositoryAccessLogData[];
  error: string | null;
}

export class GetAllRepositoryAccessLogsService {
  private repositoryAccessLogs: RepositoryAccessLogData[] = [];
  private error: string | null = null;
  private repositoryId: number;

  constructor(params: GetAllRepositoryAccessLogsParams) {
    this.repositoryId = params.repositoryId;
  }

  async call(): Promise<GetAllRepositoryAccessLogsResult> {
    try {
      const logs = await RepositoryAccessLogModel.where({ repositoryId: this.repositoryId });
      this.repositoryAccessLogs = logs.map(log => log.attributes);
      return { repositoryAccessLogs: this.repositoryAccessLogs, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to get repository access logs";
      return { repositoryAccessLogs: [], error: this.error };
    }
  }
}

// Export for convenience
export default GetAllRepositoryAccessLogsService;
