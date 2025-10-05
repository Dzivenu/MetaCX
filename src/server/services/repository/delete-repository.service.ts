import { RepositoryModel } from "@/server/models/RepositoryModel";

export interface DeleteRepositoryParams {
  id: string;
}

export interface DeleteRepositoryResult {
  success: boolean;
  error: string | null;
}

export class DeleteRepositoryService {
  private success: boolean = false;
  private error: string | null = null;
  private id: string;

  constructor(params: DeleteRepositoryParams) {
    this.id = params.id;
  }

  async call(): Promise<DeleteRepositoryResult> {
    try {
      const repo = await RepositoryModel.find(this.id);
      
      if (!repo) {
        this.error = "Repository not found";
        return { success: false, error: this.error };
      }

      this.success = await repo.destroy();
      
      if (!this.success) {
        this.error = "Failed to delete repository";
        return { success: false, error: this.error };
      }

      return { success: true, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to delete repository";
      return { success: false, error: this.error };
    }
  }
}

// Export for convenience
export default DeleteRepositoryService;
