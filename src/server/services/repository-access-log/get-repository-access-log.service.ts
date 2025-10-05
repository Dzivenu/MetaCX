import { RepositoryAccessLogModel, RepositoryAccessLogData } from "@/server/models/RepositoryAccessLogModel";

export interface GetRepositoryAccessLogParams {
  id: string;
}

export interface GetRepositoryAccessLogResult {
  repositoryAccessLog: RepositoryAccessLogData | null;
  error: string | null;
}

export class GetRepositoryAccessLogService {
  private repositoryAccessLog: RepositoryAccessLogData | null = null;
  private error: string | null = null;
  private id: string;

  constructor(params: GetRepositoryAccessLogParams) {
    this.id = params.id;
  }

  async call(): Promise<GetRepositoryAccessLogResult> {
    try {
      const log = await RepositoryAccessLogModel.find(this.id);
      
      if (!log) {
        this.error = "Repository access log not found";
        return { repositoryAccessLog: null, error: this.error };
      }

      this.repositoryAccessLog = log.attributes;
      return { repositoryAccessLog: this.repositoryAccessLog, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to get repository access log";
      return { repositoryAccessLog: null, error: this.error };
    }
  }
}

// Export for convenience
export default GetRepositoryAccessLogService;
