"use client";
import React, { createContext, useContext, useMemo, useState } from "react";

interface OrderContextValue {
  orderId?: string;
  setOrderId: (id?: string) => void;
  currentStep: number;
  setCurrentStep: (s: number) => void;
}

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

export const useOrderContext = () => {
  const ctx = useContext(OrderContext);
  if (!ctx)
    throw new Error("useOrderContext must be used within OrderProvider");
  return ctx;
};

export const OrderProvider = ({
  children,
  initialOrderId,
}: {
  children: React.ReactNode;
  initialOrderId?: string;
}) => {
  const [orderId, setOrderId] = useState<string | undefined>(initialOrderId);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const value = useMemo(
    () => ({ orderId, setOrderId, currentStep, setCurrentStep }),
    [orderId, currentStep]
  );

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};
