"use client";

import React from "react";
import { ActionIcon, NumberInput, Table, TextInput } from "@mantine/core";
import { IconMinus } from "@tabler/icons-react";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";

export function BreakdownsTable() {
  const { breakdowns, updateBreakdownItem, removeBreakdownItem } =
    useOrderCreation();

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Label</Table.Th>
          <Table.Th>Amount</Table.Th>
          <Table.Th style={{ width: 80 }}></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {breakdowns.map((b) => (
          <Table.Tr key={b.id}>
            <Table.Td>
              <TextInput
                value={b.label}
                onChange={(e) =>
                  updateBreakdownItem(b.id, { label: e.currentTarget.value })
                }
              />
            </Table.Td>
            <Table.Td>
              <NumberInput
                value={b.amount}
                onChange={(v) =>
                  updateBreakdownItem(b.id, { amount: Number(v) || 0 })
                }
                precision={2}
                step={0.01}
                min={0}
              />
            </Table.Td>
            <Table.Td>
              <ActionIcon
                color="red"
                variant="light"
                onClick={() => removeBreakdownItem(b.id)}
              >
                <IconMinus size={18} />
              </ActionIcon>
            </Table.Td>
          </Table.Tr>
        ))}
        {breakdowns.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={3}>No breakdowns added yet</Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}






















