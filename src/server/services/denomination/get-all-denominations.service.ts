import { DenominationModel, DenominationData } from "@/server/models/DenominationModel";

export interface GetAllDenominationsParams {
  currencyId: string;
}

export interface GetAllDenominationsResult {
  denominations: DenominationData[];
  error: string | null;
}

export class GetAllDenominationsService {
  private denominations: DenominationData[] = [];
  private error: string | null = null;
  private currencyId: string;

  constructor(params: GetAllDenominationsParams) {
    this.currencyId = params.currencyId;
  }

  async call(): Promise<GetAllDenominationsResult> {
    try {
      const denoms = await DenominationModel.findByCurrency(this.currencyId);
      this.denominations = denoms.map(denom => denom.attributes);
      return { denominations: this.denominations, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to get denominations";
      return { denominations: [], error: this.error };
    }
  }
}

// Export for convenience
export default GetAllDenominationsService;
