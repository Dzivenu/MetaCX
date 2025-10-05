"use client";

import React from "react";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";
import QuotePanel from "@/client/panels/order/quote";

export function QuoteStep() {
  // Use the shared QuotePanel which renders edit/view based on context
  return <QuotePanel />;
}
