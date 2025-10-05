"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";

// Types for app currencies
export interface AppCurrency {
  id: string;
  name: string;
  ticker: string;
  baseRateTicker: string;
  type: "CRYPTOCURRENCY" | "FIAT" | "METAL";
  rate: number;
  rateUpdatedAt: string;
  network?: string;
  contract?: string;
  chainId?: string;
  rateApi?: string;
  rateApiIdentifier?: string;
  icon?: string;
}

interface RefreshResult {
  success: boolean;
  totalCurrencies: number;
  timestamp: number;
  baseCurrency: string;
}

interface UseAppCurrenciesResult {
  appCurrencies: AppCurrency[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  refreshFromAPI: () => Promise<RefreshResult | null>;
  refreshing: boolean;
}

// Hook for app currencies using Convex
export function useAppCurrencies(): UseAppCurrenciesResult {
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Use Convex query to get app currencies
  const appCurrenciesData = useQuery(api.functions.appCurrencies.getAppCurrencies);

  // Action for refreshing currencies from API
  const refreshAction = useAction(api.actions.currencies.refreshAppCurrencies);

  const appCurrencies = useMemo(() => {
    if (!appCurrenciesData) return [];
    return appCurrenciesData.map((currency: any) => ({
      id: currency._id,
      name: currency.name || "",
      ticker: currency.ticker || "",
      baseRateTicker: currency.base_rate_ticker || "",
      type: currency.type || "FIAT",
      rate: currency.rate || 0,
      rateUpdatedAt: new Date(currency.rate_updated_at).toISOString(),
      network: currency.network || "",
      contract: currency.contract || "",
      chainId: currency.chain_id || "",
      rateApi: currency.rate_api || "",
      rateApiIdentifier: currency.rate_api_identifier || "",
      icon: currency.icon || "",
    }));
  }, [appCurrenciesData]);

  // If data is undefined for more than a few seconds, assume Convex is not available
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (appCurrenciesData === undefined) {
      const timer = setTimeout(() => {
        console.log(
          "🔍 useAppCurrencies - Convex query timed out, assuming no data available"
        );
        setHasTimedOut(true);
      }, 5000); // 5 second timeout

      return () => clearTimeout(timer);
    } else if (appCurrenciesData !== undefined) {
      setHasTimedOut(false);
    }
  }, [appCurrenciesData]);

  const isLoading = appCurrenciesData === undefined && !hasTimedOut;

  const refresh = () => {
    // Convex automatically refreshes, but we can reset error state
    setError(null);
  };

  const refreshFromAPI =
    useCallback(async (): Promise<RefreshResult | null> => {
      setError(null);
      setRefreshing(true);

      try {
        const result = await refreshAction();
        console.log("App currencies refreshed successfully:", result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to refresh currencies from API";
        setError(errorMessage);
        console.error("Error refreshing app currencies from API:", err);
        return null;
      } finally {
        setRefreshing(false);
      }
    }, [refreshAction]);

  return {
    appCurrencies,
    loading: isLoading,
    error,
    refresh,
    refreshFromAPI,
    refreshing,
  };
}
