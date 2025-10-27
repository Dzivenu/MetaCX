"use client";

import React from "react";
import { Container, Group, Title, Button, Stack } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { OrderProvider } from "@/client/providers/order-provider";
import { QuoteBlock } from "@/client/views/orders/blocks/QuoteBlock";
import { CustomerBlock } from "@/client/views/orders/blocks/CustomerBlock";
import { BreakdownBlock } from "@/client/views/orders/blocks/BreakdownBlock";
import { OrderNotesBlock } from "@/client/views/orders/blocks/NotesBlock";
import { useShortId } from "@/client/hooks/useShortId";

interface OrderDetailViewProps {
  orderId: string;
}

export function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const router = useRouter();
  const shortOrderId = useShortId(orderId, 8, "#");

  const handleBack = () => {
    router.push("/portal/orders");
  };

  return (
    <OrderProvider initialOrderId={orderId}>
      <Container size="xl" py="xl">
        {/* Header */}
        <Group justify="space-between" align="center" mb="xl">
          <Title order={1}>Order {shortOrderId || orderId}</Title>
          <Button
            variant="outline"
            leftSection={<IconArrowLeft size={16} />}
            onClick={handleBack}
          >
            Back to Orders
          </Button>
        </Group>

        {/* Order Details - Full width sections stacked vertically */}
        <Stack gap="lg">
          {/* Quote - Full width */}
          <QuoteBlock orderId={orderId} mode="preview" />

          {/* Customer - Full width */}
          <CustomerBlock orderId={orderId} mode="preview" />

          {/* Breakdown - Full width */}
          <BreakdownBlock orderId={orderId} mode="preview" />

          {/* Notes - Full width */}
          <OrderNotesBlock orderId={orderId} />
        </Stack>
      </Container>
    </OrderProvider>
  );
}
