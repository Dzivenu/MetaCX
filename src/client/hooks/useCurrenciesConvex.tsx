"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// Types to match the existing API interface
export interface Currency {
  id: string;
  ticker: string;
  name: string;
  typeOf?: string;
  floatDisplayOrder?: number;
  isBaseCurrency?: boolean;
  active?: boolean;
  createdAt: string;
  updatedAt: string;
  // Extended fields to support UI already in place
  rate?: number;
  tradeable?: boolean;
  rateApiIdentifier?: string;
  denominations?: Denomination[];
}

interface Denomination {
  id: string;
  name?: string;
  value: number;
  accepted?: boolean;
}

export interface CreateCurrencyData {
  ticker: string;
  name: string;
  typeOf?: string;
  floatDisplayOrder?: number;
  isBaseCurrency?: boolean;
}

interface UseCurrenciesResult {
  currencies: Currency[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateCurrency: (
    id: string,
    data: Partial<Currency>
  ) => Promise<Currency | null>;
  createCurrency: (data: Partial<Currency> | any) => Promise<Currency | null>;
  deleteCurrency: (id: string) => Promise<boolean>;
}

// Hook for currencies using Convex (repointed to org_currencies)
export function useCurrencies(): UseCurrenciesResult {
  const { orgId } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const orgCurrenciesData = useQuery(
    api.functions.orgCurrencies.getOrgCurrencies,
    orgId ? { clerkOrganizationId: orgId } : "skip"
  );

  // Mutations for org currencies
  const createOrgCurrencyMutation = useMutation(
    api.functions.orgCurrencies.createOrgCurrency
  );
  const updateOrgCurrencyMutation = useMutation(
    api.functions.orgCurrencies.updateOrgCurrency
  );
  const deleteOrgCurrencyMutation = useMutation(
    api.functions.orgCurrencies.deleteOrgCurrency
  );
  const getOrgDenominationsQuery = useQuery as unknown as (
    name: any,
    args: any
  ) => any;

  const currencies = useMemo(() => {
    if (!orgCurrenciesData) return [];
    return orgCurrenciesData.map((c: any) => ({
      id: c._id,
      ticker: c.ticker || "",
      name: c.name || "",
      typeOf: c.typeOf,
      floatDisplayOrder: c.floatDisplayOrder,
      isBaseCurrency: c.isBaseCurrency || false,
      active: true,
      createdAt: new Date(c.createdAt).toISOString(),
      updatedAt: new Date(c.updatedAt).toISOString(),
      rate: c.rate,
      tradeable: c.tradeable,
      rateApiIdentifier: c.rateApiIdentifier,
    }));
  }, [orgCurrenciesData]);

  // Timeout handling
  const [hasTimedOut, setHasTimedOut] = useState(false);
  useEffect(() => {
    if (orgId && orgCurrenciesData === undefined) {
      const timer = setTimeout(() => setHasTimedOut(true), 5000);
      return () => clearTimeout(timer);
    } else if (orgCurrenciesData !== undefined) {
      setHasTimedOut(false);
    }
  }, [orgId, orgCurrenciesData]);

  const isLoading = orgCurrenciesData === undefined && !!orgId && !hasTimedOut;

  const createCurrency = useCallback(
    async (data: any): Promise<Currency | null> => {
      setError(null);
      try {
        // Expecting shape constructed by CurrencyDetails
        const selected = data.currency || data;
        const result = await createOrgCurrencyMutation({
          name: selected.name,
          ticker: selected.ticker,
          typeOf: selected.typeOf,
          floatDisplayOrder: selected.floatDisplayOrder,
          isBaseCurrency: selected.isBaseCurrency,
          rateApiIdentifier:
            selected.rateApiIdentifier ||
            selected.rateApiIdentifier ||
            selected.ticker,
          // pass denominations and repositories if provided
          denominations: data.denominations?.map((d: any) => ({
            value: d.value,
          })),
          repositories: data.repositories as Id<"repositories">[] | undefined,
          clerkOrganizationId: orgId || undefined,
        });

        return {
          id: result,
          ticker: selected.ticker || "",
          name: selected.name || "",
          typeOf: selected.typeOf,
          floatDisplayOrder: selected.floatDisplayOrder,
          isBaseCurrency: selected.isBaseCurrency || false,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create currency";
        setError(errorMessage);
        console.error("Error creating currency:", err);
        return null;
      }
    },
    [createOrgCurrencyMutation, orgId]
  );

  const updateCurrency = useCallback(
    async (id: string, data: Partial<Currency>): Promise<Currency | null> => {
      setError(null);
      try {
        await updateOrgCurrencyMutation({
          currencyId: id as Id<"org_currencies">,
          name: data.name,
          ticker: data.ticker,
          typeOf: data.typeOf,
          floatDisplayOrder: data.floatDisplayOrder,
          isBaseCurrency: data.isBaseCurrency,
          hexColor: (data as any).hexColor,
          rate: data.rate,
          buyMarginMax: (data as any).buyMarginMax,
          sellMarginMax: (data as any).sellMarginMax,
          tradeable: data.tradeable,
        });

        const existing = currencies.find((c) => c.id === id);
        return existing
          ? { ...existing, ...data, updatedAt: new Date().toISOString() }
          : null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update currency";
        setError(errorMessage);
        console.error("Error updating currency:", err);
        return null;
      }
    },
    [updateOrgCurrencyMutation, currencies]
  );

  const deleteCurrency = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        await deleteOrgCurrencyMutation({
          currencyId: id as Id<"org_currencies">,
        });
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete currency";
        setError(errorMessage);
        console.error("Error deleting currency:", err);
        return false;
      }
    },
    [deleteOrgCurrencyMutation]
  );

  const refresh = useCallback(async () => {
    setError(null);
  }, []);

  return {
    currencies,
    loading: isLoading,
    error,
    refresh,
    updateCurrency,
    createCurrency,
    deleteCurrency,
  };
}
