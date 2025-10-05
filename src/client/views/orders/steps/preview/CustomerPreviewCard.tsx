"use client";

import React from "react";
import { Paper, Text, Title } from "@mantine/core";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";

export function CustomerPreviewCard() {
  const { customerId } = useOrderCreation();
  return (
    <Paper p="md" withBorder>
      <Title order={4}>Customer</Title>
      <div className="mt-2 text-sm">
        <Text>Customer ID: {customerId || "—"}</Text>
      </div>
    </Paper>
  );
}






















