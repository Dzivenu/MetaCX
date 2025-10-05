import { CurrencyModel, CurrencyData } from "@/server/models/CurrencyModel";

export interface UpdateCurrencyRateParams {
  currencyId: string;
  newRate: number;
}

export interface UpdateCurrencyRateResult {
  currency: CurrencyData | null;
  error: string | null;
}

export class UpdateCurrencyRateService {
  private currency: CurrencyData | null = null;
  private error: string | null = null;
  private currencyId: string;
  private newRate: number;

  constructor(params: UpdateCurrencyRateParams) {
    this.currencyId = params.currencyId;
    this.newRate = params.newRate;
  }

  async call(): Promise<UpdateCurrencyRateResult> {
    try {
      // Update the currency rate
      this.currency = await CurrencyModel.updateRate(this.currencyId, this.newRate);

      if (!this.currency) {
        this.error = "Failed to update currency rate";
      }
    } catch (error) {
      console.error("Error updating currency rate:", error);
      this.error = "An error occurred while updating the currency rate";
    }

    return {
      currency: this.currency,
      error: this.error,
    };
  }
}

// Export for convenience
export default UpdateCurrencyRateService;
