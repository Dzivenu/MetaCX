import { RepositoryModel, RepositoryData } from "@/server/models/RepositoryModel";

export interface UpdateRepositoryParams {
  id: string;
  name?: string;
  typeOf?: string;
  currencyType?: string;
  form?: string;
  key?: string;
  floatThresholdBottom?: number;
  floatThresholdTop?: number;
  floatCountRequired?: boolean;
  active?: boolean;
  currencyTickers?: string[];
}

export interface UpdateRepositoryResult {
  repository: RepositoryData | null;
  error: string | null;
}

export class UpdateRepositoryService {
  private repository: RepositoryData | null = null;
  private error: string | null = null;
  private id: string;
  private params: UpdateRepositoryParams;

  constructor(params: UpdateRepositoryParams) {
    this.id = params.id;
    this.params = params;
  }

  async call(): Promise<UpdateRepositoryResult> {
    try {
      const repo = await RepositoryModel.find(this.id);
      
      if (!repo) {
        this.error = "Repository not found";
        return { repository: null, error: this.error };
      }

      // Update only the provided fields
      if (this.params.name !== undefined) repo.set("name", this.params.name);
      if (this.params.typeOf !== undefined) repo.set("typeOf", this.params.typeOf);
      if (this.params.currencyType !== undefined) repo.set("currencyType", this.params.currencyType);
      if (this.params.form !== undefined) repo.set("form", this.params.form);
      if (this.params.key !== undefined) repo.set("key", this.params.key);
      if (this.params.floatThresholdBottom !== undefined) repo.set("floatThresholdBottom", this.params.floatThresholdBottom);
      if (this.params.floatThresholdTop !== undefined) repo.set("floatThresholdTop", this.params.floatThresholdTop);
      if (this.params.floatCountRequired !== undefined) repo.set("floatCountRequired", this.params.floatCountRequired);
      if (this.params.active !== undefined) repo.set("active", this.params.active);
      if (this.params.currencyTickers !== undefined) repo.set("currencyTickers", this.params.currencyTickers);

      const saved = await repo.save();
      
      if (!saved) {
        this.error = "Failed to update repository";
        return { repository: null, error: this.error };
      }

      this.repository = repo.attributes as RepositoryData;
      return { repository: this.repository, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to update repository";
      return { repository: null, error: this.error };
    }
  }
}

// Export for convenience
export default UpdateRepositoryService;
