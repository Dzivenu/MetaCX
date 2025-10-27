"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// Types for org currencies
export interface OrgCurrency {
  id: string;
  name?: string;
  ticker?: string;
  rate?: number;
  buyMarginMax?: number;
  sellMarginMax?: number;
  tradeable?: boolean;
  typeOf?: string;
  floatDisplayOrder?: number;
  isBaseCurrency?: boolean;
  hexColor?: string;
  rateApiIdentifier: string;
  clerkOrganizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrgCurrencyData {
  name?: string;
  ticker?: string;
  rate?: number;
  buyMarginMax?: number;
  sellMarginMax?: number;
  tradeable?: boolean;
  typeOf?: string;
  floatDisplayOrder?: number;
  isBaseCurrency?: boolean;
  hexColor?: string;
  rateApiIdentifier: string;
}

interface UseOrgCurrenciesResult {
  orgCurrencies: OrgCurrency[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateOrgCurrency: (
    id: string,
    data: Partial<OrgCurrency>
  ) => Promise<OrgCurrency | null>;
  createOrgCurrency: (
    data: CreateOrgCurrencyData
  ) => Promise<OrgCurrency | null>;
  deleteOrgCurrency: (id: string) => Promise<boolean>;
}

// Hook for org currencies using Convex
export function useOrgCurrencies(): UseOrgCurrenciesResult {
  const { orgId } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Use Convex query to get org currencies
  const orgCurrenciesData = useQuery(
    api.functions.orgCurrencies.getOrgCurrencies,
    orgId ? { clerkOrganizationId: orgId } : "skip"
  );

  // Mutations
  const createOrgCurrencyMutation = useMutation(
    api.functions.orgCurrencies.createOrgCurrency
  );
  const updateOrgCurrencyMutation = useMutation(
    api.functions.orgCurrencies.updateOrgCurrency
  );
  const deleteOrgCurrencyMutation = useMutation(
    api.functions.orgCurrencies.deleteOrgCurrency
  );

  const orgCurrencies = useMemo(() => {
    if (!orgCurrenciesData) return [];
    return orgCurrenciesData.map((currency: any) => ({
      id: currency._id,
      name: currency.name,
      ticker: currency.ticker,
      rate: currency.rate,
      buyMarginMax: currency.buyMarginMax,
      sellMarginMax: currency.sellMarginMax,
      tradeable: currency.tradeable,
      typeOf: currency.typeOf,
      floatDisplayOrder: currency.floatDisplayOrder,
      isBaseCurrency: currency.isBaseCurrency || false,
      hexColor: currency.hexColor,
      rateApiIdentifier: currency.rateApiIdentifier,
      clerkOrganizationId: currency.clerkOrganizationId,
      createdAt: new Date(currency.createdAt).toISOString(),
      updatedAt: new Date(currency.updatedAt).toISOString(),
    }));
  }, [orgCurrenciesData]);

  // Timeout logic
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (orgId && orgCurrenciesData === undefined) {
      const timer = setTimeout(() => {
        setHasTimedOut(true);
      }, 5000);

      return () => clearTimeout(timer);
    } else if (orgCurrenciesData !== undefined) {
      setHasTimedOut(false);
    }
  }, [orgId, orgCurrenciesData]);

  const isLoading = orgCurrenciesData === undefined && !!orgId && !hasTimedOut;

  const createOrgCurrency = useCallback(
    async (data: CreateOrgCurrencyData): Promise<OrgCurrency | null> => {
      setError(null);
      try {
        const result = await createOrgCurrencyMutation({
          name: data.name,
          ticker: data.ticker,
          rate: data.rate,
          buyMarginMax: data.buyMarginMax,
          sellMarginMax: data.sellMarginMax,
          tradeable: data.tradeable,
          typeOf: data.typeOf,
          floatDisplayOrder: data.floatDisplayOrder,
          isBaseCurrency: data.isBaseCurrency,
          hexColor: data.hexColor,
          rateApiIdentifier: data.rateApiIdentifier,
        });

        return {
          id: result,
          name: data.name,
          ticker: data.ticker,
          rate: data.rate,
          buyMarginMax: data.buyMarginMax,
          sellMarginMax: data.sellMarginMax,
          tradeable: data.tradeable,
          typeOf: data.typeOf,
          floatDisplayOrder: data.floatDisplayOrder,
          isBaseCurrency: data.isBaseCurrency || false,
          hexColor: data.hexColor,
          rateApiIdentifier: data.rateApiIdentifier,
          clerkOrganizationId: orgId || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create org currency";
        setError(errorMessage);
        console.error("Error creating org currency:", err);
        return null;
      }
    },
    [createOrgCurrencyMutation, orgId]
  );

  const updateOrgCurrency = useCallback(
    async (id: string, data: Partial<OrgCurrency>): Promise<OrgCurrency | null> => {
      setError(null);
      try {
        await updateOrgCurrencyMutation({
          currencyId: id as Id<"org_currencies">,
          name: data.name,
          ticker: data.ticker,
          rate: data.rate,
          buyMarginMax: data.buyMarginMax,
          sellMarginMax: data.sellMarginMax,
          tradeable: data.tradeable,
          typeOf: data.typeOf,
          floatDisplayOrder: data.floatDisplayOrder,
          isBaseCurrency: data.isBaseCurrency,
          hexColor: data.hexColor,
        });

        // Return the updated currency (optimistic update)
        const existingCurrency = orgCurrencies.find((c) => c.id === id);
        if (existingCurrency) {
          return {
            ...existingCurrency,
            ...data,
            updatedAt: new Date().toISOString(),
          };
        }
        return null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update org currency";
        setError(errorMessage);
        console.error("Error updating org currency:", err);
        return null;
      }
    },
    [updateOrgCurrencyMutation, orgCurrencies]
  );

  const deleteOrgCurrency = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        await deleteOrgCurrencyMutation({
          currencyId: id as Id<"org_currencies">,
        });
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete org currency";
        setError(errorMessage);
        console.error("Error deleting org currency:", err);
        return false;
      }
    },
    [deleteOrgCurrencyMutation]
  );

  const refresh = useCallback(async () => {
    // Convex automatically refreshes, but we can reset error state
    setError(null);
  }, []);

  return {
    orgCurrencies,
    loading: isLoading,
    error,
    refresh,
    updateOrgCurrency,
    createOrgCurrency,
    deleteOrgCurrency,
  };
}
