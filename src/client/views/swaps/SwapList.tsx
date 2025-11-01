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

export default function SwapList({ swaps, loading }: any) {
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(
    "all"
  );
  const [selectedInboundRepo, setSelectedInboundRepo] = useState<string | null>(
    "all"
  );
  const [selectedOutboundRepo, setSelectedOutboundRepo] = useState<
    string | null
  >("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const currencyOptions = useMemo(() => {
    const uniqueCurrencies = [
      ...new Set(swaps.map((s: any) => s.inboundTicker)),
    ].filter(Boolean) as string[];
    return [
      { value: "all", label: "All Currencies" },
      ...uniqueCurrencies.map((ticker: string) => ({
        value: ticker,
        label: ticker,
      })),
    ];
  }, [swaps]);

  const repoOptions = useMemo(() => {
    const uniqueRepos = [
      ...new Set([
        ...swaps.map((s: any) => s.inboundRepositoryName),
        ...swaps.map((s: any) => s.outboundRepositoryName),
      ]),
    ].filter(Boolean);
    return [
      { value: "all", label: "All Repositories" },
      ...uniqueRepos.map((repo: string) => ({
        value: repo,
        label: repo,
      })),
    ];
  }, [swaps]);

  const filteredSwaps = useMemo(() => {
    return swaps.filter((swap: any) => {
      const currencyMatch =
        selectedCurrency === "all" || swap.inboundTicker === selectedCurrency;
      const inboundMatch =
        selectedInboundRepo === "all" ||
        swap.inboundRepositoryName === selectedInboundRepo;
      const outboundMatch =
        selectedOutboundRepo === "all" ||
        swap.outboundRepositoryName === selectedOutboundRepo;

      return currencyMatch && inboundMatch && outboundMatch;
    });
  }, [swaps, selectedCurrency, selectedInboundRepo, selectedOutboundRepo]);

  const handleReset = () => {
    setSelectedCurrency("all");
    setSelectedInboundRepo("all");
    setSelectedOutboundRepo("all");
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
    return <Text>Loading swaps...</Text>;
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
            label="Inbound Repository"
            placeholder="Select inbound repository"
            data={repoOptions}
            value={selectedInboundRepo}
            onChange={setSelectedInboundRepo}
            style={{ flex: 1 }}
          />
          <Select
            label="Outbound Repository"
            placeholder="Select outbound repository"
            data={repoOptions}
            value={selectedOutboundRepo}
            onChange={setSelectedOutboundRepo}
            style={{ flex: 1 }}
          />
          <Button onClick={handleReset} style={{ alignSelf: "flex-end" }}>
            Reset
          </Button>
        </Group>
        <Text size="sm" mt="md" c="dimmed">
          Showing {filteredSwaps.length} of {swaps.length} swaps
        </Text>
      </Card>

      <Card withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Currency</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Inbound Repo</Table.Th>
              <Table.Th>Outbound Repo</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredSwaps.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text ta="center" c="dimmed">
                    No swaps found
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredSwaps.map((swap: any) => (
                <>
                  <Table.Tr key={swap._id}>
                    <Table.Td>
                      {swap._id.substring(swap._id.length - 8)}
                    </Table.Td>
                    <Table.Td>
                      <Badge>{swap.inboundTicker}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {formatCurrency(
                          parseFloat(swap.swapValue),
                          swap.inboundTicker
                        )}
                      </Text>
                    </Table.Td>
                    <Table.Td>{swap.inboundRepositoryName}</Table.Td>
                    <Table.Td>{swap.outboundRepositoryName}</Table.Td>
                    <Table.Td>
                      {new Date(swap.createdAt).toLocaleString()}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={swap.status === "COMPLETED" ? "green" : "gray"}
                      >
                        {swap.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() => toggleRow(swap._id)}
                      >
                        {expandedRows.has(swap._id) ? (
                          <IconChevronUp size={16} />
                        ) : (
                          <IconChevronDown size={16} />
                        )}
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td colSpan={8} p={0}>
                      <Collapse in={expandedRows.has(swap._id)}>
                        <Box p="md">
                          <Text fw={500} mb="sm">
                            Breakdown Details
                          </Text>
                          {swap.breakdowns && swap.breakdowns.length > 0 ? (
                            <Table striped={false} highlightOnHover={false}>
                              <Table.Thead>
                                <Table.Tr>
                                  <Table.Th>Direction</Table.Th>
                                  <Table.Th>Denomination</Table.Th>
                                  <Table.Th>Count</Table.Th>
                                  <Table.Th>Status</Table.Th>
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {swap.breakdowns.map(
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
                                      <Table.Td>
                                        {formatCurrency(
                                          parseFloat(
                                            breakdown.denominationValue || "0"
                                          ),
                                          swap.inboundTicker
                                        )}
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
