import { DenominationModel, DenominationData } from "@/server/models/DenominationModel";

export interface CreateDenominationParams {
  value?: number;
  currencyId?: string;
  accepted?: boolean;
}

export interface CreateDenominationResult {
  denomination: DenominationData | null;
  error: string | null;
}

export class CreateDenominationService {
  private denomination: DenominationData | null = null;
  private error: string | null = null;
  private params: CreateDenominationParams;

  constructor(params: CreateDenominationParams) {
    this.params = params;
  }

  async call(): Promise<CreateDenominationResult> {
    try {
      const denom = new DenominationModel({
        value: this.params.value,
        currencyId: this.params.currencyId,
        accepted: this.params.accepted,
      });

      const saved = await denom.save();
      
      if (!saved) {
        this.error = "Failed to create denomination";
        return { denomination: null, error: this.error };
      }

      this.denomination = denom.attributes;
      return { denomination: this.denomination, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to create denomination";
      return { denomination: null, error: this.error };
    }
  }
}

// Export for convenience
export default CreateDenominationService;
