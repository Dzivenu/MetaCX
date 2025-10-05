import { RepositoryAccessLogModel, RepositoryAccessLogData } from "@/server/models/RepositoryAccessLogModel";

export interface CreateRepositoryAccessLogParams {
  repositoryId?: number;
  sessionId?: string;
  possessionAt?: Date;
  releaseAt?: Date;
  openStartAt?: Date;
  openConfirmAt?: Date;
  closeStartAt?: Date;
  closeConfirmAt?: Date;
  openStartUserId?: number;
  openConfirmUserId?: number;
  closeStartUserId?: number;
  closeConfirmUserId?: number;
}

export interface CreateRepositoryAccessLogResult {
  repositoryAccessLog: RepositoryAccessLogData | null;
  error: string | null;
}

export class CreateRepositoryAccessLogService {
  private repositoryAccessLog: RepositoryAccessLogData | null = null;
  private error: string | null = null;
  private params: CreateRepositoryAccessLogParams;

  constructor(params: CreateRepositoryAccessLogParams) {
    this.params = params;
  }

  async call(): Promise<CreateRepositoryAccessLogResult> {
    try {
      const log = new RepositoryAccessLogModel({
        repositoryId: this.params.repositoryId,
        sessionId: this.params.sessionId,
        possessionAt: this.params.possessionAt,
        releaseAt: this.params.releaseAt,
        openStartAt: this.params.openStartAt,
        openConfirmAt: this.params.openConfirmAt,
        closeStartAt: this.params.closeStartAt,
        closeConfirmAt: this.params.closeConfirmAt,
        openStartUserId: this.params.openStartUserId,
        openConfirmUserId: this.params.openConfirmUserId,
        closeStartUserId: this.params.closeStartUserId,
        closeConfirmUserId: this.params.closeConfirmUserId,
      });

      const saved = await log.save();
      
      if (!saved) {
        this.error = "Failed to create repository access log";
        return { repositoryAccessLog: null, error: this.error };
      }

      this.repositoryAccessLog = log.attributes;
      return { repositoryAccessLog: this.repositoryAccessLog, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to create repository access log";
      return { repositoryAccessLog: null, error: this.error };
    }
  }
}

// Export for convenience
export default CreateRepositoryAccessLogService;
