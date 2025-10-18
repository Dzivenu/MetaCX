"use client";

import React, { useState, useCallback } from "react";
import { Title, Text, Stack, Card, Grid, Button, Group } from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";
import { useOrgOrderById } from "@/client/hooks/useOrgOrderByIdConvex";
import { useOrgCustomers } from "@/client/hooks/useOrgCustomersConvex";
import {
  CustomerBioCard,
  CustomerAddressCard,
  CustomerIdentificationCard,
  CustomerSearchTable,
} from "@/client/components/customers";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type { Customer } from "@/client/api/customers";

export function CustomerBlock({
  orderId,
  mode = "preview",
}: {
  orderId: string;
  mode?: "preview" | "edit";
}) {
  const [isEditing, setIsEditing] = useState(false);
  const updateOrderMutation = useMutation(
    api.functions.orgOrders.updateOrgOrder
  );

  if (!orderId || orderId === "new") {
    return <div>No order</div>;
  }
  const { order, isLoading } = useOrgOrderById(orderId);
  const { orgCustomers, loading: customersLoading } = useOrgCustomers(200);

  // Debug logging
  console.log("🔍 CustomerBlock Debug:", {
    orderId,
    isLoading,
    order,
    orgCustomerId: order?.orgCustomerId,
    customersLoaded: orgCustomers?.length,
  });

  // Convert OrgCustomer to Customer for the table component
  const customers: Customer[] = (orgCustomers || []).map((c) => ({
    id: c.id,
    firstName: c.firstName || "",
    lastName: c.lastName || "",
    email: c.email || undefined,
    telephone: c.telephone || undefined,
    dob: c.dob ? new Date(c.dob).toISOString().split("T")[0] : undefined,
    blacklisted: c.blacklisted || false,
    organizationId: c.clerkOrganizationId || "",
    createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
    updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
  }));

  const handleCustomerSelected = useCallback(
    async (customer: Customer) => {
      console.log("🔍 CustomerBlock - Customer selected:", customer.id);
      try {
        await updateOrderMutation({
          orderId: order!.id as Id<"org_orders">,
          orgCustomerId: customer.id as Id<"org_customers">,
        });
        setIsEditing(false);
        console.log("✅ Customer updated successfully");
      } catch (error) {
        console.error("❌ Error updating customer:", error);
      }
    },
    [updateOrderMutation, order]
  );

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isLoading) return <div>Loading customer…</div>;
  if (!order) return <div>No order</div>;

  const customer = orgCustomers.find((c) => c.id === order.orgCustomerId);

  console.log(
    "🔍 CustomerBlock - Found customer:",
    customer?.firstName,
    customer?.lastName
  );

  // Show edit mode with customer search
  if (isEditing) {
    return (
      <Stack gap="md">
        {/* Header with Cancel button - outside the card */}
        <Group justify="space-between" align="center">
          <Title order={3}>Select Customer</Title>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </Group>

        <Card withBorder>
          <Text size="sm" c="dimmed" mb="md">
            Search and select a customer for this order.
          </Text>
          <CustomerSearchTable
            customers={customers}
            loading={customersLoading}
            onCustomerSelected={handleCustomerSelected}
          />
        </Card>
      </Stack>
    );
  }

  // Preview mode
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
        <Stack gap="md">
          {/* Header with Edit button - outside the card */}
          <Group justify="space-between" align="center">
            <Title order={3}>Customer Information</Title>
            <Button
              leftSection={<IconEdit size={16} />}
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          </Group>

          <Card withBorder>
            <Text c="dimmed" size="sm">
              {order.orgCustomerId
                ? "Customer not found"
                : "No customer selected"}
            </Text>
            {/* Debug info */}
            <Text size="xs" c="red" mt="xs">
              Debug: Order.orgCustomerId = "{order.orgCustomerId || "undefined"}
              "
            </Text>
          </Card>
        </Stack>
      );
    }

    return (
      <Stack gap="md">
        {/* Header with Edit button - outside the card */}
        <Group justify="space-between" align="center">
          <Title order={3}>Customer Information</Title>
          <Button
            leftSection={<IconEdit size={16} />}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        </Group>

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

  // Fallback for other modes
  return (
    <Card withBorder>
      <Title order={4}>Edit Customer</Title>
      <Text c="dimmed" size="sm">
        Implement customer attach/detach via Convex update.
      </Text>
    </Card>
  );
}
