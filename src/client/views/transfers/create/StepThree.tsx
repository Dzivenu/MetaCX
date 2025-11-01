"use client";

import { useMemo } from "react";
import { Stack, Card, Text, Table, Badge, Group, Divider } from "@mantine/core";

export default function TransferStepThree({
  transferData,
  repositories,
}: any) {
  const sourceRepo = useMemo(() => {
    return repositories.find((r: any) => r.id === transferData.sourceRepoId);
  }, [repositories, transferData.sourceRepoId]);

  const targetRepo = useMemo(() => {
    return repositories.find((r: any) => r.id === transferData.targetRepoId);
  }, [repositories, transferData.targetRepoId]);

  const outboundBreakdowns = useMemo(() => {
    return transferData.breakdowns.filter((b: any) => b.direction === "OUTBOUND");
  }, [transferData.breakdowns]);

  const inboundBreakdowns = useMemo(() => {
    return transferData.breakdowns.filter((b: any) => b.direction === "INBOUND");
  }, [transferData.breakdowns]);

  return (
    <Stack gap="md" mt="md">
      <Card withBorder>
        <Text fw={500} size="lg" mb="md">
          Transfer Summary
        </Text>

        <Group justify="space-between" mb="xs">
          <Text c="dimmed">Currency Type:</Text>
          <Text fw={500}>{transferData.currencyType.toUpperCase()}</Text>
        </Group>

        <Group justify="space-between" mb="xs">
          <Text c="dimmed">Source Repository:</Text>
          <Text fw={500}>{sourceRepo?.name}</Text>
        </Group>

        <Group justify="space-between" mb="xs">
          <Text c="dimmed">Target Repository:</Text>
          <Text fw={500}>{targetRepo?.name}</Text>
        </Group>

        <Group justify="space-between" mb="xs">
          <Text c="dimmed">Currency:</Text>
          <Badge size="lg">{transferData.ticker}</Badge>
        </Group>

        <Divider my="md" />

        <Group justify="space-between">
          <Text fw={500} size="lg">
            Total Amount:
          </Text>
          <Badge size="xl" color="blue">
            {transferData.ticker} {parseFloat(transferData.sum).toFixed(2)}
          </Badge>
        </Group>
      </Card>

      <Card withBorder>
        <Text fw={500} mb="md">
          Outbound Breakdown ({sourceRepo?.name})
        </Text>
        {outboundBreakdowns.length > 0 ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Denomination</Table.Th>
                <Table.Th>Count</Table.Th>
                <Table.Th>Subtotal</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {outboundBreakdowns.map((breakdown: any, idx: number) => {
                const value = parseFloat(breakdown.denominationValue);
                const count = parseFloat(breakdown.count);
                const subtotal = value * count;

                return (
                  <Table.Tr key={idx}>
                    <Table.Td>
                      <Badge>{transferData.ticker} {value}</Badge>
                    </Table.Td>
                    <Table.Td>{count}</Table.Td>
                    <Table.Td>
                      {transferData.ticker} {subtotal.toFixed(2)}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" ta="center" py="md">
            Manual amount entry - no denomination breakdown specified
          </Text>
        )}
      </Card>

      <Card withBorder>
        <Text fw={500} mb="md">
          Inbound Breakdown ({targetRepo?.name})
        </Text>
        {inboundBreakdowns.length > 0 ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Denomination</Table.Th>
                <Table.Th>Count</Table.Th>
                <Table.Th>Subtotal</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {inboundBreakdowns.map((breakdown: any, idx: number) => {
                const value = parseFloat(breakdown.denominationValue);
                const count = parseFloat(breakdown.count);
                const subtotal = value * count;

                return (
                  <Table.Tr key={idx}>
                    <Table.Td>
                      <Badge>{transferData.ticker} {value}</Badge>
                    </Table.Td>
                    <Table.Td>{count}</Table.Td>
                    <Table.Td>
                      {transferData.ticker} {subtotal.toFixed(2)}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" ta="center" py="md">
            Manual amount entry - no denomination breakdown specified
          </Text>
        )}
      </Card>
    </Stack>
  );
}
