"use client";

import React from "react";
import { Paper, Text, Title } from "@mantine/core";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";

export function QuotePreviewCard() {
  const { form, quote } = useOrderCreation();
  return (
    <Paper p="md" withBorder>
      <Title order={4}>Quote</Title>
      <div className="mt-2 space-y-1 text-sm">
        <Text>
          Inbound: {form.inboundSum} {form.inboundTicker}
        </Text>
        <Text>
          Outbound: {form.outboundSum} {form.outboundTicker}
        </Text>
        {quote && (
          <>
            <Text>Exchange Rate: {quote.fxRate.toFixed(6)}</Text>
            <Text>Final Rate: {quote.finalRate.toFixed(6)}</Text>
            <Text>Fee: {quote.fee.toFixed(2)}</Text>
            <Text>Network Fee: {quote.networkFee.toFixed(6)}</Text>
            <Text>Margin: {quote.margin.toFixed(2)}</Text>
            <Text>Rate w/o Fees: {quote.finalRateWithoutFees.toFixed(6)}</Text>
          </>
        )}
      </div>
    </Paper>
  );
}






















