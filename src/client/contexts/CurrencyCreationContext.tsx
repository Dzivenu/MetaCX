"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Denomination {
  value: number;
}

export interface Repository {
  id: string;
  name: string;
  typeOf?: string | null;
  currencyType?: string | null;
}

export interface Currency {
  id: string;
  name: string;
  ticker: string;
  symbol: string;
  type: string;
  network?: string;
  contract?: string;
  chainId?: string;
  rate?: number;
  rateApi?: string;
  rateApiIdentifier?: string;
  typeof?: string;
  api?: string;
  icon?: string;
}

interface CurrencyCreationContextType {
  currentStep: number;
  selectedCurrency: Currency | null;
  denominations: Denomination[];
  selectedRepositories: string[];
  setCurrentStep: (step: number) => void;
  setSelectedCurrency: (currency: Currency | null) => void;
  setDenominations: (denominations: Denomination[]) => void;
  setSelectedRepositories: (repositoryIds: string[]) => void;
  reset: () => void;
}

const CurrencyCreationContext = createContext<
  CurrencyCreationContextType | undefined
>(undefined);

interface CurrencyCreationProviderProps {
  children: ReactNode;
}

export function CurrencyCreationProvider({
  children,
}: CurrencyCreationProviderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
    null
  );
  const [denominations, setDenominations] = useState<Denomination[]>([]);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>(
    []
  );

  const reset = () => {
    setCurrentStep(0);
    setSelectedCurrency(null);
    setDenominations([]);
    setSelectedRepositories([]);
  };

  return (
    <CurrencyCreationContext.Provider
      value={{
        currentStep,
        selectedCurrency,
        denominations,
        selectedRepositories,
        setCurrentStep,
        setSelectedCurrency,
        setDenominations,
        setSelectedRepositories,
        reset,
      }}
    >
      {children}
    </CurrencyCreationContext.Provider>
  );
}

export function useCurrencyCreation() {
  const context = useContext(CurrencyCreationContext);
  if (context === undefined) {
    throw new Error(
      "useCurrencyCreation must be used within a CurrencyCreationProvider"
    );
  }
  return context;
}
