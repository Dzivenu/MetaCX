/**
 * CurrencyService - API service for fetching and managing currencies
 * Adapted from the front implementation's currency.js
 */

import { Currency } from "./QuoteCalculator";

export interface SessionData {
  baseUrl: string;
  userEmail: string;
  userToken: string;
  sessionID?: string;
}

export interface FloatBalanceResponse {
  value: number;
  cad_value: number;
  error?: string;
}

export interface CurrencyAPIResponse {
  data?: Currency[];
  error?: string;
  success?: boolean;
}

/**
 * Currency Service Class
 */
export class CurrencyService {
  private sessionData: SessionData;

  constructor(sessionData: SessionData) {
    this.sessionData = sessionData;
  }

  /**
   * Fetch all tradeable currencies
   */
  async fetchCurrencies(): Promise<Currency[]> {
    const { userEmail, userToken, baseUrl } = this.sessionData;

    try {
      const response = await fetch(
        `${baseUrl}/api/v1/currencies?minified=TRUE`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-User-Email": userEmail,
            "X-User-Token": userToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Filter for tradeable currencies and sort by display order
      const currencies = (data as Currency[])
        .filter((currency) => currency.tradeable)
        .sort((a, b) => {
          if (a.display_order && b.display_order) {
            return a.display_order - b.display_order;
          }
          return a.ticker.localeCompare(b.ticker);
        });

      return currencies;
    } catch (error) {
      console.error("Error fetching currencies:", error);
      throw new Error("Unable to fetch currencies");
    }
  }

  /**
   * Fetch currency by ticker or ID
   */
  async fetchCurrencyByTicker(ticker: string): Promise<Currency | null> {
    const { userEmail, userToken, baseUrl } = this.sessionData;

    try {
      const response = await fetch(`${baseUrl}/api/v1/currencies/${ticker}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": userEmail,
          "X-User-Token": userToken,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as Currency;
    } catch (error) {
      console.error(`Error fetching currency ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Get session float balance for a specific ticker
   */
  async getFloatBalance(ticker: string): Promise<FloatBalanceResponse> {
    const { userEmail, userToken, sessionID, baseUrl } = this.sessionData;

    if (!sessionID) {
      throw new Error("Session ID is required for float balance lookup");
    }

    try {
      const response = await fetch(
        `${baseUrl}/api/v1/sessions/float_for/${sessionID}?ticker=${ticker}`,
        {
          method: "GET",
          headers: {
            "Content-type": "application/json",
            "X-User-Email": userEmail,
            "X-User-Token": userToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as FloatBalanceResponse;
    } catch (error) {
      console.error(`Error fetching float balance for ${ticker}:`, error);
      throw new Error(`Unable to fetch float balance for ${ticker}`);
    }
  }

  /**
   * Enqueue currency rates refresh
   */
  async refreshCurrencyRates(): Promise<void> {
    const { userEmail, userToken, baseUrl } = this.sessionData;

    try {
      const response = await fetch(
        `${baseUrl}/api/v1/currencies/enqueue_currencies_rates_refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Email": userEmail,
            "X-User-Token": userToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error refreshing currency rates:", error);
      throw new Error("Unable to enqueue currency rates refresh");
    }
  }

  /**
   * Fetch currency session rates by ticker
   */
  async fetchSessionRates(sessionId: string, ticker: string): Promise<any> {
    const { userEmail, userToken, baseUrl } = this.sessionData;

    try {
      const response = await fetch(
        `${baseUrl}/api/v1/currencies/session_rates?session_id=${sessionId}&ticker=${ticker}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-User-Email": userEmail,
            "X-User-Token": userToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching session rates for ${ticker}:`, error);
      throw new Error("Unable to fetch currency rates");
    }
  }

  /**
   * Get base currency from currencies list
   */
  static getBaseCurrency(currencies: Currency[]): Currency | null {
    return (
      currencies.find((c) => c.base === true || c.ticker === "CAD") || null
    );
  }

  /**
   * Format currencies by display order
   */
  static formatCurrenciesByDisplayOrder(currencies: Currency[]): Currency[] {
    return currencies.sort((a, b) => {
      if (a.display_order && b.display_order) {
        return a.display_order - b.display_order;
      }
      // Put base currency first if no display order
      if (a.base && !b.base) return -1;
      if (!a.base && b.base) return 1;
      return a.ticker.localeCompare(b.ticker);
    });
  }

  /**
   * Update session data
   */
  updateSessionData(sessionData: Partial<SessionData>): void {
    this.sessionData = { ...this.sessionData, ...sessionData };
  }
}

/**
 * Create a mock currency service for development/testing
 */
export class MockCurrencyService extends CurrencyService {
  private mockCurrencies: Currency[] = [
    {
      ticker: "CAD",
      name: "Canadian Dollar",
      rate: 1.0,
      buy_margin_max: 0,
      sell_margin_max: 0,
      we_buy: 1.0,
      we_sell: 1.0,
      typeof: "Fiat",
      tradeable: true,
      display_order: 1,
      base: true,
    },
    {
      ticker: "BTC",
      name: "Bitcoin",
      rate: 65000,
      buy_margin_max: 2.5,
      sell_margin_max: 2.5,
      we_buy: 63375,
      we_sell: 66625,
      typeof: "Cryptocurrency",
      tradeable: true,
      display_order: 2,
    },
    {
      ticker: "ETH",
      name: "Ethereum",
      rate: 3200,
      buy_margin_max: 2.0,
      sell_margin_max: 2.0,
      we_buy: 3136,
      we_sell: 3264,
      typeof: "Cryptocurrency",
      tradeable: true,
      display_order: 3,
    },
    {
      ticker: "USD",
      name: "US Dollar",
      rate: 1.35,
      buy_margin_max: 1.0,
      sell_margin_max: 1.0,
      we_buy: 1.3365,
      we_sell: 1.3635,
      typeof: "Fiat",
      tradeable: true,
      display_order: 4,
    },
  ];

  async fetchCurrencies(): Promise<Currency[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...this.mockCurrencies];
  }

  async fetchCurrencyByTicker(ticker: string): Promise<Currency | null> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return this.mockCurrencies.find((c) => c.ticker === ticker) || null;
  }

  async getFloatBalance(ticker: string): Promise<FloatBalanceResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const mockBalances: Record<string, FloatBalanceResponse> = {
      BTC: { value: 1000.002, cad_value: 65000020 },
      ETH: { value: 500.25, cad_value: 1600800 },
      CAD: { value: 148092707, cad_value: 148092707 },
      USD: { value: 100000, cad_value: 135000 },
    };

    return mockBalances[ticker] || { value: 0, cad_value: 0 };
  }

  async refreshCurrencyRates(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
