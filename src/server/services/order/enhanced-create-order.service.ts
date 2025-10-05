import { db } from "@/server/db";
import { order, repository, currency } from "@/server/db/schema";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";

export interface EnhancedCreateOrderInput {
  sessionId: string;
  userId: string;
  inboundTicker: string;
  inboundSum: number | string;
  outboundTicker: string;
  outboundSum: number | string;
  fxRate?: number;
  rateWoFees?: number;
  finalRate?: number;
  finalRateWithoutFees?: number;
  margin?: number;
  fee?: number;
  networkFee?: number;
  status:
    | "QUOTE"
    | "ACCEPTED"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED"
    | "SCHEDULED"
    | "BLOCKED";
  btcFeeRate?: string;
  quoteSource?: string;
  inboundRepositoryId?: string | null;
  outboundRepositoryId?: string | null;
  batchedStatus?: 0 | 1 | 2;
  // Enhanced fields
  organizationId?: string;
  customerId?: string;
  inboundType?: string;
  outboundType?: string;
}

export interface QuoteCalculationResult {
  fxRate: number;
  finalRate: number;
  finalRateWithoutFees: number;
  margin: number;
  fee: number;
  networkFee: number;
  outboundSum: number;
}

export class EnhancedCreateOrderService {
  private payload: EnhancedCreateOrderInput;

  constructor(payload: EnhancedCreateOrderInput) {
    this.payload = payload;
  }

  async call(): Promise<{
    data?: { id: string; quote?: QuoteCalculationResult };
    error?: string;
  }> {
    try {
      // 1. Validate session and user
      const sessionValidation = await this.validateSession();
      if (!sessionValidation.valid) {
        return { error: sessionValidation.error };
      }

      // 2. Determine currency types
      const currencyTypes = await this.determineCurrencyTypes();
      if (!currencyTypes.valid) {
        return { error: currencyTypes.error };
      }

      // 3. Validate repositories if provided
      const repositoryValidation = await this.validateRepositories();
      if (!repositoryValidation.valid) {
        return { error: repositoryValidation.error };
      }

      // 4. Calculate quote if amounts are provided
      let quote: QuoteCalculationResult | undefined;
      if (this.payload.inboundSum && this.payload.outboundSum) {
        const quoteResult = await this.calculateQuote();
        if (!quoteResult.valid) {
          return { error: quoteResult.error };
        }
        quote = quoteResult.quote;
      }

      // 5. Create the order
      const orderId = await this.createOrder(currencyTypes.types!, quote);

      return {
        data: {
          id: orderId,
          quote,
        },
      };
    } catch (error) {
      console.error("EnhancedCreateOrderService error:", error);
      return { error: "Failed to create order" };
    }
  }

  private async validateSession(): Promise<{ valid: boolean; error?: string }> {
    // TODO: Implement session validation
    // Check if session exists and is active
    if (!this.payload.sessionId) {
      return { valid: false, error: "Session ID is required" };
    }
    return { valid: true };
  }

  private async determineCurrencyTypes(): Promise<{
    valid: boolean;
    error?: string;
    types?: { inboundType: string; outboundType: string };
  }> {
    try {
      // Get currency information from database
      const [inboundCurrency, outboundCurrency] = await Promise.all([
        db
          .select()
          .from(currency)
          .where(eq(currency.ticker, this.payload.inboundTicker))
          .limit(1),
        db
          .select()
          .from(currency)
          .where(eq(currency.ticker, this.payload.outboundTicker))
          .limit(1),
      ]);

      if (inboundCurrency.length === 0) {
        return {
          valid: false,
          error: `Unknown inbound currency: ${this.payload.inboundTicker}`,
        };
      }

      if (outboundCurrency.length === 0) {
        return {
          valid: false,
          error: `Unknown outbound currency: ${this.payload.outboundTicker}`,
        };
      }

      const inboundType =
        inboundCurrency[0].typeOf ||
        this.determineCurrencyTypeFromTicker(this.payload.inboundTicker);
      const outboundType =
        outboundCurrency[0].typeOf ||
        this.determineCurrencyTypeFromTicker(this.payload.outboundTicker);

      return {
        valid: true,
        types: { inboundType, outboundType },
      };
    } catch (error) {
      return { valid: false, error: "Failed to determine currency types" };
    }
  }

  private determineCurrencyTypeFromTicker(ticker: string): string {
    // Cryptocurrency detection
    const cryptoTickers = ["BTC", "ETH", "LTC", "BCH", "XRP", "ADA", "DOT"];
    if (cryptoTickers.includes(ticker.toUpperCase())) {
      return "Cryptocurrency";
    }

    // Fiat currency detection
    const fiatTickers = ["CAD", "USD", "EUR", "GBP", "JPY", "AUD"];
    if (fiatTickers.includes(ticker.toUpperCase())) {
      return "Fiat";
    }

    // Metal detection
    const metalTickers = ["XAU", "XAG", "XPT", "XPD"];
    if (metalTickers.includes(ticker.toUpperCase())) {
      return "Metal";
    }

    return "Fiat"; // Default to Fiat
  }

  private async validateRepositories(): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      if (this.payload.inboundRepositoryId) {
        const inboundRepo = await db
          .select()
          .from(repository)
          .where(eq(repository.id, this.payload.inboundRepositoryId))
          .limit(1);

        if (inboundRepo.length === 0) {
          return { valid: false, error: "Invalid inbound repository" };
        }

        // Check if repository supports the currency
        if (
          !inboundRepo[0].currencyTickers?.includes(this.payload.inboundTicker)
        ) {
          return {
            valid: false,
            error: "Inbound repository does not support this currency",
          };
        }
      }

      if (this.payload.outboundRepositoryId) {
        const outboundRepo = await db
          .select()
          .from(repository)
          .where(eq(repository.id, this.payload.outboundRepositoryId))
          .limit(1);

        if (outboundRepo.length === 0) {
          return { valid: false, error: "Invalid outbound repository" };
        }

        // Check if repository supports the currency
        if (
          !outboundRepo[0].currencyTickers?.includes(
            this.payload.outboundTicker
          )
        ) {
          return {
            valid: false,
            error: "Outbound repository does not support this currency",
          };
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: "Failed to validate repositories" };
    }
  }

  private async calculateQuote(): Promise<{
    valid: boolean;
    error?: string;
    quote?: QuoteCalculationResult;
  }> {
    try {
      const inboundSum = Number(this.payload.inboundSum);
      const outboundSum = Number(this.payload.outboundSum);

      if (inboundSum <= 0 || outboundSum <= 0) {
        return { valid: false, error: "Invalid amounts for quote calculation" };
      }

      // Basic quote calculation (can be enhanced with real FX rates)
      const fxRate = outboundSum / inboundSum;
      const serviceFeePercentage = 0.02; // 2% service fee
      const margin = inboundSum * serviceFeePercentage;
      const fee = margin;

      // Network fee calculation (for crypto transactions)
      let networkFee = 0;
      const outboundType = this.determineCurrencyTypeFromTicker(
        this.payload.outboundTicker
      );
      if (outboundType === "Cryptocurrency") {
        networkFee = this.calculateNetworkFee(this.payload.outboundTicker);
      }

      const finalRate = fxRate;
      const finalRateWithoutFees = fxRate * (1 + serviceFeePercentage);

      const quote: QuoteCalculationResult = {
        fxRate,
        finalRate,
        finalRateWithoutFees,
        margin,
        fee,
        networkFee,
        outboundSum,
      };

      return { valid: true, quote };
    } catch (error) {
      return { valid: false, error: "Failed to calculate quote" };
    }
  }

  private calculateNetworkFee(ticker: string): number {
    // Basic network fee calculation
    switch (ticker.toUpperCase()) {
      case "BTC":
        return 0.0001; // ~$5-10 depending on network conditions
      case "ETH":
        return 0.002; // ~$5-20 depending on gas prices
      case "LTC":
        return 0.001;
      default:
        return 0;
    }
  }

  private async createOrder(
    currencyTypes: { inboundType: string; outboundType: string },
    quote?: QuoteCalculationResult
  ): Promise<string> {
    const id = nanoid();
    const now = new Date();

    // Set quote source if not provided
    const quoteSource = this.payload.quoteSource || "trading_tool_ui";

    await db.insert(order).values({
      id,
      sessionId: this.payload.sessionId,
      userId: this.payload.userId,
      inboundTicker: this.payload.inboundTicker,
      inboundSum: String(this.payload.inboundSum ?? 0),
      inboundType: currencyTypes.inboundType,
      outboundTicker: this.payload.outboundTicker,
      outboundSum: String(quote?.outboundSum ?? this.payload.outboundSum ?? 0),
      outboundType: currencyTypes.outboundType,
      fxRate: quote?.fxRate ?? this.payload.fxRate ?? null,
      rateWoFees: this.payload.rateWoFees ?? null,
      finalRate: quote?.finalRate ?? this.payload.finalRate ?? null,
      finalRateWithoutFees:
        quote?.finalRateWithoutFees ??
        this.payload.finalRateWithoutFees ??
        null,
      margin: quote?.margin ?? this.payload.margin ?? null,
      fee: quote?.fee ?? this.payload.fee ?? null,
      networkFee: quote?.networkFee ?? this.payload.networkFee ?? 0,
      status: this.payload.status,
      btcFeeRate: this.payload.btcFeeRate ?? null,
      quoteSource,
      inboundRepositoryId: this.payload.inboundRepositoryId ?? null,
      outboundRepositoryId: this.payload.outboundRepositoryId ?? null,
      batchedStatus: this.payload.batchedStatus ?? 0,
      openDt: now,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  }
}
