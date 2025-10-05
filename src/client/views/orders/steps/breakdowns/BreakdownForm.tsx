"use client";

import React, { useState } from "react";
import { Button, NumberInput, TextInput, Group } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";

export function BreakdownForm() {
  const { addBreakdownItem } = useOrderCreation();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState<number | string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!label.trim()) {
      return;
    }

    const numericAmount = Number(amount) || 0;

    addBreakdownItem({
      label: label.trim(),
      amount: numericAmount,
    });

    // Reset form
    setLabel("");
    setAmount("");
  };

  const canSubmit = label.trim().length > 0;

  return (
    <form onSubmit={handleSubmit}>
      <Group align="end" gap="md">
        <TextInput
          label="Label"
          placeholder="Enter breakdown label"
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
          style={{ flex: 1 }}
          required
        />
        <NumberInput
          label="Amount"
          placeholder="0.00"
          value={amount}
          onChange={setAmount}
          precision={2}
          step={0.01}
          min={0}
          style={{ minWidth: 120 }}
        />
        <Button
          type="submit"
          leftSection={<IconPlus size={16} />}
          disabled={!canSubmit}
        >
          Add
        </Button>
      </Group>
    </form>
  );
}

