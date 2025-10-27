"use client";

import React, { useState, useCallback } from "react";
import {
  Title,
  Text,
  Stack,
  Card,
  Grid,
  Button,
  Group,
  Tabs,
} from "@mantine/core";
import { IconEdit, IconSearch, IconUserPlus } from "@tabler/icons-react";
import { useOrgOrderById } from "@/client/hooks/useOrgOrderByIdConvex";
import { useOrgCustomers } from "@/client/hooks/useOrgCustomersConvex";
import {
  CustomerBioCard,
  CustomerAddressCard,
  CustomerIdentificationCard,
  CustomerSearchTable,
} from "@/client/components/customers";
import {
  CustomerForm,
  type CustomerFormValues,
} from "@/client/components/customers/CustomerForm";
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
  // All hooks must be called at the top level
  const [isEditing, setIsEditing] = useState(false);
  const updateOrderMutation = useMutation(
    api.functions.orgOrders.updateOrgOrder
  );
  const createCustomerMutation = useMutation(
    api.functions.orgCustomers.createOrgCustomer
  );

  // Pass undefined to hooks if orderId is invalid to prevent hook errors
  const validOrderId = orderId && orderId !== "new" ? orderId : undefined;
  const { order, isLoading } = useOrgOrderById(validOrderId);
  const { orgCustomers, loading: customersLoading } = useOrgCustomers(200);

  // ALL useCallback hooks must be defined before any conditional returns
  const handleCustomerSelected = useCallback(
    async (customer: Customer) => {
      if (!order) return;
      try {
        await updateOrderMutation({
          orderId: order.id as Id<"org_orders">,
          orgCustomerId: customer.id as Id<"org_customers">,
        });
        setIsEditing(false);
      } catch (error) {
        console.error("❌ Error updating customer:", error);
      }
    },
    [updateOrderMutation, order]
  );

  const handleCreateCustomer = useCallback(
    async (values: CustomerFormValues) => {
      if (!order) return;
      try {
        // Create customer via Convex
        const customerId = await createCustomerMutation({
          firstName: values.firstName,
          lastName: values.lastName,
          title: values.title || undefined,
          middleName: values.middleName || undefined,
          dob: values.dob ? new Date(values.dob).getTime() : undefined,
          occupation: values.occupation || undefined,
          employer: values.employer || undefined,
          telephone: values.telephone || undefined,
          email: values.email || undefined,
          clerkOrganizationId: order.clerkOrganizationId,
        });

        // Attach the new customer to the order
        await updateOrderMutation({
          orderId: order.id as Id<"org_orders">,
          orgCustomerId: customerId as Id<"org_customers">,
        });

        setIsEditing(false);
      } catch (error) {
        console.error("❌ Error creating customer:", error);
        throw error;
      }
    },
    [createCustomerMutation, updateOrderMutation, order]
  );

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Early return after all hooks are called
  if (!validOrderId) {
    return <div>No order</div>;
  }

  if (isLoading) return <div>Loading customer…</div>;
  if (!order) return <div>No order</div>;

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

  const customer = orgCustomers.find((c) => c.id === order.orgCustomerId);

  // Show edit mode with customer search/create tabs
  if (isEditing) {
    return (
      <Stack gap="md">
        {/* Header with Cancel button - outside the card */}
        <Group justify="space-between" align="center">
          <Title order={3}>Select or Create Customer</Title>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </Group>

        <Card withBorder>
          <Tabs defaultValue="search">
            <Tabs.List>
              <Tabs.Tab value="search" leftSection={<IconSearch size={16} />}>
                Search Customer
              </Tabs.Tab>
              <Tabs.Tab value="create" leftSection={<IconUserPlus size={16} />}>
                Create Customer
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="search" pt="md">
              <Text size="sm" c="dimmed" mb="md">
                Search and select an existing customer for this order.
              </Text>
              <CustomerSearchTable
                customers={customers}
                loading={customersLoading}
                onCustomerSelected={handleCustomerSelected}
              />
            </Tabs.Panel>

            <Tabs.Panel value="create" pt="md">
              <Text size="sm" c="dimmed" mb="md">
                Create a new customer and attach them to this order.
              </Text>
              <CustomerForm
                onSubmit={handleCreateCustomer}
                submitLabel="Create & Attach Customer"
                showCancel={false}
              />
            </Tabs.Panel>
          </Tabs>
        </Card>
      </Stack>
    );
  }

  // Preview mode
  if (mode === "preview") {
    if (!customer) {
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
              onCustomerUpdate={() => {
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
