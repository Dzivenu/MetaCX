"use client";

import React from "react";
import { Paper, Table, Title } from "@mantine/core";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";

export function BreakdownsPreviewCard() {
  const { breakdowns, breakdownTotal } = useOrderCreation();
  return (
    <Paper p="md" withBorder>
      <Title order={4}>Breakdowns</Title>
      <Table striped highlightOnHover mt="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Label</Table.Th>
            <Table.Th>Amount</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {breakdowns.map((b) => (
            <Table.Tr key={b.id}>
              <Table.Td>{b.label}</Table.Td>
              <Table.Td>
                {b.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Table.Td>
            </Table.Tr>
          ))}
          {breakdowns.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={2}>No breakdowns</Table.Td>
            </Table.Tr>
          )}
          <Table.Tr>
            <Table.Td>
              <strong>Total</strong>
            </Table.Td>
            <Table.Td>
              <strong>
                {breakdownTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Paper>
  );
}






















