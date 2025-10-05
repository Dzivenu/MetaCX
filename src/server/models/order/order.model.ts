import { currency } from "@/server/db/schema";

export type SupportedOrderStatus =
  | "QUOTE"
  | "ACCEPTED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "SCHEDULED"
  | "BLOCKED";

export interface OrderQuoteRequestModel {
  inboundTicker: string;
  outboundTicker: string;
  inboundSum: number;
  outboundSum?: number;
}

export interface OrderQuoteResultModel {
  fxRate: number;
  finalRate: number;
  finalRateWithoutFees: number;
  margin: number;
  fee: number;
  networkFee: number;
  outboundSum: number;
}

export function determineCurrencyTypeFromTicker(ticker: string): string {
  const cryptoTickers = ["BTC", "ETH", "LTC", "BCH", "XRP", "ADA", "DOT"];
  if (cryptoTickers.includes(ticker.toUpperCase())) return "Cryptocurrency";

  const fiatTickers = ["CAD", "USD", "EUR", "GBP", "JPY", "AUD"];
  if (fiatTickers.includes(ticker.toUpperCase())) return "Fiat";

  const metalTickers = ["XAU", "XAG", "XPT", "XPD"];
  if (metalTickers.includes(ticker.toUpperCase())) return "Metal";

  return "Fiat";
}

export function estimateNetworkFee(ticker: string): number {
  switch (ticker.toUpperCase()) {
    case "BTC":
      return 0.0001;
    case "ETH":
      return 0.002;
    case "LTC":
      return 0.001;
    default:
      return 0;
  }
}
