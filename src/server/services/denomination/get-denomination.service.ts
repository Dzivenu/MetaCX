import { DenominationModel, DenominationData } from "@/server/models/DenominationModel";

export interface GetDenominationParams {
  id: string;
}

export interface GetDenominationResult {
  denomination: DenominationData | null;
  error: string | null;
}

export class GetDenominationService {
  private denomination: DenominationData | null = null;
  private error: string | null = null;
  private id: string;

  constructor(params: GetDenominationParams) {
    this.id = params.id;
  }

  async call(): Promise<GetDenominationResult> {
    try {
      const denom = await DenominationModel.find(this.id);
      
      if (!denom) {
        this.error = "Denomination not found";
        return { denomination: null, error: this.error };
      }

      this.denomination = denom.attributes;
      return { denomination: this.denomination, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to get denomination";
      return { denomination: null, error: this.error };
    }
  }
}

// Export for convenience
export default GetDenominationService;
