"use client";
import Link from "next/link";
import {
  Container,
  Title,
  Text,
  Badge,
  Group,
  Button,
  Card,
  ActionIcon,
  Tooltip,
  TextInput,
  Select,
  Stack,
  Box,
} from "@mantine/core";
import { useMemo, useState } from "react";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import {
  IconEye,
  IconSearch,
  IconFilter,
  IconX,
  IconArrowRight,
  IconClock,
  IconUser,
} from "@tabler/icons-react";
import { useOrgOrders } from "@/client/hooks/useOrgOrdersConvex";
import { useShortId } from "@/client/hooks/useShortId";
import { useActiveSession } from "@/client/hooks/useActiveSession";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const router = useRouter();
  const { activeSession } = useActiveSession();

  // Show orders for current organization and active session (filtered in Convex)
  const { orgOrders, loading, error } = useOrgOrders(
    undefined, // orgSessionId
    undefined, // status
    true // useActiveSessionFilter
  );

  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "openDt",
    direction: "desc",
  });

  // Filter and sort orders - MUST be before conditional returns (Rules of Hooks)
  const filteredOrders = useMemo(() => {
    let filtered = [...orgOrders];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.inboundTicker
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          order.outboundTicker
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          order.status?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const { columnAccessor, direction } = sortStatus;
      let aValue: any;
      let bValue: any;

      switch (columnAccessor) {
        case "orderId":
          aValue = a.id || "";
          bValue = b.id || "";
          break;
        case "customer":
          aValue = a.customerName || "";
          bValue = b.customerName || "";
          break;
        case "inbound":
          aValue = parseFloat(a.inboundSum as any) || 0;
          bValue = parseFloat(b.inboundSum as any) || 0;
          break;
        case "outbound":
          aValue = parseFloat(a.outboundSum as any) || 0;
          bValue = parseFloat(b.outboundSum as any) || 0;
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        case "openDt":
          aValue = a.openDt ? new Date(a.openDt).getTime() : 0;
          bValue = b.openDt ? new Date(b.openDt).getTime() : 0;
          break;
        default:
          aValue = "";
          bValue = "";
      }

      if (direction === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [orgOrders, searchQuery, statusFilter, sortStatus]);

  // Get unique statuses for filter dropdown - MUST be before conditional returns (Rules of Hooks)
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(
      orgOrders.map((order) => order.status).filter((s): s is string => !!s)
    );
    return Array.from(statuses).sort();
  }, [orgOrders]);

  // Helper function to create short IDs
  const createShortId = (
    id: string | undefined,
    length: number = 8,
    prefix?: string
  ): string => {
    if (!id || typeof id !== "string") return "—";

    let shortId: string;
    if (id.length <= length) {
      shortId = id;
    } else {
      const halfLength = Math.floor(length / 2);
      const firstPart = id.substring(0, halfLength);
      const lastPart = id.substring(id.length - halfLength);
      shortId = firstPart + lastPart;
    }

    return prefix ? `${prefix}${shortId}` : shortId;
  };

  // Helper to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "green";
      case "ACCEPTED":
        return "blue";
      case "QUOTE":
        return "orange";
      case "PENDING":
        return "yellow";
      case "CANCELLED":
        return "red";
      default:
        return "gray";
    }
  };

  // Helper to format currency
  const formatCurrency = (amount: number | string, ticker: string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    const isCrypto = ["BTC", "ETH", "USDT"].includes(ticker);
    const decimals = isCrypto ? 8 : 2;
    return `${numAmount.toFixed(decimals)} ${ticker}`;
  };

  if (!activeSession) {
    return (
      <Container size="lg" py="xl">
        <Group justify="space-between" align="center" mb="xl">
          <Title order={1}>Order History</Title>
          <Button component={Link} href="/portal/orders/create">
            Create Order
          </Button>
        </Group>
        <div className="text-center py-8">
          <Text c="dimmed" size="lg">
            No active session
          </Text>
          <Text c="dimmed" size="sm" mt="xs">
            Please start a trading session to view order history
          </Text>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Group justify="space-between" align="center" mb="xl">
          <Title order={1}>Order History</Title>
          <Button component={Link} href="/portal/orders/create">
            Create Order
          </Button>
        </Group>
        <div className="text-center py-8">
          <Text c="dimmed" size="lg">
            Loading orders...
          </Text>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <div>
          <Title order={1}>Order History</Title>
          <Text c="red" mt="md">
            {error}
          </Text>
        </div>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Box>
            <Title order={1}>Order History</Title>
            <Text c="dimmed" size="sm" mt="xs">
              {filteredOrders.length}{" "}
              {filteredOrders.length === 1 ? "order" : "orders"}
              {searchQuery || statusFilter ? " (filtered)" : ""}
            </Text>
          </Box>
          <Button
            component={Link}
            href="/portal/orders/create"
            leftSection={<IconArrowRight size={16} />}
            size="md"
          >
            Create Order
          </Button>
        </Group>

        {/* Filters */}
        <Card withBorder p="md">
          <Group align="flex-end" gap="md">
            <TextInput
              placeholder="Search by ID, currency, or status..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              rightSection={
                searchQuery ? (
                  <ActionIcon
                    size="sm"
                    variant="transparent"
                    onClick={() => setSearchQuery("")}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                ) : null
              }
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Filter by status"
              leftSection={<IconFilter size={16} />}
              data={uniqueStatuses}
              value={statusFilter}
              onChange={setStatusFilter}
              clearable
              style={{ minWidth: 200 }}
            />
            {(searchQuery || statusFilter) && (
              <Button
                variant="light"
                color="gray"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter(null);
                }}
                leftSection={<IconX size={16} />}
              >
                Clear Filters
              </Button>
            )}
          </Group>
        </Card>

        {/* Orders Table */}
        <Card withBorder p={0}>
          <DataTable
            minHeight={orgOrders.length === 0 ? 200 : undefined}
            highlightOnHover
            striped
            verticalSpacing="sm"
            horizontalSpacing="lg"
            records={filteredOrders as any}
            columns={[
              {
                accessor: "orderId",
                title: "Order ID",
                sortable: true,
                render: (order: any) => (
                  <Text
                    fw={500}
                    c="blue"
                    style={{ cursor: "pointer" }}
                    component={Link}
                    href={`/portal/orders/${order.id || ""}`}
                  >
                    {createShortId(order.id, 8, "#")}
                  </Text>
                ),
              },
              {
                accessor: "customer",
                title: "Customer",
                sortable: true,
                render: (order: any) => {
                  return order.customerName && order.orgCustomerId ? (
                    <Group
                      gap="xs"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        router.push(`/portal/customers/${order.orgCustomerId}`)
                      }
                    >
                      <IconUser size={16} style={{ opacity: 0.6 }} />
                      <Text fw={500} c="blue" td="underline">
                        {order.customerName}
                      </Text>
                    </Group>
                  ) : order.customerName ? (
                    <Group gap="xs">
                      <IconUser size={16} style={{ opacity: 0.6 }} />
                      <Text fw={500}>{order.customerName}</Text>
                    </Group>
                  ) : (
                    <Text c="dimmed" size="sm">
                      No customer
                    </Text>
                  );
                },
              },
              {
                accessor: "inbound",
                title: "Inbound",
                sortable: true,
                render: (order: any) => (
                  <Group gap="xs">
                    <Text fw={600}>
                      {typeof order.inboundSum === "number"
                        ? order.inboundSum.toFixed(2)
                        : order.inboundSum || "0"}
                    </Text>
                    <Badge variant="dot" color="blue">
                      {order.inboundTicker || "—"}
                    </Badge>
                  </Group>
                ),
              },
              {
                accessor: "outbound",
                title: "Outbound",
                sortable: true,
                render: (order: any) => (
                  <Group gap="xs">
                    <Text fw={600}>
                      {typeof order.outboundSum === "number"
                        ? order.outboundSum.toFixed(8)
                        : order.outboundSum || "0"}
                    </Text>
                    <Badge variant="dot" color="teal">
                      {order.outboundTicker || "—"}
                    </Badge>
                  </Group>
                ),
              },
              {
                accessor: "status",
                title: "Status",
                sortable: true,
                render: (order: any) => (
                  <Badge
                    color={getStatusColor(order.status || "")}
                    variant="light"
                    size="lg"
                  >
                    {order.status || "—"}
                  </Badge>
                ),
              },
              {
                accessor: "openDt",
                title: "Opened",
                sortable: true,
                render: (order: any) => (
                  <Group gap="xs">
                    <IconClock size={14} style={{ opacity: 0.5 }} />
                    <Text size="sm">
                      {order.openDt && typeof order.openDt === "string"
                        ? new Date(order.openDt).toLocaleString("en-US", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"}
                    </Text>
                  </Group>
                ),
              },
              {
                accessor: "actions",
                title: "",
                width: 80,
                render: (order: any) => (
                  <Group gap="xs" justify="flex-end">
                    <Tooltip label="View Order Details">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() =>
                          router.push(`/portal/orders/${order.id || ""}`)
                        }
                      >
                        <IconEye size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                ),
              },
            ]}
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            fetching={loading}
            noRecordsText="No orders found"
            emptyState={
              <Box ta="center" py={60}>
                <Text c="dimmed" size="lg" fw={500} mb="xs">
                  No orders found
                </Text>
                <Text c="dimmed" size="sm" mb="xl">
                  {searchQuery || statusFilter
                    ? "Try adjusting your filters"
                    : "Create your first order to get started"}
                </Text>
                {!searchQuery && !statusFilter && (
                  <Button
                    component={Link}
                    href="/portal/orders/create"
                    leftSection={<IconArrowRight size={16} />}
                  >
                    Create Order
                  </Button>
                )}
              </Box>
            }
          />
        </Card>
      </Stack>
    </Container>
  );
}
