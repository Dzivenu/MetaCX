"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { logger } from "@/client/utils/logger";
import { useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { useRepositories } from "@/client/hooks/useRepositoriesConvex";
import { useCurrencies } from "@/client/hooks/useCurrenciesConvex";
import { useActiveSession } from "@/client/hooks/useActiveSession";

export interface Repository {
  id: string;
  name: string;
  currencyTickers: string[];
}

export interface Currency {
  ticker: string;
  name: string;
  typeOf: string;
}

export interface QuoteResult {
  fxRate: number;
  finalRate: number;
  finalRateWithoutFees: number;
  rateWoFees: number;
  margin: number;
  fee: number;
  networkFee: number;
  outboundSum: number;
  // Additional fields from front implementation
  serviceFee?: number;
  spotFx?: number;
  lockedRate?: boolean;
  lockedMargin?: boolean;
  availableFloatBalance?: number;
}

export interface QuoteState {
  mode: "new" | "edit" | "view";
  isBatched: boolean;
  quoteSource: string;
  fromBtcPayInvoice?: boolean;
  sessionId?: string;
  orderId?: string;
}

export interface BreakdownItem {
  id: string;
  label: string;
  amount: number;
}

export interface OrderFormData {
  inboundTicker: string;
  inboundSum: number;
  outboundTicker: string;
  outboundSum: number;
  inboundRepositoryId?: string;
  outboundRepositoryId?: string;
}

type StepIndex = 0 | 1 | 2 | 3;

interface OrderCreationContextValue {
  // step state
  currentStep: StepIndex;
  setCurrentStep: (step: StepIndex) => void;
  nextStep: () => void;
  prevStep: () => void;
  canProceedFromStep: (step?: StepIndex) => boolean;

  // lookup
  repositories: Repository[];
  currencies: Currency[];
  getAvailableRepositories: (currencyTicker: string) => Repository[];

  // form
  form: OrderFormData;
  setForm: React.Dispatch<React.SetStateAction<OrderFormData>>;
  setFormField: (
    name: keyof OrderFormData,
    value: string | number | undefined
  ) => void;

  // quote state
  quote: QuoteResult | null;
  quoteState: QuoteState;
  loadingQuote: boolean;
  error: string | null;
  warnings: Array<{
    type: "warning" | "info" | "error";
    currency: string;
    message: string;
  }>;

  // quote actions
  generateQuote: () => Promise<QuoteResult | null>;
  submitQuote: (quoteToSubmit?: QuoteResult | null) => Promise<boolean>;
  updateQuote: () => Promise<boolean>;
  cancelQuoteEdit: () => void;
  toggleEditQuote: () => void;
  hasValidQuote: () => boolean;

  // quote options
  setBatchStatus: (batched: boolean) => void;
  setQuoteSource: (source: string) => void;

  // breakdowns
  breakdowns: BreakdownItem[];
  addBreakdownItem: (item: Omit<BreakdownItem, "id">) => void;
  updateBreakdownItem: (id: string, update: Partial<BreakdownItem>) => void;
  removeBreakdownItem: (id: string) => void;
  breakdownTotal: number;

  // customer selection
  customerId?: string;
  setCustomerId: (customerId: string | undefined) => void;

  // finalize
  creating: boolean;
  createOrder: () => Promise<string | null>;
}

const OrderCreationContext = createContext<
  OrderCreationContextValue | undefined
>(undefined);

export function useOrderCreation() {
  const ctx = useContext(OrderCreationContext);
  if (!ctx)
    throw new Error(
      "useOrderCreation must be used within OrderCreationProvider"
    );
  return ctx;
}

export function OrderCreationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentStep, setCurrentStep] = useState<StepIndex>(0);

  // Get organization and session context
  const { orgId } = useAuth();
  const { activeSession } = useActiveSession();

  // lookups via Convex
  const { repositories: repoHook } = useRepositories();
  const { currencies: currencyHook } = useCurrencies();
  const repositories = useMemo<Repository[]>(
    () =>
      (repoHook || []).map((r) => ({
        id: r.id,
        name: r.name,
        currencyTickers: r.currencyTickers || [],
      })),
    [repoHook]
  );
  const currencies = useMemo<Currency[]>(
    () =>
      (currencyHook || []).map((c) => ({
        ticker: c.ticker,
        name: c.name,
        typeOf: c.typeOf || "",
      })),
    [currencyHook]
  );

  // form state
  const [form, setForm] = useState<OrderFormData>({
    inboundTicker: "CAD",
    inboundSum: 0,
    outboundTicker: "BTC",
    outboundSum: 0,
    inboundRepositoryId: undefined,
    outboundRepositoryId: undefined,
  });

  const [customerId, setCustomerId] = useState<string | undefined>(undefined);

  // quote state
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoteState, setQuoteState] = useState<QuoteState>({
    mode: "new",
    isBatched: false,
    quoteSource: "trading_tool_ui",
    sessionId: undefined,
    orderId: undefined,
  });
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<
    Array<{
      type: "warning" | "info" | "error";
      currency: string;
      message: string;
    }>
  >([]);

  // breakdowns
  const [breakdowns, setBreakdowns] = useState<BreakdownItem[]>([]);

  const breakdownTotal = useMemo(
    () =>
      breakdowns.reduce(
        (sum, b) => sum + (Number.isFinite(b.amount) ? Number(b.amount) : 0),
        0
      ),
    [breakdowns]
  );

  const getAvailableRepositories = useCallback(
    (currencyTicker: string) => {
      return repositories.filter((repo) =>
        repo.currencyTickers?.includes(currencyTicker)
      );
    },
    [repositories]
  );

  const setFormField = useCallback(
    (name: keyof OrderFormData, value: string | number | undefined) => {
      setForm((prev) => {
        const oldValue = prev[name];
        const newForm = {
          ...prev,
          [name]: value as any,
        };

        // Log state changes
        logger.stateChange(
          "OrderCreationContext",
          `form.${name}`,
          oldValue,
          value
        );

        // Detect rapid changes that might indicate a loop
        const recentChanges = logger
          .getComponentLogs("OrderCreationContext")
          .filter(
            (log) =>
              log.action === "state_change" &&
              log.state?.field === `form.${name}` &&
              Date.now() - (log.timestamp || 0) < 1000 // Last 1 second
          );

        if (recentChanges.length > 10) {
          logger.error(
            `Rapid state changes detected for form.${name} - possible infinite loop`,
            {
              component: "OrderCreationContext",
              field: name,
              recentChanges: recentChanges.length,
              oldValue,
              newValue: value,
            }
          );
        }

        return newForm;
      });
    },
    []
  );

  const addBreakdownItem = useCallback((item: Omit<BreakdownItem, "id">) => {
    const id = crypto.randomUUID();
    setBreakdowns((prev) => [...prev, { id, ...item }]);
  }, []);

  const updateBreakdownItem = useCallback(
    (id: string, update: Partial<BreakdownItem>) => {
      setBreakdowns((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...update } : b))
      );
    },
    []
  );

  const removeBreakdownItem = useCallback((id: string) => {
    setBreakdowns((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Quote validation (adapted from front implementation)
  const hasValidQuote = useCallback(() => {
    if (!quote) return false;

    // Basic validation - ensure all required fields exist
    const requiredFields = [
      "fxRate",
      "finalRate",
      "finalRateWithoutFees",
      "margin",
      "fee",
      "outboundSum",
    ];

    for (const field of requiredFields) {
      if (
        quote[field as keyof QuoteResult] === null ||
        quote[field as keyof QuoteResult] === undefined
      ) {
        return false;
      }
    }

    // Disallow trades with sum less than or equal to 0
    if (form.inboundSum <= 0 || quote.outboundSum <= 0) {
      return false;
    }

    return true;
  }, [quote, form.inboundSum]);

  // Quote state management
  const setBatchStatus = useCallback((batched: boolean) => {
    setQuoteState((prev) => ({ ...prev, isBatched: batched }));
  }, []);

  const setQuoteSource = useCallback((source: string) => {
    setQuoteState((prev) => ({ ...prev, quoteSource: source }));
  }, []);

  const toggleEditQuote = useCallback(() => {
    setQuoteState((prev) => ({
      ...prev,
      mode: prev.mode === "edit" ? "view" : "edit",
    }));
  }, []);

  const cancelQuoteEdit = useCallback(() => {
    setQuoteState((prev) => ({ ...prev, mode: "view" }));
  }, []);

  // Convex mutations
  const createOrgOrderMutation = useMutation(
    api.functions.orgOrders.createOrgOrder
  );
  const updateOrgOrderMutation = useMutation(
    api.functions.orgOrders.updateOrgOrder
  );

  const canProceedFromStep = useCallback(
    (step: StepIndex = currentStep) => {
      if (step === 0) {
        // Enable Next when both currencies are selected and inbound amount is above 0
        // Outbound amount will be calculated automatically by the currency calculator
        return (
          !!form.inboundTicker &&
          !!form.outboundTicker &&
          Number(form.inboundSum) > 0
        );
      }

      // For all steps beyond 0, require an order ID to exist
      if (!quoteState.orderId) {
        return false;
      }

      if (step === 1) {
        return !!customerId;
      }
      if (step === 2) {
        // Optional validation: total breakdown must be > 0
        return breakdowns.length === 0 || breakdownTotal >= 0;
      }
      return true;
    },
    [
      currentStep,
      form.inboundTicker,
      form.outboundTicker,
      form.inboundSum,
      quoteState.orderId,
      customerId,
      breakdowns.length,
      breakdownTotal,
    ]
  );

  const nextStep = useCallback(() => {
    setCurrentStep((s) => Math.min(3, s + 1) as StepIndex);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1) as StepIndex);
  }, []);

  const generateQuote = useCallback(async (): Promise<QuoteResult | null> => {
    try {
      setLoadingQuote(true);
      setError(null);
      setWarnings([]);

      // Minimal in-app quote calculation (UI already uses calculator hook)
      const inbound = Number(form.inboundSum) || 0;
      const outbound =
        Number(form.outboundSum) > 0 ? Number(form.outboundSum) : inbound;
      if (inbound <= 0) throw new Error("Invalid inbound amount");

      const fxRate = outbound / inbound;
      const serviceFeePct = 0.02;
      const margin = inbound * serviceFeePct;
      const fee = margin;
      const finalRate = fxRate;
      const finalRateWithoutFees = fxRate * (1 + serviceFeePct);

      const q: QuoteResult = {
        fxRate,
        finalRate,
        finalRateWithoutFees,
        rateWoFees: finalRateWithoutFees,
        margin,
        fee,
        networkFee: 0,
        outboundSum: outbound,
      };
      setQuote(q);
      setForm((prev) => ({ ...prev, outboundSum: q.outboundSum }));
      return q; // Return the generated quote
    } catch (e: any) {
      setError(e?.message || "Failed to generate quote");
      return null; // Return null on error
    } finally {
      setLoadingQuote(false);
    }
  }, [form]);

  // Submit quote (adapted from front implementation)
  const submitQuote = useCallback(
    async (quoteToSubmit?: QuoteResult | null): Promise<boolean> => {
      try {
        const effectiveQuote = quoteToSubmit || quote;
        if (!effectiveQuote) throw new Error("No quote to submit");

        setLoadingQuote(true);
        setError(null);

        // Create order in QUOTE state via Convex
        if (!activeSession?._id) {
          throw new Error(
            "No active session found. Please start a session to create orders."
          );
        }

        const resultId = await createOrgOrderMutation({
          inboundSum: String(form.inboundSum ?? 0),
          inboundTicker: form.inboundTicker,
          outboundSum: String(
            effectiveQuote.outboundSum ?? form.outboundSum ?? 0
          ),
          outboundTicker: form.outboundTicker,
          fxRate: effectiveQuote.fxRate,
          finalRate: effectiveQuote.finalRate,
          margin: effectiveQuote.margin,
          fee: effectiveQuote.fee,
          networkFee: effectiveQuote.networkFee,
          status: "QUOTE",
          orgSessionId: activeSession._id as any,
          clerkOrganizationId: orgId || undefined,
        });

        if (resultId) {
          setQuoteState((prev) => ({
            ...prev,
            orderId: resultId,
            mode: "view",
          }));
          return true;
        }
        return false;
      } catch (e: any) {
        setError(e?.message || "Failed to submit quote");
        return false;
      } finally {
        setLoadingQuote(false);
      }
    },
    [form, createOrgOrderMutation, activeSession, orgId, quote]
  );

  // Update existing quote
  const updateQuote = useCallback(async (): Promise<boolean> => {
    try {
      if (!quote || !quoteState.orderId)
        throw new Error("No quote or order ID to update");

      setLoadingQuote(true);
      setError(null);

      await updateOrgOrderMutation({
        orderId: quoteState.orderId as any,
        inboundSum: String(form.inboundSum ?? 0),
        outboundSum: String(quote.outboundSum ?? form.outboundSum ?? 0),
        fxRate: quote.fxRate,
        finalRate: quote.finalRate,
        margin: quote.margin,
        fee: quote.fee,
        networkFee: quote.networkFee,
        status: "QUOTE",
        orgCustomerId: customerId ? (customerId as any) : undefined,
      });

      setQuoteState((prev) => ({ ...prev, mode: "view" }));
      return true;
    } catch (e: any) {
      setError(e?.message || "Failed to update quote");
      return false;
    } finally {
      setLoadingQuote(false);
    }
  }, [quote, form, quoteState.orderId, updateOrgOrderMutation, customerId]);

  const createOrder = useCallback(async (): Promise<string | null> => {
    try {
      setCreating(true);
      setError(null);

      if (!quote) throw new Error("Please generate a quote first");
      if (!activeSession?._id) {
        throw new Error(
          "No active session found. Please start a session to create orders."
        );
      }

      const resultId = await createOrgOrderMutation({
        inboundSum: String(form.inboundSum ?? 0),
        inboundTicker: form.inboundTicker,
        outboundSum: String(quote.outboundSum ?? form.outboundSum ?? 0),
        outboundTicker: form.outboundTicker,
        fxRate: quote.fxRate,
        finalRate: quote.finalRate,
        margin: quote.margin,
        fee: quote.fee,
        networkFee: quote.networkFee,
        status: "ACCEPTED",
        orgSessionId: activeSession._id as any,
        orgCustomerId: (customerId as any) || undefined,
        clerkOrganizationId: orgId || undefined,
      });
      return resultId || null;
    } catch (e: any) {
      setError(e?.message || "Failed to create order");
      return null;
    } finally {
      setCreating(false);
    }
  }, [form, quote, customerId, createOrgOrderMutation]);

  const value = useMemo<OrderCreationContextValue>(
    () => ({
      currentStep,
      setCurrentStep,
      nextStep,
      prevStep,
      canProceedFromStep,
      repositories,
      currencies,
      getAvailableRepositories,
      form,
      setForm,
      setFormField,
      customerId,
      setCustomerId,
      quote,
      quoteState,
      loadingQuote,
      error,
      warnings,
      generateQuote,
      submitQuote,
      updateQuote,
      cancelQuoteEdit,
      toggleEditQuote,
      hasValidQuote,
      setBatchStatus,
      setQuoteSource,
      breakdowns,
      addBreakdownItem,
      updateBreakdownItem,
      removeBreakdownItem,
      breakdownTotal,
      creating,
      createOrder,
    }),
    [
      currentStep,
      canProceedFromStep,
      repositories,
      currencies,
      getAvailableRepositories,
      form,
      customerId,
      setCustomerId,
      quote,
      quoteState,
      loadingQuote,
      error,
      warnings,
      generateQuote,
      submitQuote,
      updateQuote,
      cancelQuoteEdit,
      toggleEditQuote,
      hasValidQuote,
      setBatchStatus,
      setQuoteSource,
      breakdowns,
      breakdownTotal,
      creating,
      createOrder,
    ]
  );

  return (
    <OrderCreationContext.Provider value={value}>
      {children}
    </OrderCreationContext.Provider>
  );
}
