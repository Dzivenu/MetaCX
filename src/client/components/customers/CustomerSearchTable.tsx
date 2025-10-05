"use client";

import React from "react";
import {
  Table,
  Group,
  Text,
  TextInput,
  Select,
  Paper,
  Loader,
  Stack,
} from "@mantine/core";
import {
  IconSearch,
  IconUser,
  IconMail,
  IconPhone,
  IconCalendar,
} from "@tabler/icons-react";
import type { Customer } from "@/client/api/customers";
import { useCustomers } from "@/client/hooks/useCustomers";

interface Props {
  customers?: Customer[];
  loading?: boolean;
  error?: string | null;
  initialFilterStatus?: "all" | "active" | "blacklisted";
  onCustomerSelected?: (customer: Customer) => void;
}

export const CustomerSearchTable: React.FC<Props> = ({
  customers: customersProp,
  loading: loadingProp,
  error: errorProp,
  initialFilterStatus = "all",
  onCustomerSelected,
}) => {
  const {
    customers: hookCustomers,
    loading: hookLoading,
    error: hookError,
  } = useCustomers();

  const customers = customersProp ?? hookCustomers;
  const loading = loadingProp ?? hookLoading;
  const error = errorProp ?? hookError ?? null;

  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<string | null>(
    initialFilterStatus
  );

  const filteredCustomers = React.useMemo(() => {
    const list = customers || [];
    return list.filter((customer) => {
      const matchesSearch =
        searchQuery === "" ||
        `${customer.firstName} ${customer.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.telephone?.includes(searchQuery);

      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "blacklisted" && !!customer.blacklisted) ||
        (filterStatus === "active" && !customer.blacklisted);

      return matchesSearch && matchesFilter;
    });
  }, [customers, searchQuery, filterStatus]);

  return (
    <Paper withBorder p="md">
      <Group justify="space-between" align="flex-end" mb="md">
        <Group gap="md" style={{ flex: 1 }}>
          <TextInput
            placeholder="Search customers..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1, maxWidth: 400 }}
          />
          <Select
            placeholder="Filter by status"
            leftSection={<IconSearch size={16} />}
            data={[
              { value: "all", label: "All Customers" },
              { value: "active", label: "Active Only" },
              { value: "blacklisted", label: "Blacklisted Only" },
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
            clearable={false}
            style={{ minWidth: 160 }}
          />
        </Group>
      </Group>

      {loading && (
        <Stack align="center" p="xl">
          <Loader size="lg" />
          <Text c="dimmed">Loading customers...</Text>
        </Stack>
      )}

      {!loading && !error && filteredCustomers.length > 0 && (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Contact Information</Table.Th>
              <Table.Th>Date of Birth</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredCustomers.map((customer) => (
              <Table.Tr
                key={customer.id}
                onClick={() =>
                  onCustomerSelected && onCustomerSelected(customer)
                }
                style={{ cursor: onCustomerSelected ? "pointer" : "default" }}
              >
                <Table.Td>
                  <Group gap="sm">
                    <IconUser size={20} color="var(--mantine-color-gray-6)" />
                    <div>
                      <Text fw={500} size="sm">
                        {customer.firstName} {customer.lastName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        ID: {customer.id}
                      </Text>
                    </div>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Stack gap={2}>
                    {customer.email && (
                      <Group gap={4}>
                        <IconMail
                          size={12}
                          color="var(--mantine-color-gray-6)"
                        />
                        <Text size="xs">{customer.email}</Text>
                      </Group>
                    )}
                    {customer.telephone && (
                      <Group gap={4}>
                        <IconPhone
                          size={12}
                          color="var(--mantine-color-gray-6)"
                        />
                        <Text size="xs">{customer.telephone}</Text>
                      </Group>
                    )}
                    {!customer.email && !customer.telephone && (
                      <Text size="xs" c="dimmed">
                        No contact info
                      </Text>
                    )}
                  </Stack>
                </Table.Td>
                <Table.Td>
                  {customer.dob ? (
                    <Group gap={4}>
                      <IconCalendar
                        size={12}
                        color="var(--mantine-color-gray-6)"
                      />
                      <Text size="xs">{customer.dob}</Text>
                    </Group>
                  ) : (
                    <Text size="xs" c="dimmed">
                      Not provided
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c={customer.blacklisted ? "red" : "green"}>
                    {customer.blacklisted ? "Blacklisted" : "Active"}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {!loading && !error && filteredCustomers.length === 0 && (
        <Stack align="center" p="xl">
          <Text c="dimmed">No customers found</Text>
        </Stack>
      )}

      {error && (
        <Stack align="center" p="xl">
          <Text c="red">{error}</Text>
        </Stack>
      )}
    </Paper>
  );
};
