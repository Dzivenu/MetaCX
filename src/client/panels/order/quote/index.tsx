"use client";

import React from "react";
import QuoteEditPanel from "./edit";
import QuoteViewPanel from "./view";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";
import { Group, Title, Button, Card } from "@mantine/core";

export function QuotePanel() {
  const {
    quoteState,
    toggleEditQuote,
    cancelQuoteEdit,
    generateQuote,
    submitQuote,
    updateQuote,
  } = useOrderCreation();

  const handleEditClick = async () => {
    if (quoteState.mode === "view") {
      toggleEditQuote();
      return;
    }

    // Save action from edit state: generate then submit/update
    const generated = await generateQuote();
    if (quoteState.orderId) {
      const ok = await updateQuote();
      if (ok) cancelQuoteEdit();
    } else {
      const ok = await submitQuote(generated);
      if (ok) cancelQuoteEdit();
    }
  };

  const isEditing = quoteState.mode !== "view";

  return (
    <Card withBorder>
      <Group justify="space-between" align="center" mb="md">
        <Title order={4}>Quote</Title>
        <Button size="xs" variant="light" onClick={handleEditClick}>
          {isEditing ? "Save" : "Edit"}
        </Button>
      </Group>

      {isEditing ? <QuoteEditPanel /> : <QuoteViewPanel />}
    </Card>
  );
}

export default QuotePanel;
