"use client";

import React, { useState } from "react";
import { Title, Stack, Alert } from "@mantine/core";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";
import { FloatBreakdownForm } from "@/client/views/orders/steps/breakdowns/FloatBreakdownForm";

export function BreakdownsStep() {
  const { form, quote } = useOrderCreation();
  const [inboundBreakdownValid, setInboundBreakdownValid] = useState(false);
  const [outboundBreakdownValid, setOutboundBreakdownValid] = useState(false);

  const inboundSum = Number(form.inboundSum) || 0;
  const outboundSum = Number(quote?.outboundSum || form.outboundSum) || 0;

  const handleInboundBreakdownChange = (
    breakdowns: any[],
    isValid: boolean
  ) => {
    setInboundBreakdownValid(isValid);
  };

  const handleOutboundBreakdownChange = (
    breakdowns: any[],
    isValid: boolean
  ) => {
    setOutboundBreakdownValid(isValid);
  };

  if (!form.inboundTicker || !form.outboundTicker) {
    return (
      <Alert color="orange" title="Missing Information">
        Please complete the quote step with inbound and outbound currencies
        before proceeding to breakdowns.
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      <Title order={3}>Currency Breakdown</Title>

      {/* Inbound Breakdown */}
      {inboundSum > 0 && (
        <FloatBreakdownForm
          direction="INBOUND"
          ticker={form.inboundTicker}
          targetSum={inboundSum}
          onBreakdownChange={handleInboundBreakdownChange}
        />
      )}

      {/* Outbound Breakdown */}
      {outboundSum > 0 && (
        <FloatBreakdownForm
          direction="OUTBOUND"
          ticker={form.outboundTicker}
          targetSum={outboundSum}
          onBreakdownChange={handleOutboundBreakdownChange}
        />
      )}
    </Stack>
  );
}
