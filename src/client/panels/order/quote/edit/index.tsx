"use client";

import React from "react";
import { QuoteForm, type QuoteFormData } from "@/client/components/forms";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";

export function QuoteEditPanel() {
  const { form, setFormField } = useOrderCreation();

  const handleChange = (data: QuoteFormData) => {
    setFormField("inboundTicker", data.inboundTicker);
    setFormField("inboundSum", data.inboundSum);
    setFormField("outboundTicker", data.outboundTicker);
    setFormField("outboundSum", data.outboundSum);
  };

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
