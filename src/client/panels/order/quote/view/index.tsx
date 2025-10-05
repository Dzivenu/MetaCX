"use client";

import React from "react";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";
import { QuoteBlock } from "@/client/views/orders/blocks/QuoteBlock";

export function QuoteViewPanel() {
  const { quoteState } = useOrderCreation();

  if (!quoteState.orderId) {
    return null;
  }

  return <QuoteBlock orderId={quoteState.orderId} mode="preview" />;
}

export default QuoteViewPanel;
