import { DenominationModel, DenominationData } from "@/server/models/DenominationModel";

export interface UpdateDenominationParams {
  id: string;
  value?: number;
  currencyId?: string;
  accepted?: boolean;
}

export interface UpdateDenominationResult {
  denomination: DenominationData | null;
  error: string | null;
}

export class UpdateDenominationService {
  private denomination: DenominationData | null = null;
  private error: string | null = null;
  private id: string;
  private params: UpdateDenominationParams;

  constructor(params: UpdateDenominationParams) {
    this.id = params.id;
    this.params = params;
  }

  async call(): Promise<UpdateDenominationResult> {
    try {
      const denom = await DenominationModel.find(this.id);
      
      if (!denom) {
        this.error = "Denomination not found";
        return { denomination: null, error: this.error };
      }

      // Update only the provided fields
      if (this.params.value !== undefined) denom.set("value", this.params.value);
      if (this.params.currencyId !== undefined) denom.set("currencyId", this.params.currencyId);
      if (this.params.accepted !== undefined) denom.set("accepted", this.params.accepted);

      const saved = await denom.save();
      
      if (!saved) {
        this.error = "Failed to update denomination";
        return { denomination: null, error: this.error };
      }

      this.denomination = denom.attributes;
      return { denomination: this.denomination, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to update denomination";
      return { denomination: null, error: this.error };
    }
  }
}

// Export for convenience
export default UpdateDenominationService;
