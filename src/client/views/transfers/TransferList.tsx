"use client";

import { useState, useMemo } from "react";
import {
  Card,
  Table,
  Text,
  Badge,
  Select,
  Button,
  Group,
  Stack,
  Collapse,
  Box,
} from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { formatCurrency } from "@/client/utils/formatters";

export default function TransferList({ transfers, loading }: any) {
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>("all");
  const [selectedFromRepo, setSelectedFromRepo] = useState<string | null>("all");
  const [selectedToRepo, setSelectedToRepo] = useState<string | null>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const currencyOptions = useMemo(() => {
    const uniqueCurrencies = [
      ...new Set(transfers.map((t: any) => t.inboundTicker)),
    ].filter(Boolean);
    return [
      { value: "all", label: "All Currencies" },
      ...uniqueCurrencies.map((ticker: string) => ({
        value: ticker,
        label: ticker,
      })),
    ];
  }, [transfers]);

  const repoOptions = useMemo(() => {
    const uniqueRepos = [
      ...new Set([
        ...transfers.map((t: any) => t.from),
        ...transfers.map((t: any) => t.to),
      ]),
    ].filter(Boolean);
    return [
      { value: "all", label: "All Repositories" },
      ...uniqueRepos.map((repo: string) => ({
        value: repo,
        label: repo,
      })),
    ];
  }, [transfers]);

  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer: any) => {
      const currencyMatch =
        selectedCurrency === "all" ||
        transfer.inboundTicker === selectedCurrency;
      const fromMatch =
        selectedFromRepo === "all" || transfer.from === selectedFromRepo;
      const toMatch = selectedToRepo === "all" || transfer.to === selectedToRepo;

      return currencyMatch && fromMatch && toMatch;
    });
  }, [transfers, selectedCurrency, selectedFromRepo, selectedToRepo]);

  const handleReset = () => {
    setSelectedCurrency("all");
    setSelectedFromRepo("all");
    setSelectedToRepo("all");
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (loading) {
    return <Text>Loading transfers...</Text>;
  }

  return (
    <Stack gap="md">
      <Card withBorder>
        <Group gap="md">
          <Select
            label="Currency"
            placeholder="Select currency"
            data={currencyOptions}
            value={selectedCurrency}
            onChange={setSelectedCurrency}
            style={{ flex: 1 }}
          />
          <Select
            label="Source"
            placeholder="Select source repository"
            data={repoOptions}
            value={selectedFromRepo}
            onChange={setSelectedFromRepo}
            style={{ flex: 1 }}
          />
          <Select
            label="Target"
            placeholder="Select target repository"
            data={repoOptions}
            value={selectedToRepo}
            onChange={setSelectedToRepo}
            style={{ flex: 1 }}
          />
          <Button onClick={handleReset} style={{ alignSelf: "flex-end" }}>
            Reset
          </Button>
        </Group>
        <Text size="sm" mt="md" c="dimmed">
          Showing {filteredTransfers.length} of {transfers.length} transfers
        </Text>
      </Card>

      <Card withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Currency</Table.Th>
              <Table.Th>From</Table.Th>
              <Table.Th>To</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredTransfers.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text ta="center" c="dimmed">
                    No transfers found
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredTransfers.map((transfer: any) => (
                <>
                  <Table.Tr key={transfer._id}>
                    <Table.Td>
                      {transfer._id.substring(transfer._id.length - 8)}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Badge>{transfer.inboundTicker}</Badge>
                        <Text size="sm">
                          {formatCurrency(
                            parseFloat(transfer.outboundSum),
                            transfer.outboundTicker
                          )}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>{transfer.from}</Table.Td>
                    <Table.Td>{transfer.to}</Table.Td>
                    <Table.Td>
                      {new Date(transfer.createdAt).toLocaleString()}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          transfer.status === "COMPLETED" ? "green" : "gray"
                        }
                      >
                        {transfer.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() => toggleRow(transfer._id)}
                      >
                        {expandedRows.has(transfer._id) ? (
                          <IconChevronUp size={16} />
                        ) : (
                          <IconChevronDown size={16} />
                        )}
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td colSpan={7} p={0}>
                      <Collapse in={expandedRows.has(transfer._id)}>
                        <Box p="md" bg="gray.0">
                          <Text fw={500} mb="sm">
                            Breakdown Details
                          </Text>
                          {transfer.breakdowns &&
                          transfer.breakdowns.length > 0 ? (
                            <Table>
                              <Table.Thead>
                                <Table.Tr>
                                  <Table.Th>Direction</Table.Th>
                                  <Table.Th>Count</Table.Th>
                                  <Table.Th>Status</Table.Th>
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {transfer.breakdowns.map(
                                  (breakdown: any, idx: number) => (
                                    <Table.Tr key={idx}>
                                      <Table.Td>
                                        <Badge
                                          color={
                                            breakdown.direction === "OUTBOUND"
                                              ? "red"
                                              : "green"
                                          }
                                        >
                                          {breakdown.direction}
                                        </Badge>
                                      </Table.Td>
                                      <Table.Td>{breakdown.count}</Table.Td>
                                      <Table.Td>
                                        <Badge color="green">
                                          {breakdown.status}
                                        </Badge>
                                      </Table.Td>
                                    </Table.Tr>
                                  )
                                )}
                              </Table.Tbody>
                            </Table>
                          ) : (
                            <Text c="dimmed">No breakdown details</Text>
                          )}
                        </Box>
                      </Collapse>
                    </Table.Td>
                  </Table.Tr>
                </>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}
