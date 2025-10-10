"use client";

import React, { useCallback, useRef } from "react";
import { QuoteForm, type QuoteFormData } from "@/client/components/forms";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";

export function QuoteEditPanel() {
  const { form, setFormField } = useOrderCreation();

  // Use a ref to track the last values we sent to avoid redundant updates
  const lastSentValuesRef = useRef<QuoteFormData | null>(null);

  const handleChange = useCallback(
    (data: QuoteFormData) => {
      // Only update if values actually changed from what we last sent
      const lastSent = lastSentValuesRef.current;

      if (
        lastSent &&
        lastSent.inboundTicker === data.inboundTicker &&
        lastSent.inboundSum === data.inboundSum &&
        lastSent.outboundTicker === data.outboundTicker &&
        lastSent.outboundSum === data.outboundSum
      ) {
        return; // No change, skip update
      }

      // Store the values we're about to send
      lastSentValuesRef.current = {
        inboundTicker: data.inboundTicker,
        inboundSum: data.inboundSum,
        outboundTicker: data.outboundTicker,
        outboundSum: data.outboundSum,
      };

      setFormField("inboundTicker", data.inboundTicker);
      setFormField("inboundSum", data.inboundSum);
      setFormField("outboundTicker", data.outboundTicker);
      setFormField("outboundSum", data.outboundSum);
    },
    [setFormField]
  );

  return (
    <QuoteForm
      initialData={{
        inboundTicker: form.inboundTicker,
        inboundSum: form.inboundSum,
        outboundTicker: form.outboundTicker,
        outboundSum: form.outboundSum,
      }}
      onChange={handleChange}
    />
  );
}

export default QuoteEditPanel;
