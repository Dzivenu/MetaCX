"use client";

import React, { useState } from "react";
import {
  Card,
  Text,
  NumberInput,
  Button,
  Group,
  Stack,
  Title,
  Table,
} from "@mantine/core";
import { Denomination } from "@/client/contexts/CurrencyCreationContext";

interface DenominationInputProps {
  denominations: Denomination[];
  onDenominationsChange: (denominations: Denomination[]) => void;
}

export const DenominationInput: React.FC<DenominationInputProps> = ({
  denominations,
  onDenominationsChange,
}) => {
  const [newDenomination, setNewDenomination] = useState<string | number>("");

  const addDenomination = () => {
    if (newDenomination !== "" && Number(newDenomination) > 0) {
      // Check if denomination already exists
      if (!denominations.some((d) => d.value === Number(newDenomination))) {
        const newDenom: Denomination = { value: Number(newDenomination) };
        onDenominationsChange([...denominations, newDenom]);
        setNewDenomination("");
      }
    }
  };

  const removeDenomination = (index: number) => {
    const newDenoms = [...denominations];
    newDenoms.splice(index, 1);
    onDenominationsChange(newDenoms);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      addDenomination();
    }
  };

  return (
    <Stack gap="md">
      <Title order={4}>Denominations</Title>
      <Text size="sm" c="dimmed">
        Add denominations for this currency (e.g., 1, 5, 10, 20).
      </Text>

      <Group>
        <NumberInput
          placeholder="Enter denomination value"
          value={newDenomination}
          onChange={(value) => setNewDenomination(value || "")}
          onKeyPress={handleKeyPress}
          min={0}
          decimalScale={2}
        />
        <Button type="button" onClick={addDenomination}>
          Add
        </Button>
      </Group>

      {denominations.length > 0 && (
        <Card withBorder>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Value</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {denominations.map((denom, index) => (
                <Table.Tr key={index}>
                  <Table.Td>{denom.value}</Table.Td>
                  <Table.Td>
                    <Button
                      variant="outline"
                      color="red"
                      size="xs"
                      onClick={() => removeDenomination(index)}
                    >
                      Remove
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {denominations.length === 0 && (
        <Text c="red" size="sm">
          At least one denomination must be added.
        </Text>
      )}
    </Stack>
  );
};
