"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import countryToCurrency from "country-to-currency";

// Helper function to determine currency type
function getCurrencyType(ticker: string): "CRYPTOCURRENCY" | "FIAT" | "METAL" {
  const upperTicker = ticker.toUpperCase();

  // Only hardcode metals as requested
  const metals = ["XAU", "XAG", "XPT", "XPD"]; // Gold, Silver, Platinum, Palladium
  if (metals.includes(upperTicker)) {
    return "METAL";
  }

  // Use country-to-currency library to determine if it's a fiat currency
  const fiatCurrencies = Object.values(countryToCurrency) as string[];
  if (fiatCurrencies.includes(upperTicker)) {
    return "FIAT";
  }

  // If not fiat or metal, assume cryptocurrency
  return "CRYPTOCURRENCY";
}

// Helper function to get currency name from ticker
function getCurrencyName(ticker: string): string {
  // No hardcoded mappings - return ticker as name
  // Currency names should be fetched from external data source or API
  return ticker.toUpperCase();
}

// Refresh app currencies from Open Exchange Rates API
export const refreshAppCurrencies = action({
  args: {},
  handler: async (ctx, args) => {
    let identity: any = null;
    try {
      identity = await ctx.auth.getUserIdentity();
    } catch (err) {
      // In development, allow proceeding if Clerk discovery is rate-limited
      const isProd = process.env.NODE_ENV === "production";
      const message = err instanceof Error ? err.message : String(err);
      const discoveryFailed = message.includes("AuthProviderDiscoveryFailed");
      if (isProd || !discoveryFailed) {
        throw err instanceof Error ? err : new Error("Authentication error");
      }
      console.warn(
        "Proceeding without identity due to Clerk discovery rate limit in development"
      );
    }

    if (process.env.NODE_ENV === "production" && !identity) {
      throw new Error("Unauthorized");
    }

    // Get API key from environment variables (server-side)
    const apiKey = process.env.OPEN_EXCHANGE_RATE_APP_ID;
    if (!apiKey) {
      throw new Error(
        "Open Exchange Rates API key not configured. Please set OPEN_EXCHANGE_RATE_APP_ID in your environment variables."
      );
    }

    try {
      // Fetch exchange rates from Open Exchange Rates API
      const response = await fetch(
        `https://openexchangerates.org/api/latest.json?app_id=${apiKey}&show_alternative=true`
      );

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.rates || !data.base || !data.timestamp) {
        throw new Error("Invalid API response format");
      }

      const now = Date.now();
      const rateTimestamp = data.timestamp * 1000; // Convert to milliseconds
      // Normalize rates to CAD base instead of the API default (usually USD)
      const desiredBase = "CAD";
      const baseRateInUSD = data.rates[desiredBase];
      if (!baseRateInUSD || typeof baseRateInUSD !== "number") {
        throw new Error(
          `Desired base ${desiredBase} not present in API response`
        );
      }
      const baseCurrency = desiredBase;

      // Process each currency rate using the helper mutation
      const updatePromises = Object.entries(data.rates).map(
        async ([ticker, rate]) => {
          if (typeof rate !== "number") return;

          const currencyType = getCurrencyType(ticker);
          const currencyName = getCurrencyName(ticker);

          // Convert API USD-based rates to CAD-based rates
          const normalizedRate =
            ticker.toUpperCase() === desiredBase
              ? 1
              : (rate as number) / baseRateInUSD;

          // Use the helper mutation to update/create the currency
          await ctx.runMutation(api.functions.appCurrencies.upsertAppCurrency, {
            ticker,
            name: currencyName,
            baseRateTicker: baseCurrency,
            type: currencyType,
            rate: normalizedRate,
            rateUpdatedAt: rateTimestamp,
          });
        }
      );

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Return summary
      const totalCurrencies = Object.keys(data.rates).length;
      return {
        success: true,
        totalCurrencies,
        timestamp: rateTimestamp,
        baseCurrency,
      };
    } catch (error) {
      console.error("Error refreshing app currencies:", error);
      throw new Error(
        error instanceof Error
          ? `Failed to refresh currencies: ${error.message}`
          : "Failed to refresh currencies: Unknown error"
      );
    }
  },
});
