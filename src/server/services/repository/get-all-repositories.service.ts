import { RepositoryModel, RepositoryData } from "@/server/models/RepositoryModel";

export interface GetAllRepositoriesParams {
  organizationId: string;
}

export interface GetAllRepositoriesResult {
  repositories: RepositoryData[];
  error: string | null;
}

export class GetAllRepositoriesService {
  private repositories: RepositoryData[] = [];
  private error: string | null = null;
  private organizationId: string;

  constructor(params: GetAllRepositoriesParams) {
    this.organizationId = params.organizationId;
  }

  async call(): Promise<GetAllRepositoriesResult> {
    try {
      const repos = await RepositoryModel.findByOrganization(this.organizationId);
      this.repositories = repos.map(repo => ({
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
      }));
      return { repositories: this.repositories, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to get repositories";
      return { repositories: [], error: this.error };
    }
  }
}

// Export for convenience
export default GetAllRepositoriesService;
