import { FloatStackModel, FloatStackData } from "@/server/models/FloatStackModel";

export interface GetFloatStackParams {
  id: string;
}

export interface GetFloatStackResult {
  floatStack: FloatStackData | null;
  error: string | null;
}

export class GetFloatStackService {
  private floatStack: FloatStackData | null = null;
  private error: string | null = null;
  private id: string;

  constructor(params: GetFloatStackParams) {
    this.id = params.id;
  }

  async call(): Promise<GetFloatStackResult> {
    try {
      const stack = await FloatStackModel.find(this.id);
      
      if (!stack) {
        this.error = "Float stack not found";
        return { floatStack: null, error: this.error };
      }

      this.floatStack = stack.attributes;
      return { floatStack: this.floatStack, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to get float stack";
      return { floatStack: null, error: this.error };
    }
  }
}

// Export for convenience
export default GetFloatStackService;
