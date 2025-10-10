"use client";

import React, { useState } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  TextInput,
  ActionIcon,
  Loader,
  Table,
  Badge,
  Paper,
  Stack,
  Grid,
  Card,
  Divider,
  Tooltip,
  Select,
} from "@mantine/core";
import { IconPlus, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { useCustomers } from "@/client/hooks/useCustomers";
import { CustomerSearchTable } from "@/client/components/customers";
import { useRouter } from "next/navigation";

export default function PortalCustomersPage() {
  const { customers, loading, error } = useCustomers();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>("all");

  // Check if there's an organization error (no active organization)
  const hasOrgError = error?.includes("No active organization");

  // Filter customers based on search and status
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      searchQuery === "" ||
      `${customer.firstName} ${customer.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.telephone?.includes(searchQuery);

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "blacklisted" && customer.blacklisted) ||
      (filterStatus === "active" && !customer.blacklisted);

    return matchesSearch && matchesFilter;
  });

  const customerStats = {
    total: customers.length,
    active: customers.filter((c) => !c.blacklisted).length,
    blacklisted: customers.filter((c) => c.blacklisted).length,
  };

  return (
    <Container size="xl" py="xl">
      {/* Header Section */}
      <Stack gap="lg">
        <div>
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={1} mb="xs">
                Customer Management
              </Title>
              <Text c="dimmed" size="sm">
                Manage your organization's customers and their information
              </Text>
            </div>
            <Group gap="sm">
              <Button
                component={Link}
                href="/portal/customers/create"
                leftSection={<IconPlus size={16} />}
                disabled={hasOrgError}
                title={
                  hasOrgError
                    ? "Please create or select an organization first"
                    : undefined
                }
              >
                Add Customer
              </Button>
            </Group>
          </Group>
        </div>

        {/* Stats Cards - Compact Inline */}
        <Group gap="md" grow>
          <Card withBorder p="md">
            <Group gap="sm" wrap="nowrap">
              <IconUser size={24} color="var(--mantine-color-blue-6)" />
              <div style={{ flex: 1 }}>
                <Group gap="xs" align="baseline" wrap="nowrap">
                  <Text size="sm" fw={600} c="dimmed">
                    Total Customers:
                  </Text>
                  <Text fw={700} size="xl">
                    {customerStats.total}
                  </Text>
                </Group>
              </div>
            </Group>
          </Card>
          <Card withBorder p="md">
            <Group gap="sm" wrap="nowrap">
              <IconUser size={24} color="var(--mantine-color-green-6)" />
              <div style={{ flex: 1 }}>
                <Group gap="xs" align="baseline" wrap="nowrap">
                  <Text size="sm" fw={600} c="dimmed">
                    Active Customers:
                  </Text>
                  <Text fw={700} size="xl" c="green">
                    {customerStats.active}
                  </Text>
                </Group>
              </div>
            </Group>
          </Card>
          <Card withBorder p="md">
            <Group gap="sm" wrap="nowrap">
              <IconUser size={24} color="var(--mantine-color-red-6)" />
              <div style={{ flex: 1 }}>
                <Group gap="xs" align="baseline" wrap="nowrap">
                  <Text size="sm" fw={600} c="dimmed">
                    Blacklisted:
                  </Text>
                  <Text fw={700} size="xl" c="red">
                    {customerStats.blacklisted}
                  </Text>
                </Group>
              </div>
            </Group>
          </Card>
        </Group>

        {/* Filters/Search removed (handled inside CustomerSearchTable) */}

        {/* Customer Table */}
        <CustomerSearchTable
          customers={customers}
          loading={loading}
          error={error}
          onCustomerSelected={(c) => router.push(`/portal/customers/${c.id}`)}
        />

        {/* Footer Info */}
        {!loading && !error && customers.length > 0 && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Showing {customers.length} customers
            </Text>
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Last updated: {new Date().toLocaleTimeString()}
              </Text>
            </Group>
          </Group>
        )}
      </Stack>
    </Container>
  );
}
