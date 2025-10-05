/**
 * useCurrencyCalculator - React hook for managing currency calculations
 * Integrates QuoteCalculator with React state management
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  QuoteCalculator,
  Currency,
  QuoteState,
  QuoteCalculationResult,
} from "@/client/services/QuoteCalculator";
import {
  CurrencyService,
  MockCurrencyService,
} from "@/client/services/CurrencyService";

export interface CurrencyCalculatorState {
  // Calculator state
  calculator: QuoteCalculator | null;
  currencies: Currency[];
  isLoading: boolean;
  error: string | null;

  // Current quote state
  inboundTicker: string;
  outboundTicker: string;
  inboundAmount: number;
  outboundAmount: number;
  spotRate: number;
  finalRate: number;
  margin: number;
  serviceFee: number;
  networkFee: number;

  // Float balances
  outboundFloatBalance: string;
  outboundFloatBalanceCAD: string;
  loadingFloatBalance: boolean;
}

export interface CurrencyCalculatorActions {
  // Amount updates
  updateInboundAmount: (amount: number) => void;
  updateOutboundAmount: (amount: number) => void;

  // Currency changes
  changeInboundCurrency: (ticker: string) => void;
  changeOutboundCurrency: (ticker: string) => void;
  swapCurrencies: () => void;

  // Fee and rate updates
  updateServiceFee: (fee: number) => void;
  updateNetworkFee: (fee: number) => void;
  updateMargin: (margin: number) => void;
  updateFinalRate: (rate: number) => void;
  resetLocks: () => void;

  // Data refresh
  refreshCurrencies: () => Promise<void>;
  refreshRates: () => Promise<void>;
  loadFloatBalance: (ticker: string) => Promise<void>;

  // Get formatted values
  getFormattedInboundAmount: () => string;
  getFormattedOutboundAmount: () => string;
  getFormattedRate: () => string;
  getFormattedMargin: () => string;
}

export interface UseCurrencyCalculatorOptions {
  serviceFee?: number;
  networkFee?: number;
  useMockData?: boolean;
  autoLoadFloatBalance?: boolean;
  // If provided, use these currencies (organization currencies) instead of fetching
  currencies?: Currency[];
}

export function useCurrencyCalculator(
  options: UseCurrencyCalculatorOptions = {}
): CurrencyCalculatorState & CurrencyCalculatorActions {
  const {
    serviceFee = 2,
    networkFee = 0,
    useMockData = true, // Default to mock for development
    autoLoadFloatBalance = true,
    currencies: currenciesOverride,
  } = options;

  const usingOverride = Boolean(
    currenciesOverride && currenciesOverride.length > 0
  );

  // State
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [calculator, setCalculator] = useState<QuoteCalculator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingFloatBalance, setLoadingFloatBalance] = useState(false);

  // Quote state
  const [quoteState, setQuoteState] = useState<Partial<QuoteState>>({
    currencyAval: 0,
    currencyBval: 0,
    spotFx: 0,
    rate: 0,
    margin: 0,
    serviceFee,
    networkFee,
    finalRate: 0,
    finalRateWithoutFees: 0,
  });

  // Float balance state
  const [outboundFloatBalance, setOutboundFloatBalance] = useState<string>("");
  const [outboundFloatBalanceCAD, setOutboundFloatBalanceCAD] =
    useState<string>("");

  // Initialize currency service
  const currencyService = useMemo(() => {
    if (useMockData) {
      return new MockCurrencyService({
        baseUrl: "/api",
        userEmail: "test@example.com",
        userToken: "test-token",
        sessionID: "test-session",
      });
    }

    // In real implementation, get these from auth context or environment
    return new CurrencyService({
      baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
      userEmail: "", // Get from auth context
      userToken: "", // Get from auth context
      sessionID: "", // Get from session
    });
  }, [useMockData]);

  // Initialize currencies and calculator
  const initializeCurrencies = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // If override is provided, always use it and do NOT fetch legacy API
      if (currenciesOverride !== undefined) {
        const sourceCurrencies = currenciesOverride;
        setCurrencies(sourceCurrencies);

        if (sourceCurrencies.length > 0) {
          const newCalculator = new QuoteCalculator(
            sourceCurrencies,
            serviceFee
          );
          setCalculator(newCalculator);
          const state = newCalculator.getState();
          setQuoteState(state);
        }

        setIsLoading(sourceCurrencies.length === 0);
        return;
      }

      // Fallback to legacy fetch only when no override is provided
      const fetchedCurrencies = await currencyService.fetchCurrencies();
      setCurrencies(fetchedCurrencies);
      if (fetchedCurrencies.length > 0) {
        const newCalculator = new QuoteCalculator(
          fetchedCurrencies,
          serviceFee
        );
        setCalculator(newCalculator);
        const state = newCalculator.getState();
        setQuoteState(state);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load currencies"
      );
    } finally {
      // isLoading may have been set above when using override; only force false when not using override
      if (currenciesOverride === undefined) {
        setIsLoading(false);
      }
    }
  }, [currencyService, serviceFee, currenciesOverride]);

  // Load float balance for outbound currency
  const loadFloatBalance = useCallback(
    async (ticker: string) => {
      // When using organization currencies override, skip legacy float balance lookup
      if (usingOverride) return;
      if (!ticker || ticker === "CAD") return; // Skip for base currency

      try {
        setLoadingFloatBalance(true);
        const balance = await currencyService.getFloatBalance(ticker);

        const currency = currencies.find((c) => c.ticker === ticker);
        const decimals =
          currency?.typeof?.toUpperCase() === "CRYPTOCURRENCY" ? 8 : 2;

        setOutboundFloatBalance(balance.value.toFixed(decimals));
        setOutboundFloatBalanceCAD(
          ticker !== "CAD" ? balance.cad_value.toFixed(2) : ""
        );
      } catch (err) {
        console.error(`Error loading float balance for ${ticker}:`, err);
        setOutboundFloatBalance("Unable to calculate float balance");
        setOutboundFloatBalanceCAD("");
      } finally {
        setLoadingFloatBalance(false);
      }
    },
    [currencyService, currencies, usingOverride]
  );

  // Update quote state helper
  const updateQuoteState = useCallback((result: QuoteCalculationResult) => {
    setQuoteState((prev) => ({
      ...prev,
      ...result,
    }));
  }, []);

  // Amount updates
  const updateInboundAmount = useCallback(
    (amount: number) => {
      if (!calculator) return;

      const result = calculator.updateInboundAmount(amount);
      updateQuoteState(result);
    },
    [calculator, updateQuoteState]
  );

  const updateOutboundAmount = useCallback(
    (amount: number) => {
      if (!calculator) return;

      const result = calculator.updateOutboundAmount(amount);
      updateQuoteState(result);
    },
    [calculator, updateQuoteState]
  );

  // Currency changes
  const changeInboundCurrency = useCallback(
    (ticker: string) => {
      if (!calculator) return;

      try {
        const result = calculator.changeInboundCurrency(ticker);
        updateQuoteState(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to change currency"
        );
      }
    },
    [calculator, updateQuoteState]
  );

  const changeOutboundCurrency = useCallback(
    (ticker: string) => {
      if (!calculator) return;

      try {
        const result = calculator.changeOutboundCurrency(ticker);
        updateQuoteState(result);

        if (autoLoadFloatBalance) {
          loadFloatBalance(ticker);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to change currency"
        );
      }
    },
    [calculator, updateQuoteState, autoLoadFloatBalance, loadFloatBalance]
  );

  const swapCurrencies = useCallback(() => {
    if (!calculator) return;

    const result = calculator.swapCurrencies();
    updateQuoteState(result);

    if (autoLoadFloatBalance && quoteState.currencyB) {
      loadFloatBalance(quoteState.currencyB.ticker);
    }
  }, [
    calculator,
    updateQuoteState,
    autoLoadFloatBalance,
    loadFloatBalance,
    quoteState.currencyB,
  ]);

  // Fee and rate updates
  const updateServiceFee = useCallback(
    (fee: number) => {
      if (!calculator) return;

      const result = calculator.updateServiceFee(fee);
      updateQuoteState(result);
    },
    [calculator, updateQuoteState]
  );

  const updateNetworkFee = useCallback(
    (fee: number) => {
      if (!calculator) return;

      const result = calculator.updateNetworkFee(fee);
      updateQuoteState(result);
    },
    [calculator, updateQuoteState]
  );

  const updateMargin = useCallback(
    (margin: number) => {
      if (!calculator) return;

      const result = calculator.updateMargin(margin);
      updateQuoteState(result);
    },
    [calculator, updateQuoteState]
  );

  const updateFinalRate = useCallback(
    (rate: number) => {
      if (!calculator) return;

      const result = calculator.updateFinalRate(rate);
      updateQuoteState(result);
    },
    [calculator, updateQuoteState]
  );

  const resetLocks = useCallback(() => {
    if (!calculator) return;

    const result = calculator.resetLocks();
    updateQuoteState(result);
  }, [calculator, updateQuoteState]);

  // Data refresh
  const refreshCurrencies = useCallback(async () => {
    await initializeCurrencies();
  }, [initializeCurrencies]);

  const refreshRates = useCallback(async () => {
    try {
      await currencyService.refreshCurrencyRates();
      // After refreshing rates, reload currencies to get updated rates
      await refreshCurrencies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh rates");
    }
  }, [currencyService, refreshCurrencies]);

  // Formatted values
  const getFormattedInboundAmount = useCallback(() => {
    const amount = quoteState.currencyAval || 0;
    const currency = quoteState.currencyA;
    if (!currency) return "0.00";

    const decimals =
      currency.typeof?.toUpperCase() === "CRYPTOCURRENCY" ? 8 : 2;
    return amount.toFixed(decimals);
  }, [quoteState.currencyAval, quoteState.currencyA]);

  const getFormattedOutboundAmount = useCallback(() => {
    const amount = quoteState.currencyBval || 0;
    const currency = quoteState.currencyB;
    if (!currency) return "0.00";

    const decimals =
      currency.typeof?.toUpperCase() === "CRYPTOCURRENCY" ? 8 : 2;
    return amount.toFixed(decimals);
  }, [quoteState.currencyBval, quoteState.currencyB]);

  const getFormattedRate = useCallback(() => {
    return (quoteState.rate || 0).toFixed(6);
  }, [quoteState.rate]);

  const getFormattedMargin = useCallback(() => {
    return (quoteState.margin || 0).toFixed(2);
  }, [quoteState.margin]);

  // Initialize on mount and when override currencies change
  useEffect(() => {
    initializeCurrencies();
  }, [initializeCurrencies]);

  // Auto-load float balance for initial outbound currency
  useEffect(() => {
    if (
      autoLoadFloatBalance &&
      !usingOverride &&
      quoteState.currencyB?.ticker
    ) {
      loadFloatBalance(quoteState.currencyB.ticker);
    }
  }, [
    autoLoadFloatBalance,
    usingOverride,
    quoteState.currencyB?.ticker,
    loadFloatBalance,
  ]);

  return {
    // State
    calculator,
    currencies,
    isLoading,
    error,
    inboundTicker: quoteState.currencyA?.ticker || "",
    outboundTicker: quoteState.currencyB?.ticker || "",
    inboundAmount: quoteState.currencyAval || 0,
    outboundAmount: quoteState.currencyBval || 0,
    spotRate: quoteState.spotFx || 0,
    finalRate: quoteState.finalRate || 0,
    margin: quoteState.margin || 0,
    serviceFee: quoteState.serviceFee || serviceFee,
    networkFee: quoteState.networkFee || networkFee,
    outboundFloatBalance,
    outboundFloatBalanceCAD,
    loadingFloatBalance,

    // Actions
    updateInboundAmount,
    updateOutboundAmount,
    changeInboundCurrency,
    changeOutboundCurrency,
    swapCurrencies,
    updateServiceFee,
    updateNetworkFee,
    updateMargin,
    updateFinalRate,
    resetLocks,
    refreshCurrencies,
    refreshRates,
    loadFloatBalance,
    getFormattedInboundAmount,
    getFormattedOutboundAmount,
    getFormattedRate,
    getFormattedMargin,
  };
}
