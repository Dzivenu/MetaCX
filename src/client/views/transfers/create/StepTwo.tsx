import { useMemo, useState } from "react";
import {
  Stack,
  Text,
  Card,
  Table,
  NumberInput,
  Badge,
  Button,
  Group,
} from "@mantine/core";
import { useCurrencies } from "@/client/hooks/useCurrenciesConvex";

// Inline calculation function
const calculateBreakdownSumFromFloatStacks = (floatStacks: any[]) => {
  return floatStacks.reduce((sum: number, stack: any) => {
    const count = stack.use || 0;
    const value = parseFloat(stack.value) || 0;
    return sum + count * value;
  }, 0);
};

export default function TransferStepTwo({
  transferData,
  setTransferData,
  repositories,
}: any) {
  const [breakdownCounts, setBreakdownCounts] = useState<Record<string, number>>({});

  // Get organization's currencies
  const { currencies: orgCurrencies } = useCurrencies();

  const sourceRepo = useMemo(() => {
    return repositories.find((r: any) => r.id === transferData.sourceRepoId);
  }, [repositories, transferData.sourceRepoId]);

  const targetRepo = useMemo(() => {
    return repositories.find((r: any) => r.id === transferData.targetRepoId);
  }, [repositories, transferData.targetRepoId]);

  // Get denomination data from organization currencies
  const denominationData = useMemo(() => {
    if (!orgCurrencies || !transferData.ticker) return [];

    const currency = orgCurrencies.find((c: any) => c.ticker === transferData.ticker);
    if (!currency) return [];

    // Get denomination data from the currency's denomination configurations
    // For now, create some default denominations based on currency type
    const currencyType = currency.typeOf || currency.typeof || 'fiat';

    if (currencyType.toLowerCase() === 'cryptocurrency') {
      return [
        { value: 1, name: '1 unit' },
        { value: 10, name: '10 units' },
        { value: 100, name: '100 units' },
        { value: 1000, name: '1000 units' },
      ];
    } else {
      // Fiat currencies
      return [
        { value: 1, name: '$1' },
        { value: 5, name: '$5' },
        { value: 10, name: '$10' },
        { value: 20, name: '$20' },
        { value: 50, name: '$50' },
        { value: 100, name: '$100' },
      ];
    }
  }, [orgCurrencies, transferData.ticker]);

  // Create float stacks from denomination data
  const floatStacks = useMemo(() => {
    return denominationData.map((denom: any, index: number) => ({
      id: `denom_${index}`,
      value: denom.value,
      current_count: 999999, // Unlimited for transfer purposes
      starting_count: 0,
      repository_id: sourceRepo?.id || '',
      denomination_id: `denom_${index}`,
      ticker: transferData.ticker,
      use: breakdownCounts[`denom_${index}`] || 0,
    }));
  }, [denominationData, sourceRepo, transferData.ticker, breakdownCounts]);

  const calculatedSum = useMemo(() => {
    return calculateBreakdownSumFromFloatStacks(floatStacks);
  }, [floatStacks]);

  // Use calculated sum if there are breakdowns, otherwise use manually entered sum
  const displaySum = calculatedSum > 0 ? calculatedSum : parseFloat(transferData.sum) || 0;

  const handleCountChange = (denomId: string, value: number | string) => {
    const numValue = typeof value === "number" ? value : parseFloat(value) || 0;
    setBreakdownCounts((prev) => ({
      ...prev,
      [denomId]: numValue,
    }));

    // Update float stacks with new count
    const updatedFloatStacks = floatStacks.map((stack: any) =>
      stack.id === denomId ? { ...stack, use: numValue } : stack
    );

    // Calculate sum from updated float stacks
    const newSum = calculateBreakdownSumFromFloatStacks(updatedFloatStacks);

    // Create breakdowns for both OUTBOUND and INBOUND
    const newBreakdowns: any[] = [];

    updatedFloatStacks.forEach((stack: any) => {
      if (stack.use > 0) {
        // For transfers without float, we don't have real float stack IDs or denomination IDs
        // So we create breakdowns without these references
        newBreakdowns.push({
          repositoryId: transferData.sourceRepoId,
          count: stack.use.toString(),
          direction: "OUTBOUND",
          denominationValue: stack.value.toString(),
          // floatStackId and denominationId are optional and not included for transfers without float
        });

        // Create corresponding inbound breakdown
        newBreakdowns.push({
          repositoryId: transferData.targetRepoId,
          count: stack.use.toString(),
          direction: "INBOUND",
          denominationValue: stack.value.toString(),
          // floatStackId and denominationId are optional and not included for transfers without float
        });
      }
    });

    setTransferData({
      ...transferData,
      sum: newSum.toString(),
      breakdowns: newBreakdowns,
    });

  };

  // Auto-breakdown functionality
  const handleAutoBreakdown = (type: 'largest' | 'common' | 'reset') => {
    if (!floatStacks.length) return;

    const targetSum = displaySum;
    if (targetSum <= 0 && type !== 'reset') return;

    let newCounts: Record<string, number> = {};

    if (type === 'reset') {
      // Reset all counts to 0
      newCounts = {};
    } else if (type === 'largest') {
      // Use largest denomination first
      const sortedStacks = [...floatStacks].sort((a, b) => b.value - a.value);
      let remaining = targetSum;
      sortedStacks.forEach((stack) => {
        if (remaining >= stack.value) {
          const count = Math.floor(remaining / stack.value);
          const available = Math.min(count, stack.current_count);
          newCounts[stack.id] = available;
          remaining -= available * stack.value;
        }
      });
    } else if (type === 'common') {
      // Use most common denominations (greedy algorithm)
      let remaining = targetSum;
      floatStacks.forEach((stack) => {
        if (remaining >= stack.value) {
          const count = Math.floor(remaining / stack.value);
          const available = Math.min(count, stack.current_count);
          newCounts[stack.id] = available;
          remaining -= available * stack.value;
        }
      });
    }

    // Apply the new counts
    setBreakdownCounts(newCounts);
  };

  return (
    <Stack gap="md" mt="md">
      <Card withBorder>
        <Text fw={500} size="lg" mb="md">
          Transfer Breakdown (Optional)
        </Text>
        <Text size="sm" c="dimmed" mb="md">
          Enter denomination counts for the outbound transfer from {sourceRepo?.name}.
          The system will automatically create corresponding inbound entries for {targetRepo?.name}.
          You can skip this step if you prefer manual amount entry only.
        </Text>

        {/* Auto-breakdown buttons */}
        <Group mb="md">
          <Button
            variant="light"
            size="sm"
            onClick={() => handleAutoBreakdown('common')}
            disabled={displaySum <= 0}
          >
            Common
          </Button>
          <Button
            variant="light"
            size="sm"
            onClick={() => handleAutoBreakdown('largest')}
            disabled={displaySum <= 0}
          >
            Largest
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAutoBreakdown('reset')}
          >
            Reset
          </Button>
        </Group>

        {/* Total amount display */}
        <Group justify="space-between" mb="md">
          <Text fw={500}>Transfer Amount:</Text>
          <Badge size="lg" color="blue">
            {transferData.ticker} {displaySum.toFixed(2)}
          </Badge>
        </Group>

        {floatStacks.length > 0 ? (
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
                const count = breakdownCounts[stack.id] || 0;
                const subtotal = count * stack.value;
                const available = stack.current_count;

                return (
                  <Table.Tr key={stack.id}>
                    <Table.Td>
                      <Badge>{transferData.ticker} {stack.value}</Badge>
                    </Table.Td>
                    <Table.Td>{available}</Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={count}
                        onChange={(val) => handleCountChange(stack.id, val)}
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
        ) : (
          <Text c="dimmed" ta="center" py="md">
            No denomination data available for breakdown. You can proceed with manual amount entry.
          </Text>
        )}
      </Card>
    </Stack>
  );
}
