"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import {
  Button,
  Group,
  Loader,
  Text,
  Title,
  Alert,
  Grid,
  Stack,
  Tabs,
  Card,
  Table,
  Badge,
} from "@mantine/core";
import {
  IconInfoCircle,
  IconBuilding,
  IconShoppingCart,
  IconNotes,
} from "@tabler/icons-react";
import { useOrgCustomers } from "@/client/hooks/useOrgCustomersConvex";
import {
  CustomerBioCard,
  CustomerAddressCard,
  CustomerIdentificationCard,
} from "@/client/components/customers";
import { CustomerNotesBlock } from "@/client/components/blocks";
import { useOrgOrders } from "@/client/hooks/useOrgOrdersConvex";
import type { OrgCustomer } from "@/client/hooks/useOrgCustomersConvex";

interface Props {
  basePath?: string; // e.g. "/admin/customers" or "/portal/customers"
}

export default function CustomerDetailView({ basePath = "" }: Props) {
  const params = useParams<{ id: string }>();
  const id = (params?.id as string) || "";
  const { organization } = useOrganization();
  const { orgCustomers, loading: orgCustomersLoading } = useOrgCustomers(200);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgCustomer, setOrgCustomer] = useState<OrgCustomer | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>("orders");
  const { orgOrders, loading: ordersLoading } = useOrgOrders();

  // Check if organization functionality should be disabled
  const isOrgDisabled = !organization;

  useEffect(() => {
    const load = async () => {
      if (isOrgDisabled) {
        setError("Please select an organization to view customers.");
        setLoading(false);
        return;
      }

      if (!orgCustomersLoading) {
        const customer = orgCustomers.find((c) => c.id === id);
        setOrgCustomer(customer || null);
        setError(customer ? null : "Customer not found");
        setLoading(false);
      }
    };

    if (id) {
      load();
    }
  }, [id, orgCustomers, isOrgDisabled, orgCustomersLoading]);

  if (!id) return <div>Invalid customer id</div>;

  const handleCustomerUpdate = (updatedCustomer: OrgCustomer) => {
    setOrgCustomer(updatedCustomer);
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Customer #{id}</Title>
        <Button component={Link} href={basePath} variant="default">
          Back to Customers
        </Button>
      </Group>

      {/* Organization Status Alert */}
      {isOrgDisabled && (
        <Alert
          icon={<IconInfoCircle size={16} />}
          color="blue"
          mb="md"
          title="Organization Required"
        >
          <Text size="sm" mb="xs">
            Please select an organization to view customer details. You can use
            the organization switcher in the top navigation bar.
          </Text>
          <Group gap="sm">
            <Button
              size="xs"
              variant="light"
              leftSection={<IconBuilding size={14} />}
              component={Link}
              href="/organizations"
            >
              Manage Organizations
            </Button>
          </Group>
        </Alert>
      )}

      {loading && (
        <Group gap="sm">
          <Loader size="sm" />
          <Text>Loading...</Text>
        </Group>
      )}
      {error && !isOrgDisabled && <Text c="red">{error}</Text>}

      {/* Customer Information Cards - All inline in one row */}
      {!loading && orgCustomer && !isOrgDisabled && (
        <Stack gap="xl">
          <Stack gap="md">
            <Title order={3}>Customer Information</Title>
            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <CustomerBioCard
                  customer={orgCustomer}
                  showTitle={false}
                  onCustomerUpdate={handleCustomerUpdate}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <CustomerAddressCard customer={orgCustomer} showTitle={false} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <CustomerIdentificationCard
                  customer={orgCustomer}
                  showTitle={false}
                />
              </Grid.Col>
            </Grid>
          </Stack>

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="orders" leftSection={<IconShoppingCart size={16} />}>
                Orders
              </Tabs.Tab>
              <Tabs.Tab value="notes" leftSection={<IconNotes size={16} />}>
                Notes
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="orders" pt="md">
              <Card withBorder>
                {ordersLoading ? (
                  <Group gap="sm">
                    <Loader size="sm" />
                    <Text>Loading orders...</Text>
                  </Group>
                ) : (
                  <Stack gap="md">
                    <Title order={4}>Customer Orders</Title>
                    {orgOrders.filter((order) => order.orgCustomerId === id)
                      .length === 0 ? (
                      <Text c="dimmed">No orders found for this customer.</Text>
                    ) : (
                      <Table striped highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Order ID</Table.Th>
                            <Table.Th>Inbound</Table.Th>
                            <Table.Th>Outbound</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Created</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {orgOrders
                            .filter((order) => order.orgCustomerId === id)
                            .map((order) => (
                              <Table.Tr
                                key={order.id}
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                  window.location.href = `${basePath.replace(
                                    "/customers",
                                    "/orders"
                                  )}/${order.id}`
                                }
                              >
                                <Table.Td>
                                  <Text size="sm" fw={500}>
                                    {order.id.slice(0, 8)}...
                                  </Text>
                                </Table.Td>
                                <Table.Td>
                                  <Text size="sm">
                                    {order.inboundSum} {order.inboundTicker}
                                  </Text>
                                </Table.Td>
                                <Table.Td>
                                  <Text size="sm">
                                    {order.outboundSum} {order.outboundTicker}
                                  </Text>
                                </Table.Td>
                                <Table.Td>
                                  <Badge
                                    color={
                                      order.status === "completed"
                                        ? "green"
                                        : order.status === "pending"
                                        ? "yellow"
                                        : "gray"
                                    }
                                    variant="light"
                                  >
                                    {order.status || "unknown"}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  <Text size="sm">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </Text>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Stack>
                )}
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="notes" pt="md">
              <CustomerNotesBlock customerId={id} />
            </Tabs.Panel>
          </Tabs>
        </Stack>
      )}
    </div>
  );
}
