"use client";

import { useMemo, useState } from "react";
import {
  Stack,
  TextInput,
  Table,
  NumberInput,
  Text,
  Card,
  Group,
  Badge,
} from "@mantine/core";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function TransferStepTwo({
  transferData,
  setTransferData,
  repositories,
}: any) {
  const [breakdownCounts, setBreakdownCounts] = useState<Record<string, number>>({});

  const sourceRepo = useMemo(() => {
    return repositories.find((r: any) => r._id === transferData.sourceRepoId);
  }, [repositories, transferData.sourceRepoId]);

  const targetRepo = useMemo(() => {
    return repositories.find((r: any) => r._id === transferData.targetRepoId);
  }, [repositories, transferData.targetRepoId]);

  const sourceCurrency = useMemo(() => {
    if (!sourceRepo || !transferData.ticker) return null;
    return (sourceRepo.currencies || []).find(
      (c: any) => c.ticker === transferData.ticker
    );
  }, [sourceRepo, transferData.ticker]);

  const targetCurrency = useMemo(() => {
    if (!targetRepo || !transferData.ticker) return null;
    return (targetRepo.currencies || []).find(
      (c: any) => c.ticker === transferData.ticker
    );
  }, [targetRepo, transferData.ticker]);

  const floatStacks = useMemo(() => {
    if (!sourceCurrency) return [];
    return sourceCurrency.float_stacks || [];
  }, [sourceCurrency]);

  const calculatedSum = useMemo(() => {
    return floatStacks.reduce((sum: number, stack: any) => {
      const count = breakdownCounts[stack._id] || 0;
      const value = parseFloat(stack.value) || 0;
      return sum + count * value;
    }, 0);
  }, [floatStacks, breakdownCounts]);

  const handleCountChange = (stackId: string, value: number | string) => {
    const numValue = typeof value === "number" ? value : parseFloat(value) || 0;
    setBreakdownCounts((prev) => ({
      ...prev,
      [stackId]: numValue,
    }));

    const newBreakdowns: any[] = [];

    floatStacks.forEach((stack: any) => {
      const count = stackId === stack._id ? numValue : breakdownCounts[stack._id] || 0;
      if (count !== 0) {
        const targetStack = (targetCurrency?.float_stacks || []).find(
          (ts: any) => ts.denomination_id === stack.denomination_id
        );

        newBreakdowns.push({
          floatStackId: stack._id,
          repositoryId: transferData.sourceRepoId,
          count: count.toString(),
          direction: "OUTBOUND",
          denominationId: stack.denomination_id,
          denominationValue: stack.value,
        });

        if (targetStack) {
          newBreakdowns.push({
            floatStackId: targetStack._id,
            repositoryId: transferData.targetRepoId,
            count: count.toString(),
            direction: "INBOUND",
            denominationId: targetStack.denomination_id,
            denominationValue: targetStack.value,
          });
        }
      }
    });

    setTransferData({
      ...transferData,
      sum: calculatedSum.toString(),
      breakdowns: newBreakdowns,
    });
  };

  return (
    <Stack gap="md" mt="md">
      <Card withBorder>
        <Group justify="space-between">
          <Text fw={500}>Transfer Amount</Text>
          <Badge size="lg" color="blue">
            {transferData.ticker} {calculatedSum.toFixed(2)}
          </Badge>
        </Group>
      </Card>

      <Card withBorder>
        <Text fw={500} mb="md">
          Breakdown
        </Text>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Denomination</Table.Th>
              <Table.Th>Available</Table.Th>
              <Table.Th>Count</Table.Th>
              <Table.Th>Subtotal</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {floatStacks.map((stack: any) => {
              const count = breakdownCounts[stack._id] || 0;
              const value = parseFloat(stack.value) || 0;
              const subtotal = count * value;
              const available = parseFloat(stack.closeCount) || 0;

              return (
                <Table.Tr key={stack._id}>
                  <Table.Td>
                    <Badge>{transferData.ticker} {value}</Badge>
                  </Table.Td>
                  <Table.Td>{available}</Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={count}
                      onChange={(val) => handleCountChange(stack._id, val)}
                      min={0}
                      max={available}
                      style={{ width: 100 }}
                    />
                  </Table.Td>
                  <Table.Td>
                    {transferData.ticker} {subtotal.toFixed(2)}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}
