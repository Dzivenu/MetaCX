"use client";

import React, { useState } from "react";
import {
  Card,
  Title,
  Table,
  Text,
  Stack,
  Group,
  Badge,
  Button,
  Grid,
} from "@mantine/core";
import {
  IconArrowUp,
  IconArrowDown,
  IconCash,
  IconEdit,
  IconX,
} from "@tabler/icons-react";
import { useOrgBreakdowns } from "@/client/hooks/useOrgBreakdownsConvex";
import { FloatBreakdownForm } from "@/client/views/orders/steps/breakdowns/FloatBreakdownForm";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

export function BreakdownBlock({
  orderId,
  mode = "preview",
}: {
  orderId: string;
  mode?: "preview" | "edit";
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inboundCompleted, setInboundCompleted] = useState(false);
  const [outboundCompleted, setOutboundCompleted] = useState(false);

  // Fetch order data to get inbound/outbound information - must call hooks before conditional returns
  const order = useQuery(
    api.functions.orgOrders.getOrgOrderById,
    orderId && orderId !== "new" ? { orderId: orderId as any } : "skip"
  );
  const { breakdowns, isLoading } = useOrgBreakdowns("org_orders", orderId);

  // Auto-close edit mode when both breakdowns are completed
  React.useEffect(() => {
    if (!isEditing || !order) return;

    const inboundSum = Number(order.inboundSum) || 0;
    const outboundSum = Number(order.outboundSum) || 0;
    const hasInbound = inboundSum > 0 && order.inboundTicker;
    const hasOutbound = outboundSum > 0 && order.outboundTicker;

    // Determine if all required breakdowns are completed
    const allCompleted =
      (hasInbound ? inboundCompleted : true) &&
      (hasOutbound ? outboundCompleted : true);

    if (allCompleted && (inboundCompleted || outboundCompleted)) {
      // Small delay to show success message before closing
      const timer = setTimeout(() => {
        setIsEditing(false);
        // Reset completion states for next edit
        setInboundCompleted(false);
        setOutboundCompleted(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [inboundCompleted, outboundCompleted, isEditing, order]);

  // Early return after hooks are called
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

  if (isLoading || !order) return <div>Loading breakdowns…</div>;

  // Handlers for breakdown completion
  const handleInboundComplete = (breakdowns: any[], isValid: boolean) => {
    if (isValid) {
      setInboundCompleted(true);
    }
  };

  const handleOutboundComplete = (breakdowns: any[], isValid: boolean) => {
    if (isValid) {
      setOutboundCompleted(true);
    }
  };

  // Show edit mode with breakdown forms
  if (isEditing) {
    const inboundSum = Number(order.inboundSum) || 0;
    const outboundSum = Number(order.outboundSum) || 0;

    return (
      <Stack gap="md">
        {/* Header with Cancel button - outside the card */}
        <Group justify="space-between" align="center">
          <Title order={3}>Edit Order Breakdowns</Title>
          <Button
            variant="outline"
            leftSection={<IconX size={16} />}
            onClick={() => {
              setIsEditing(false);
              setInboundCompleted(false);
              setOutboundCompleted(false);
            }}
          >
            Cancel
          </Button>
        </Group>

        <Card withBorder>
          <Stack gap="lg">
            {/* Inbound Breakdown Form */}
            {inboundSum > 0 && order.inboundTicker && (
              <FloatBreakdownForm
                direction="INBOUND"
                ticker={order.inboundTicker}
                targetSum={inboundSum}
                orderId={orderId}
                onBreakdownChange={handleInboundComplete}
              />
            )}

            {/* Outbound Breakdown Form */}
            {outboundSum > 0 && order.outboundTicker && (
              <FloatBreakdownForm
                direction="OUTBOUND"
                ticker={order.outboundTicker}
                targetSum={outboundSum}
                orderId={orderId}
                onBreakdownChange={handleOutboundComplete}
              />
            )}
          </Stack>
        </Card>
      </Stack>
    );
  }

  // Preview mode - show existing breakdowns
  // Group breakdowns by direction
  const inboundBreakdowns = (breakdowns || []).filter(
    (b) => b.direction === "INBOUND"
  );
  const outboundBreakdowns = (breakdowns || []).filter(
    (b) => b.direction === "OUTBOUND"
  );

  const renderBreakdownGroup = (
    items: any[],
    direction: "INBOUND" | "OUTBOUND",
    showEmpty: boolean = false
  ) => {
    const icon =
      direction === "INBOUND" ? (
        <IconArrowDown size={16} color="green" />
      ) : (
        <IconArrowUp size={16} color="red" />
      );

    if (items.length === 0) {
      if (!showEmpty) return null;
      return (
        <Stack gap="sm">
          <Group gap="sm">
            {icon}
            <Title order={5}>{direction} Breakdown</Title>
          </Group>
          <Text c="dimmed" size="sm">
            No {direction.toLowerCase()} breakdowns created yet.
          </Text>
        </Stack>
      );
    }

    const total = items.reduce((sum: number, b: any) => {
      return sum + (Number(b.count) || 0) * (Number(b.denominatedValue) || 0);
    }, 0);

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

  // Check if we have both inbound and outbound breakdowns
  const hasInbound = inboundBreakdowns.length > 0;
  const hasOutbound = outboundBreakdowns.length > 0;
  const hasAny = hasInbound || hasOutbound;

  return (
    <Stack gap="md">
      {/* Header with Edit button - outside the card */}
      <Group justify="space-between" align="center">
        <Title order={3}>Order Breakdowns</Title>
        <Button
          leftSection={<IconEdit size={16} />}
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
      </Group>

      <Card withBorder>
        {!breakdowns || breakdowns.length === 0 ? (
          <Text c="dimmed" size="sm">
            No breakdowns have been created for this order yet.
          </Text>
        ) : (
          // Always show side by side layout when breakdowns exist
          <Grid>
            <Grid.Col span={6}>
              {renderBreakdownGroup(inboundBreakdowns, "INBOUND", true)}
            </Grid.Col>
            <Grid.Col span={6}>
              {renderBreakdownGroup(outboundBreakdowns, "OUTBOUND", true)}
            </Grid.Col>
          </Grid>
        )}
      </Card>
    </Stack>
  );
}
