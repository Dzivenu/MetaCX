"use client";

import React, { useCallback, useState, useEffect } from "react";
import { Alert, Text, Title, Group, Button, Card } from "@mantine/core";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";
import { CustomerSearchTable } from "@/client/components/customers";
import { CustomerBlock } from "@/client/views/orders/blocks/CustomerBlock";
import { useOrgCustomers } from "@/client/hooks/useOrgCustomersConvex";
import type { Customer } from "@/client/api/customers";

export function CustomerStep() {
  const { customerId, setCustomerId, updateQuote, quoteState } =
    useOrderCreation();
  const { orgCustomers, loading, error } = useOrgCustomers(200);

  // Local state to track immediate selection before context updates
  const [localSelectedCustomerId, setLocalSelectedCustomerId] = useState<
    string | undefined
  >(customerId);

  // Sync local state when context state changes (e.g., when navigating back to this step)
  useEffect(() => {
    setLocalSelectedCustomerId(customerId);
  }, [customerId]);

  // Convert OrgCustomer to Customer for the table component
  const customers: Customer[] = (orgCustomers || []).map((c) => ({
    id: c.id,
    firstName: c.firstName || "",
    lastName: c.lastName || "",
    email: c.email || undefined,
    telephone: c.telephone || undefined,
    dob: c.dob || undefined,
    blacklisted: c.blacklisted || false,
    // Map other fields as needed
    organizationId: c.clerkOrgId || "",
    createdAt: c.createdAt || 0,
    updatedAt: c.updatedAt || 0,
  }));

  const handleCustomerSelected = useCallback(
    async (customer: Customer) => {
      console.log("🚀 CUSTOMER SELECTION TRIGGERED!", customer);
      console.log("🔍 CustomerStep - Customer selected:", {
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        orderId: quoteState.orderId,
      });

      // Set the customer ID immediately in local state for instant UI update
      setLocalSelectedCustomerId(customer.id);

      // Set the customer ID in the context
      setCustomerId(customer.id);

      // If we have an order ID, immediately save the customer to the database
      if (quoteState.orderId) {
        try {
          console.log(
            "🔍 CustomerStep - Calling updateQuote with customerId:",
            customer.id
          );
          const success = await updateQuote();
          console.log("🔍 CustomerStep - updateQuote result:", success);

          if (success) {
            console.log(
              "✅ Customer saved to order successfully:",
              customer.id
            );
            // Small delay to allow Convex to propagate the update
            await new Promise((resolve) => setTimeout(resolve, 100));
          } else {
            console.error("❌ Failed to save customer to order");
          }
        } catch (error) {
          console.error("❌ Error saving customer:", error);
        }
      } else {
        console.log(
          "⚠️ No order ID available, customer will be saved when order is created"
        );
      }
    },
    [setCustomerId, updateQuote, quoteState.orderId]
  );

  const handleClearCustomer = useCallback(async () => {
    // Clear local state immediately for instant UI update
    setLocalSelectedCustomerId(undefined);
    setCustomerId(undefined);

    // If we have an order ID, save the removal to the database
    if (quoteState.orderId) {
      try {
        const success = await updateQuote();
        if (success) {
          console.log("Customer removed from order");
        }
      } catch (error) {
        console.error("Error removing customer:", error);
      }
    }
  }, [setCustomerId, updateQuote, quoteState.orderId]);

  // Show error if any
  if (error) {
    return (
      <Alert color="red" title="Error">
        {error}
      </Alert>
    );
  }

  // Use local state for immediate UI updates, fallback to context state
  const effectiveCustomerId = localSelectedCustomerId || customerId;

  // If no customer is selected, show the edit/search view
  if (!effectiveCustomerId) {
    return (
      <div className="space-y-4">
        <Title order={3}>Select Customer</Title>
        <Text size="sm" c="dimmed" mb="md">
          Search and select a customer for this order. You can continue without
          selecting a customer and link later.
        </Text>

        <CustomerSearchTable
          customers={customers}
          loading={loading}
          onCustomerSelected={handleCustomerSelected}
        />
      </div>
    );
  }

  // If customer is selected, show the preview view with edit option
  return (
    <div className="space-y-4">
      <Group justify="space-between" align="center">
        <Title order={3}>Customer Details</Title>
        <Button variant="light" size="sm" onClick={handleClearCustomer}>
          Change Customer
        </Button>
      </Group>

      {quoteState.orderId ? (
        <CustomerBlock orderId={quoteState.orderId} mode="preview" />
      ) : (
        <Card withBorder>
          <Title order={4}>Customer</Title>
          <Text c="dimmed" size="sm">
            Customer will be saved when the order is created.
          </Text>
        </Card>
      )}

      <Text size="sm" c="dimmed">
        Customer has been selected and will be associated with this order.
      </Text>
    </div>
  );
}
