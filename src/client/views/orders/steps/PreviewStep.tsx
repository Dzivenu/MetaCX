"use client";

import React from "react";
import { Alert, Title, Stack, Grid } from "@mantine/core";
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

      {/* All three blocks inline in one row */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <QuoteBlock orderId={quoteState.orderId} mode="preview" showEditButton={true} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <CustomerBlock orderId={quoteState.orderId} mode="preview" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <BreakdownBlock orderId={quoteState.orderId} mode="preview" />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
