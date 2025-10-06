"use client";

import React, { useState } from "react";
import {
  Card,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Divider,
  Grid,
  Box,
  ThemeIcon,
  Button,
} from "@mantine/core";
import {
  IconArrowRight,
  IconTrendingUp,
  IconCalculator,
  IconCoins,
  IconPercentage,
  IconReceipt,
  IconCash,
  IconEdit,
  IconArrowDown,
  IconArrowUp,
} from "@tabler/icons-react";
import { useOrgOrderById } from "@/client/hooks/useOrgOrderByIdConvex";
import QuotePanel from "@/client/panels/order/quote";
import { OrderCreationProvider } from "@/client/contexts/OrderCreationContext";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { QuoteForm, type QuoteFormData } from "@/client/components/forms";

// Helper component for displaying quote metrics with icons
interface QuoteItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}

function QuoteItem({ icon, label, value, color = "gray" }: QuoteItemProps) {
  return (
    <Group gap="xs" align="center">
      <ThemeIcon size="sm" variant="light" color={color}>
        {icon}
      </ThemeIcon>
      <Text size="sm" fw={500}>
        {label}:
      </Text>
      <Text size="sm" c="dimmed">
        {value}
      </Text>
    </Group>
  );
}

// Currency display component matching front app design
interface CurrencyDisplayProps {
  label: string;
  amount: string | number;
  ticker: string;
  icon: React.ReactNode;
  color: string;
}

function CurrencyDisplay({
  label,
  amount,
  ticker,
  icon,
  color,
}: CurrencyDisplayProps) {
  return (
    <Box ta="center">
      <Group gap="xs" justify="center" mb="xs">
        {icon}
        <Text size="sm" fw={600} c="dimmed" tt="uppercase">
          {label}
        </Text>
      </Group>
      <Group gap="md" justify="center" align="center">
        <ThemeIcon size="lg" variant="light" color={color}>
          <IconCoins size={20} />
        </ThemeIcon>
        <Box>
          <Text fw={700} size="lg">
            {ticker}{" "}
            {typeof amount === "number" ? amount.toLocaleString() : amount}
          </Text>
        </Box>
      </Group>
    </Box>
  );
}

export function QuoteBlock({
  orderId,
  mode = "preview",
  onEdit,
  showEditButton = true,
}: {
  orderId: string;
  mode?: "preview" | "edit";
  onEdit?: () => void;
  showEditButton?: boolean;
}) {
  // Guard: in creation flows callers may pass "new" or an empty id; render QuotePanel (edit) instead
  if (!orderId || orderId === "new") {
    return (
      <OrderCreationProvider>
        <QuotePanel />
      </OrderCreationProvider>
    );
  }
  const { order, isLoading } = useOrgOrderById(orderId);
  const [isEditing, setIsEditing] = useState(false);
  const updateOrderMutation = useMutation(
    api.functions.orgOrders.updateOrgOrder
  );

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      // Default behavior: toggle to edit mode within the same component
      setIsEditing(true);
    }
  };

  const [quoteData, setQuoteData] = useState<QuoteFormData>({
    inboundTicker: order?.inboundTicker || "CAD",
    inboundSum: Number(order?.inboundSum) || 0,
    outboundTicker: order?.outboundTicker || "BTC",
    outboundSum: Number(order?.outboundSum) || 0,
    margin: Number(order?.margin) || 0,
    fee: Number(order?.fee) || 0,
    networkFee: Number(order?.networkFee) || 0,
    finalRate: Number(order?.finalRate) || 0,
  });

  const handleQuoteChange = (data: QuoteFormData) => {
    setQuoteData(data);
  };

  const handleSave = async () => {
    if (!order) return;

    try {
      await updateOrderMutation({
        orderId: order.id as Id<"org_orders">,
        inboundSum: quoteData.inboundSum.toString(),
        outboundSum: quoteData.outboundSum.toString(),
        margin: quoteData.margin || 0,
        fee: quoteData.fee || 0,
        networkFee: quoteData.networkFee || 0,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save quote:", error);
      // Handle error display here if needed
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isLoading) return <div>Loading quote…</div>;
  if (!order) return <div>No order</div>;

  if (mode === "preview") {
    // If we're editing, show the edit form instead
    if (isEditing) {
      return (
        <Stack>
          <Text size="lg" fw={600}>Edit Quote</Text>
          <QuoteForm
            initialData={quoteData}
            onChange={handleQuoteChange}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Quote
            </Button>
          </Group>
        </Stack>
      );
    }

    // Calculate derived values
    const inboundAmount = Number(order.inboundSum) || 0;
    const outboundAmount = Number(order.outboundSum) || 0;
    const fxRate = Number(order.fxRate) || 0;
    const finalRate = Number(order.finalRate) || 0;
    const fee = Number(order.fee) || 0;
    const networkFee = Number(order.networkFee) || 0;
    const margin = Number(order.margin) || 0;

    const totalFees = fee + networkFee;
    const inverseFinalRate = finalRate > 0 ? 1 / finalRate : 0;

    return (
      <Card withBorder p="lg">
        {/* Main quote display - matching front app design */}
        <Box mb="xl">
          <Group justify="center" align="center" gap="xl">
            {/* Inbound Currency */}
            <CurrencyDisplay
              label="Inbound"
              amount={inboundAmount}
              ticker={order.inboundTicker || "CAD"}
              icon={<IconArrowDown size={16} />}
              color="green"
            />

            {/* Arrow */}
            <ThemeIcon size="lg" variant="light" color="blue">
              <IconArrowRight size={20} />
            </ThemeIcon>

            {/* Outbound Currency */}
            <CurrencyDisplay
              label="Outbound"
              amount={outboundAmount}
              ticker={order.outboundTicker || "BTC"}
              icon={<IconArrowUp size={16} />}
              color="orange"
            />
          </Group>
        </Box>

        <Divider mb="lg" />

        {/* Quote details in two columns like front app */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Title order={6} mb="md" c="dimmed">
              Rate Information
            </Title>
            <Stack gap="sm">
              <QuoteItem
                icon={<IconTrendingUp size={16} />}
                label="Final Rate"
                value={finalRate.toFixed(6)}
                color="blue"
              />
              <QuoteItem
                icon={<IconTrendingUp size={16} />}
                label="Inverse Final Rate"
                value={inverseFinalRate.toFixed(6)}
                color="indigo"
              />
              <QuoteItem
                icon={<IconCalculator size={16} />}
                label="Inverse Rate (No Fees)"
                value={inverseFinalRateWithoutFees.toFixed(6)}
                color="cyan"
              />
              <QuoteItem
                icon={<IconPercentage size={16} />}
                label="Margin"
                value={`${margin.toFixed(2)}%`}
                color="grape"
              />
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Title order={6} mb="md" c="dimmed">
              Fee Breakdown
            </Title>
            <Stack gap="sm">
              <QuoteItem
                icon={<IconCoins size={16} />}
                label="Service Fee"
                value={`$${fee.toFixed(2)}`}
                color="yellow"
              />
              <QuoteItem
                icon={<IconReceipt size={16} />}
                label="Network Fee"
                value={`$${networkFee.toFixed(2)}`}
                color="orange"
              />
              <QuoteItem
                icon={<IconCash size={16} />}
                label="Total Fees"
                value={`$${totalFees.toFixed(2)}`}
                color="red"
              />
              {fxRate > 0 && (
                <QuoteItem
                  icon={<IconPercentage size={16} />}
                  label="FX Rate"
                  value={fxRate.toFixed(6)}
                  color="violet"
                />
              )}
            </Stack>
          </Grid.Col>
        </Grid>

        {/* Status and metadata */}
        <Divider my="lg" />
        <Group justify="space-between" align="center">
          <Badge color="blue" variant="light">
            {order.status || "DRAFT"}
          </Badge>
          <Text size="xs" c="dimmed">
            Updated:{" "}
            {order.updatedAt
              ? new Date(order.updatedAt).toLocaleString()
              : "N/A"}
          </Text>
        </Group>
      </Card>
    );
  }

  // Minimal edit view placeholder
  return (
    <Card withBorder>
      <Title order={4}>Edit Quote</Title>
      <Text c="dimmed" size="sm">
        Editing via Convex mutations can be added here.
      </Text>
    </Card>
  );
}
