import { FloatStackModel, FloatStackData } from "@/server/models/FloatStackModel";

export interface GetAllFloatStacksParams {
  repositoryId: number;
}

export interface GetAllFloatStacksResult {
  floatStacks: FloatStackData[];
  error: string | null;
}

export class GetAllFloatStacksService {
  private floatStacks: FloatStackData[] = [];
  private error: string | null = null;
  private repositoryId: number;

  constructor(params: GetAllFloatStacksParams) {
    this.repositoryId = params.repositoryId;
  }

  async call(): Promise<GetAllFloatStacksResult> {
    try {
      const stacks = await FloatStackModel.where({ repositoryId: this.repositoryId });
      this.floatStacks = stacks.map(stack => stack.attributes);
      return { floatStacks: this.floatStacks, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to get float stacks";
      return { floatStacks: [], error: this.error };
    }
  }
}

// Export for convenience
export default GetAllFloatStacksService;
