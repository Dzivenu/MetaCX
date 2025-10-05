"use client";
import Link from "next/link";
import {
  Container,
  Title,
  Text,
  Table,
  Badge,
  Group,
  Button,
} from "@mantine/core";
import { useMemo } from "react";
import { useOrgOrders } from "@/client/hooks/useOrgOrdersConvex";
import { useShortId } from "@/client/hooks/useShortId";
import { useActiveSession } from "@/client/hooks/useActiveSession";

export default function OrdersPage() {
  // Get active session for display/validation
  const { activeSession } = useActiveSession();

  // Show orders for current organization and active session (filtered in Convex)
  const { orgOrders, loading, error } = useOrgOrders(
    undefined, // orgSessionId
    undefined, // status
    true // useActiveSessionFilter
  );

  // Debug logging
  console.log("Orders page:", {
    orgOrders,
    loading,
    error,
    count: orgOrders?.length,
    activeSessionId: activeSession?._id,
  });

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

  const rows = useMemo(
    () =>
      orgOrders.map((order) => {
        const shortOrderId = createShortId(order.id, 8, "#");
        const shortSessionId = createShortId(order.orgSessionId, 6);

        return (
          <Table.Tr key={order.id}>
            <Table.Td>
              <Link href={`/portal/orders/${order.id}`}>{shortOrderId}</Link>
            </Table.Td>
            <Table.Td>
              <Badge
                color={
                  order.status === "COMPLETED"
                    ? "green"
                    : order.status === "ACCEPTED"
                      ? "blue"
                      : order.status === "QUOTE"
                        ? "orange"
                        : "yellow"
                }
                variant="light"
              >
                {order.status}
              </Badge>
            </Table.Td>
            <Table.Td>
              {order.inboundSum} {order.inboundTicker}
            </Table.Td>
            <Table.Td>
              {order.outboundSum} {order.outboundTicker}
            </Table.Td>
            <Table.Td>
              <Text size="sm" c="dimmed">
                {shortSessionId}
              </Text>
            </Table.Td>
            <Table.Td>
              {order.openDt ? new Date(order.openDt).toLocaleString() : ""}
            </Table.Td>
          </Table.Tr>
        );
      }),
    [orgOrders]
  );

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
    <Container size="lg" py="xl">
      <div>
        <Group justify="space-between" align="center" mb="xl">
          <Title order={1}>Order History</Title>
          <Button component={Link} href="/portal/orders/create">
            Create Order
          </Button>
        </Group>

        {orgOrders.length === 0 ? (
          <div className="text-center py-8">
            <Text c="dimmed" size="lg">
              No orders found
            </Text>
            <Text c="dimmed" size="sm" mt="xs">
              Create your first order to get started
            </Text>
          </div>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Order ID</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Inbound</Table.Th>
                <Table.Th>Outbound</Table.Th>
                <Table.Th>Session</Table.Th>
                <Table.Th>Opened</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        )}
      </div>
    </Container>
  );
}
