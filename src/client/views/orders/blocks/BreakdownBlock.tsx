"use client";

import React from "react";
import { Card, Title, Table, Text, Stack, Group, Badge } from "@mantine/core";
import { IconArrowUp, IconArrowDown, IconCash } from "@tabler/icons-react";
import { useOrgBreakdowns } from "@/client/hooks/useOrgBreakdownsConvex";

export function BreakdownBlock({
  orderId,
  mode = "preview",
}: {
  orderId: string;
  mode?: "preview" | "edit";
}) {
  if (!orderId || orderId === "new") {
    return (
      <Card withBorder>
        <Title order={4}>Order Breakdowns</Title>
        <Text c="dimmed" size="sm">
          No breakdowns for new order.
        </Text>
      </Card>
    );
  }
  const { breakdowns, isLoading } = useOrgBreakdowns("org_orders", orderId);

  if (isLoading) return <div>Loading breakdowns…</div>;

  if (mode === "preview") {
    // Group breakdowns by direction
    const inboundBreakdowns = (breakdowns || []).filter(
      (b) => b.direction === "INBOUND"
    );
    const outboundBreakdowns = (breakdowns || []).filter(
      (b) => b.direction === "OUTBOUND"
    );

    const renderBreakdownGroup = (
      items: any[],
      direction: "INBOUND" | "OUTBOUND"
    ) => {
      if (items.length === 0) return null;

      const total = items.reduce((sum: number, b: any) => {
        return sum + (Number(b.count) || 0) * (Number(b.denominatedValue) || 0);
      }, 0);

      const icon =
        direction === "INBOUND" ? (
          <IconArrowDown size={16} color="green" />
        ) : (
          <IconArrowUp size={16} color="red" />
        );

      return (
        <Stack gap="sm">
          <Group gap="sm">
            {icon}
            <Title order={5}>{direction} Breakdown</Title>
            <Badge
              color={direction === "INBOUND" ? "green" : "red"}
              variant="light"
            >
              Total: {total.toLocaleString()}
            </Badge>
          </Group>

          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Denomination</Table.Th>
                <Table.Th>Count</Table.Th>
                <Table.Th>Subtotal</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((b: any) => {
                const subtotal =
                  (Number(b.count) || 0) * (Number(b.denominatedValue) || 0);
                return (
                  <Table.Tr key={b._id}>
                    <Table.Td>
                      <Group gap="xs">
                        <IconCash size={14} />
                        <Text size="sm">
                          {Number(b.denominatedValue || 0).toLocaleString()}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {Number(b.count || 0).toLocaleString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {subtotal.toLocaleString()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Stack>
      );
    };

    return (
      <Card withBorder>
        <Title order={4} mb="md">
          Order Breakdowns
        </Title>

        {!breakdowns || breakdowns.length === 0 ? (
          <Text c="dimmed" size="sm">
            No breakdowns have been created for this order yet.
          </Text>
        ) : (
          <Stack gap="lg">
            {renderBreakdownGroup(inboundBreakdowns, "INBOUND")}
            {renderBreakdownGroup(outboundBreakdowns, "OUTBOUND")}
          </Stack>
        )}
      </Card>
    );
  }

  // Edit mode could use the FloatBreakdownForm components
  return (
    <Card withBorder>
      <Title order={4}>Edit Breakdowns</Title>
      <Text c="dimmed" size="sm">
        Use the breakdown step to edit breakdowns for this order.
      </Text>
    </Card>
  );
}
