"use client";

import React from "react";
import { Title, Text, Stack, Card, Grid } from "@mantine/core";
import { useOrgOrderById } from "@/client/hooks/useOrgOrderByIdConvex";
import { useOrgCustomers } from "@/client/hooks/useOrgCustomersConvex";
import {
  CustomerBioCard,
  CustomerAddressCard,
  CustomerIdentificationCard,
} from "@/client/components/customers";

export function CustomerBlock({
  orderId,
  mode = "preview",
}: {
  orderId: string;
  mode?: "preview" | "edit";
}) {
  if (!orderId || orderId === "new") {
    return <div>No order</div>;
  }
  const { order, isLoading } = useOrgOrderById(orderId);
  const { orgCustomers } = useOrgCustomers(200);

  // Debug logging
  console.log("🔍 CustomerBlock Debug:", {
    orderId,
    isLoading,
    order,
    orgCustomerId: order?.orgCustomerId,
    customersLoaded: orgCustomers?.length,
  });

  if (isLoading) return <div>Loading customer…</div>;
  if (!order) return <div>No order</div>;

  const customer = orgCustomers.find((c) => c.id === order.orgCustomerId);

  console.log(
    "🔍 CustomerBlock - Found customer:",
    customer?.firstName,
    customer?.lastName
  );

  if (mode === "preview") {
    if (!customer) {
      console.log("❌ CustomerBlock - No customer found:", {
        order_orgCustomerId: order.orgCustomerId,
        message: order.orgCustomerId
          ? "Customer not found in list"
          : "No customer selected in order",
        availableCustomers: orgCustomers?.map((c) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
        })),
      });

      return (
        <Card withBorder>
          <Title order={4}>Customer</Title>
          <Text c="dimmed" size="sm">
            {order.orgCustomerId
              ? "Customer not found"
              : "No customer selected"}
          </Text>
          {/* Debug info */}
          <Text size="xs" c="red" mt="xs">
            Debug: Order.orgCustomerId = "{order.orgCustomerId || "undefined"}"
          </Text>
        </Card>
      );
    }

    return (
      <Stack gap="md">
        <Title order={3}>Customer Information</Title>
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <CustomerBioCard
              customer={customer}
              showTitle={false}
              onCustomerUpdate={(updatedCustomer) => {
                console.log("Customer updated in order view:", updatedCustomer);
                // The customer data will be refreshed automatically by the Convex query
              }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <CustomerAddressCard customer={customer} showTitle={false} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <CustomerIdentificationCard customer={customer} showTitle={false} />
          </Grid.Col>
        </Grid>
      </Stack>
    );
  }

  // Minimal edit placeholder
  return (
    <Card withBorder>
      <Title order={4}>Edit Customer</Title>
      <Text c="dimmed" size="sm">
        Implement customer attach/detach via Convex update.
      </Text>
    </Card>
  );
}
