import { RepositoryAccessLogModel } from "@/server/models/RepositoryAccessLogModel";

export interface DeleteRepositoryAccessLogParams {
  id: string;
}

export interface DeleteRepositoryAccessLogResult {
  success: boolean;
  error: string | null;
}

export class DeleteRepositoryAccessLogService {
  private success: boolean = false;
  private error: string | null = null;
  private id: string;

  constructor(params: DeleteRepositoryAccessLogParams) {
    this.id = params.id;
  }

  async call(): Promise<DeleteRepositoryAccessLogResult> {
    try {
      const log = await RepositoryAccessLogModel.find(this.id);
      
      if (!log) {
        this.error = "Repository access log not found";
        return { success: false, error: this.error };
      }

      this.success = await log.destroy();
      
      if (!this.success) {
        this.error = "Failed to delete repository access log";
        return { success: false, error: this.error };
      }

      return { success: true, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to delete repository access log";
      return { success: false, error: this.error };
    }
  }
}

// Export for convenience
export default DeleteRepositoryAccessLogService;
