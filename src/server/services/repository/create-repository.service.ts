import { RepositoryModel, RepositoryData } from "@/server/models/RepositoryModel";

export interface CreateRepositoryParams {
  name: string;
  organizationId: string;
  typeOf?: string;
  currencyType?: string;
  form?: string;
  key: string;
  floatThresholdBottom?: number;
  floatThresholdTop?: number;
  floatCountRequired?: boolean;
  active?: boolean;
}

export interface CreateRepositoryResult {
  repository: RepositoryData | null;
  error: string | null;
}

export class CreateRepositoryService {
  private repository: RepositoryData | null = null;
  private error: string | null = null;
  private params: CreateRepositoryParams;

  constructor(params: CreateRepositoryParams) {
    this.params = params;
  }

  async call(): Promise<CreateRepositoryResult> {
    try {
      const repo = new RepositoryModel({
        name: this.params.name,
        organizationId: this.params.organizationId,
        typeOf: this.params.typeOf,
        currencyType: this.params.currencyType,
        form: this.params.form,
        key: this.params.key,
        floatThresholdBottom: this.params.floatThresholdBottom,
        floatThresholdTop: this.params.floatThresholdTop,
        floatCountRequired: this.params.floatCountRequired,
        active: this.params.active,
        authorizedUserIds: JSON.stringify([]), // Initialize with empty array
      });

      const saved = await repo.save();
      
      if (!saved) {
        this.error = "Failed to create repository";
        return { repository: null, error: this.error };
      }

      this.repository = {
        id: repo.attributes.id || '',
        name: repo.attributes.name || '',
        key: repo.attributes.key || '',
        typeOf: repo.attributes.typeOf || null,
        currencyType: repo.attributes.currencyType || null,
        form: repo.attributes.form || null,
        active: repo.attributes.active || false,
        createdAt: repo.attributes.createdAt || new Date(),
        updatedAt: repo.attributes.updatedAt || new Date(),
        organizationId: repo.attributes.organizationId || null,
        uid: repo.attributes.uid || null,
        currencyTickers: repo.attributes.currencyTickers || [],
        displayOrderId: repo.attributes.displayOrderId || null,
        floatThresholdBottom: repo.attributes.floatThresholdBottom || null,
        floatThresholdTop: repo.attributes.floatThresholdTop || null,
        floatCountRequired: repo.attributes.floatCountRequired || null,
        authorizedUserIds: repo.attributes.authorizedUserIds || null
      };
      return { repository: this.repository, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to create repository";
      return { repository: null, error: this.error };
    }
  }
}

// Export for convenience
export default CreateRepositoryService;
