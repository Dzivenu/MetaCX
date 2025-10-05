import { db } from "@/server/db";
import { currency } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import {
  OrderQuoteRequestModel,
  OrderQuoteResultModel,
  determineCurrencyTypeFromTicker,
  estimateNetworkFee,
} from "@/server/models/order/order.model";

export class OrderQuoteService {
  private payload: OrderQuoteRequestModel;

  constructor(payload: OrderQuoteRequestModel) {
    this.payload = payload;
  }

  async call(): Promise<{ quote?: OrderQuoteResultModel; error?: string }> {
    try {
      const inboundSum = Number(this.payload.inboundSum);
      if (!isFinite(inboundSum) || inboundSum <= 0) {
        return { error: "Invalid inbound sum" };
      }

      // Fetch currencies
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
          error: `Unknown inbound currency: ${this.payload.inboundTicker}`,
        };
      }
      if (outboundCurrency.length === 0) {
        return {
          error: `Unknown outbound currency: ${this.payload.outboundTicker}`,
        };
      }

      const inboundRate = Number(inboundCurrency[0].rate ?? 1);
      const outboundRate = Number(outboundCurrency[0].rate ?? 1);

      // Derive base FX rate from currency rates if available
      const baseRate = outboundRate === 0 ? 1 : inboundRate / outboundRate;
      const outboundSum =
        Number(this.payload.outboundSum) > 0
          ? Number(this.payload.outboundSum)
          : inboundSum * baseRate;

      const serviceFeePercentage = 0.02;
      const margin = inboundSum * serviceFeePercentage;
      const fee = margin;

      const outboundType =
        outboundCurrency[0].typeOf ||
        determineCurrencyTypeFromTicker(this.payload.outboundTicker);
      const networkFee =
        outboundType === "Cryptocurrency"
          ? estimateNetworkFee(this.payload.outboundTicker)
          : 0;

      const finalRateWithoutFees = baseRate;
      const finalRate = baseRate * (1 + serviceFeePercentage);

      const quote: OrderQuoteResultModel = {
        fxRate: baseRate,
        finalRate,
        finalRateWithoutFees,
        margin,
        fee,
        networkFee,
        outboundSum,
      };

      return { quote };
    } catch (e) {
      return { error: "Failed to calculate quote" };
    }
  }
}
