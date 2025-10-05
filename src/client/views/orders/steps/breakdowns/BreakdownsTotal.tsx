"use client";

import React from "react";
import { Group } from "@mantine/core";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";

export function BreakdownsTotal() {
  const { breakdownTotal } = useOrderCreation();
  return (
    <Group justify="space-between">
      <div />
      <strong>
        Total:{" "}
        {breakdownTotal.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </strong>
    </Group>
  );
}






















