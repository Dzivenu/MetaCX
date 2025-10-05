import { DenominationModel } from "@/server/models/DenominationModel";

export interface DeleteDenominationParams {
  id: string;
}

export interface DeleteDenominationResult {
  success: boolean;
  error: string | null;
}

export class DeleteDenominationService {
  private success: boolean = false;
  private error: string | null = null;
  private id: string;

  constructor(params: DeleteDenominationParams) {
    this.id = params.id;
  }

  async call(): Promise<DeleteDenominationResult> {
    try {
      const denom = await DenominationModel.find(this.id);
      
      if (!denom) {
        this.error = "Denomination not found";
        return { success: false, error: this.error };
      }

      this.success = await denom.destroy();
      
      if (!this.success) {
        this.error = "Failed to delete denomination";
        return { success: false, error: this.error };
      }

      return { success: true, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to delete denomination";
      return { success: false, error: this.error };
    }
  }
}

// Export for convenience
export default DeleteDenominationService;
