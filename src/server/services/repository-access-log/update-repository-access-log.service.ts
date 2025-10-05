import { RepositoryAccessLogModel, RepositoryAccessLogData } from "@/server/models/RepositoryAccessLogModel";

export interface UpdateRepositoryAccessLogParams {
  id: string;
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

export interface UpdateRepositoryAccessLogResult {
  repositoryAccessLog: RepositoryAccessLogData | null;
  error: string | null;
}

export class UpdateRepositoryAccessLogService {
  private repositoryAccessLog: RepositoryAccessLogData | null = null;
  private error: string | null = null;
  private id: string;
  private params: UpdateRepositoryAccessLogParams;

  constructor(params: UpdateRepositoryAccessLogParams) {
    this.id = params.id;
    this.params = params;
  }

  async call(): Promise<UpdateRepositoryAccessLogResult> {
    try {
      const log = await RepositoryAccessLogModel.find(this.id);
      
      if (!log) {
        this.error = "Repository access log not found";
        return { repositoryAccessLog: null, error: this.error };
      }

      // Update only the provided fields
      if (this.params.repositoryId !== undefined) log.set("repositoryId", this.params.repositoryId);
      if (this.params.sessionId !== undefined) log.set("sessionId", this.params.sessionId);
      if (this.params.possessionAt !== undefined) log.set("possessionAt", this.params.possessionAt);
      if (this.params.releaseAt !== undefined) log.set("releaseAt", this.params.releaseAt);
      if (this.params.openStartAt !== undefined) log.set("openStartAt", this.params.openStartAt);
      if (this.params.openConfirmAt !== undefined) log.set("openConfirmAt", this.params.openConfirmAt);
      if (this.params.closeStartAt !== undefined) log.set("closeStartAt", this.params.closeStartAt);
      if (this.params.closeConfirmAt !== undefined) log.set("closeConfirmAt", this.params.closeConfirmAt);
      if (this.params.openStartUserId !== undefined) log.set("openStartUserId", this.params.openStartUserId);
      if (this.params.openConfirmUserId !== undefined) log.set("openConfirmUserId", this.params.openConfirmUserId);
      if (this.params.closeStartUserId !== undefined) log.set("closeStartUserId", this.params.closeStartUserId);
      if (this.params.closeConfirmUserId !== undefined) log.set("closeConfirmUserId", this.params.closeConfirmUserId);

      const saved = await log.save();
      
      if (!saved) {
        this.error = "Failed to update repository access log";
        return { repositoryAccessLog: null, error: this.error };
      }

      this.repositoryAccessLog = log.attributes;
      return { repositoryAccessLog: this.repositoryAccessLog, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to update repository access log";
      return { repositoryAccessLog: null, error: this.error };
    }
  }
}

// Export for convenience
export default UpdateRepositoryAccessLogService;
