import { FloatStackModel } from "@/server/models/FloatStackModel";

export interface DeleteFloatStackParams {
  id: string;
}

export interface DeleteFloatStackResult {
  success: boolean;
  error: string | null;
}

export class DeleteFloatStackService {
  private success: boolean = false;
  private error: string | null = null;
  private id: string;

  constructor(params: DeleteFloatStackParams) {
    this.id = params.id;
  }

  async call(): Promise<DeleteFloatStackResult> {
    try {
      const stack = await FloatStackModel.find(this.id);
      
      if (!stack) {
        this.error = "Float stack not found";
        return { success: false, error: this.error };
      }

      this.success = await stack.destroy();
      
      if (!this.success) {
        this.error = "Failed to delete float stack";
        return { success: false, error: this.error };
      }

      return { success: true, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to delete float stack";
      return { success: false, error: this.error };
    }
  }
}

// Export for convenience
export default DeleteFloatStackService;
