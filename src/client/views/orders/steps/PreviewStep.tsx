"use client";

import React from "react";
import { Alert, Title, Stack } from "@mantine/core";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";
import { QuoteBlock } from "@/client/views/orders/blocks/QuoteBlock";
import { CustomerBlock } from "@/client/views/orders/blocks/CustomerBlock";
import { BreakdownBlock } from "@/client/views/orders/blocks/BreakdownBlock";

export function PreviewStep() {
  const { quoteState } = useOrderCreation();

  if (!quoteState.orderId) {
    return (
      <Alert color="red" title="No Order">
        Order ID is required to show the preview. Please complete the quote step
        first.
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      <Title order={2}>Order Summary</Title>

      {/* Quote - Full width */}
      <QuoteBlock orderId={quoteState.orderId} mode="preview" />

      {/* Customer - Full width */}
      <CustomerBlock orderId={quoteState.orderId} mode="preview" />

      {/* Breakdown - Full width */}
      <BreakdownBlock orderId={quoteState.orderId} mode="preview" />
    </Stack>
  );
}
