import { RepositoryModel, RepositoryData } from "@/server/models/RepositoryModel";

export interface GetRepositoryParams {
  id: string;
}

export interface GetRepositoryResult {
  repository: RepositoryData | null;
  error: string | null;
}

export class GetRepositoryService {
  private repository: RepositoryData | null = null;
  private error: string | null = null;
  private id: string;

  constructor(params: GetRepositoryParams) {
    this.id = params.id;
  }

  async call(): Promise<GetRepositoryResult> {
    try {
      const repo = await RepositoryModel.find(this.id);
      
      if (!repo) {
        this.error = "Repository not found";
        return { repository: null, error: this.error };
      }

      this.repository = repo.attributes;
      return { repository: this.repository, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to get repository";
      return { repository: null, error: this.error };
    }
  }
}

// Export for convenience
export default GetRepositoryService;
