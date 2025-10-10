"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  Title,
  Text,
  Group,
  Stack,
  Button,
  NumberInput,
  Select,
  Alert,
  Badge,
  Table,
  ActionIcon,
  Loader,
} from "@mantine/core";
import {
  IconCalculator,
  IconCash,
  IconArrowUp,
  IconArrowDown,
  IconRefresh,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";
import { useOrgBreakdowns } from "@/client/hooks/useOrgBreakdownsConvex";
import { useFloat } from "@/client/hooks/use-float-convex";
import { useActiveSession } from "@/client/hooks/useActiveSession";

interface FloatStack {
  id: string;
  denomination: {
    id: string;
    value: number;
    ticker: string;
    currency: string;
  };
  availableCount: number;
  currentCount: number;
  useCount: number;
  repositoryId: string;
  repositoryName: string;
}

interface BreakdownDirection {
  type: "INBOUND" | "OUTBOUND";
  ticker: string;
  targetSum: number;
  currentSum: number;
}

interface AutoBreakdownOption {
  name: string;
  value: "LARGEST_CUMMULATIVE_VALUE" | "LARGEST_NOTES" | "RESET";
  description: string;
}

const autoBreakdownOptions: AutoBreakdownOption[] = [
  {
    name: "Common",
    value: "LARGEST_CUMMULATIVE_VALUE",
    description: "Prioritize smaller denominations for better change-making",
  },
  {
    name: "Largest",
    value: "LARGEST_NOTES",
    description: "Use largest denominations first to minimize note count",
  },
  {
    name: "Reset",
    value: "RESET",
    description: "Clear all breakdown entries",
  },
];

interface FloatBreakdownFormProps {
  direction: "INBOUND" | "OUTBOUND";
  ticker: string;
  targetSum: number;
  onBreakdownChange?: (breakdowns: any[], isValid: boolean) => void;
  disabled?: boolean;
  orderId?: string; // Optional: use this orderId instead of context
}

export function FloatBreakdownForm({
  direction,
  ticker,
  targetSum,
  onBreakdownChange,
  disabled = false,
  orderId: propOrderId,
}: FloatBreakdownFormProps) {
  // Try to get quoteState from context, but allow fallback
  let contextOrderId: string | undefined;
  try {
    const { quoteState } = useOrderCreation();
    contextOrderId = quoteState.orderId;
  } catch {
    // Context not available - that's okay if orderId prop is provided
    contextOrderId = undefined;
  }

  const effectiveOrderId = propOrderId || contextOrderId;
  const { activeSession } = useActiveSession();

  // State for float stacks and breakdowns
  const [floatStacks, setFloatStacks] = useState<FloatStack[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<string>("");
  const [currentTotal, setCurrentTotal] = useState(0);
  const [breakdownCompleted, setBreakdownCompleted] = useState(false);
  const [autoBreakdownType, setAutoBreakdownType] = useState<string>(
    "LARGEST_CUMMULATIVE_VALUE"
  );

  // Hooks for data fetching
  const {
    floatData,
    repositories: rawRepositories,
    isLoading: floatLoading,
    error: floatError,
  } = useFloat(activeSession?._id || "");

  const {
    breakdowns,
    isLoading: breakdownsLoading,
    saveBreakdowns,
    commit: commitBreakdowns,
    clear: clearBreakdowns,
  } = useOrgBreakdowns("org_orders", effectiveOrderId);

  // Available repositories from float data - filter by ticker
  const repositories = useMemo(() => {
    if (!rawRepositories) return [];
    return rawRepositories.filter((repo) =>
      repo.float?.some((currency: any) => currency.ticker === ticker)
    );
  }, [rawRepositories, ticker]);

  // Current repository's float stacks
  const currentRepoFloatStacks = useMemo(() => {
    if (!selectedRepository || !rawRepositories) return [];

    const repo = rawRepositories.find((r) => r.id === selectedRepository);
    if (!repo) return [];

    const currency = repo.float?.find((c: any) => c.ticker === ticker) as any;
    if (!currency) return [];

    return currency.floatStacks
      .map((stack: any) => ({
        id: stack.id,
        denomination: {
          id: stack.denomination?.id || stack.id, // Use denomination ID if available
          value: stack.denominatedValue,
          ticker: ticker,
          currency: currency.name,
        },
        availableCount: stack.openCount || 0,
        currentCount: stack.openCount || 0,
        useCount: 0,
        repositoryId: repo.id,
        repositoryName: repo.name,
      }))
      .sort((a: any, b: any) => b.denomination.value - a.denomination.value);
  }, [selectedRepository, rawRepositories, ticker]);

  // Auto-select first repository if none selected
  useEffect(() => {
    if (repositories.length > 0 && !selectedRepository) {
      setSelectedRepository(repositories[0].id);
    }
  }, [repositories, selectedRepository]);

  // Update float stacks when repository changes
  useEffect(() => {
    setFloatStacks(currentRepoFloatStacks);
    setCurrentTotal(0);
    setBreakdownCompleted(false);
  }, [currentRepoFloatStacks]);

  // Calculate current total
  useEffect(() => {
    const total = floatStacks.reduce((sum, stack) => {
      return sum + stack.useCount * stack.denomination.value;
    }, 0);
    setCurrentTotal(total);
  }, [floatStacks]);

  // Auto-breakdown algorithms
  const generateAutoBreakdown = useCallback(
    (type: string) => {
      if (type === "RESET") {
        setFloatStacks((prev) =>
          prev.map((stack) => ({ ...stack, useCount: 0 }))
        );
        return;
      }

      const updatedStacks = [...floatStacks];
      let remainingSum = targetSum;

      // Reset all use counts first
      updatedStacks.forEach((stack) => {
        stack.useCount = 0;
      });

      if (type === "LARGEST_NOTES") {
        // Use largest denominations first
        for (const stack of updatedStacks) {
          if (remainingSum <= 0) break;

          const maxUse = Math.floor(remainingSum / stack.denomination.value);
          const availableUse = Math.min(maxUse, stack.availableCount);

          if (availableUse > 0) {
            stack.useCount = availableUse;
            remainingSum -= availableUse * stack.denomination.value;
          }
        }
      } else if (type === "LARGEST_CUMMULATIVE_VALUE") {
        // Greedy algorithm for best change-making
        for (const stack of updatedStacks) {
          if (remainingSum <= 0) break;

          const maxUse = Math.floor(remainingSum / stack.denomination.value);
          const availableUse = Math.min(maxUse, stack.availableCount);

          if (availableUse > 0) {
            stack.useCount = availableUse;
            remainingSum -= availableUse * stack.denomination.value;
          }
        }
      }

      setFloatStacks(updatedStacks);
    },
    [floatStacks, targetSum]
  );

  // Handle input changes for individual denominations
  const handleUseCountChange = useCallback(
    (stackId: string, value: number | string) => {
      const numValue =
        typeof value === "string" ? parseFloat(value) || 0 : value;

      setFloatStacks((prev) =>
        prev.map((stack) => {
          if (stack.id === stackId) {
            const maxUse =
              direction === "OUTBOUND" ? stack.availableCount : Infinity;
            const clampedValue = Math.max(0, Math.min(numValue, maxUse));
            return { ...stack, useCount: clampedValue };
          }
          return stack;
        })
      );
    },
    [direction]
  );

  // Validation
  const isBreakdownValid = useMemo(() => {
    const total = currentTotal;
    return Math.abs(total - targetSum) < 0.01; // Allow for floating point precision
  }, [currentTotal, targetSum]);

  const remainingAmount = targetSum - currentTotal;

  // Handle breakdown submission
  const handleSubmitBreakdown = useCallback(async () => {
    if (!isBreakdownValid || !effectiveOrderId) {
      console.log("Cannot submit - invalid breakdown or no order ID:", {
        isBreakdownValid,
        orderId: effectiveOrderId,
      });
      return;
    }

    const breakdownData = floatStacks
      .filter((stack) => stack.useCount > 0)
      .map((stack) => ({
        orgDenominationId: stack.denomination.id, // Use actual denomination ID
        orgFloatStackId: stack.id,
        count: stack.useCount.toString(),
        direction: direction,
        status: "ACTIVE",
      }));

    console.log("Submitting breakdown data:", breakdownData);

    try {
      const result = await saveBreakdowns(breakdownData);
      console.log("Breakdown save result:", result);

      if (result?.success !== false) {
        setBreakdownCompleted(true);
        console.log("Breakdown submitted successfully");

        if (onBreakdownChange) {
          onBreakdownChange(breakdownData, true);
        }
      } else {
        console.error("Failed to save breakdown - result indicates failure");
      }
    } catch (error) {
      console.error("Failed to save breakdown:", error);
    }
  }, [
    isBreakdownValid,
    effectiveOrderId,
    floatStacks,
    direction,
    saveBreakdowns,
    onBreakdownChange,
  ]);

  // Debug logging
  console.log("🔍 FloatBreakdownForm Debug:", {
    direction,
    ticker,
    targetSum,
    activeSessionId: activeSession?._id,
    floatLoading,
    floatError,
    floatData,
    rawRepositories: rawRepositories?.length,
    repositories: repositories.length,
    selectedRepository,
    floatStacks: floatStacks.length,
    currentRepoFloatStacks: currentRepoFloatStacks.length,
  });

  if (floatLoading) {
    return (
      <Card withBorder>
        <Group gap="sm">
          <Loader size="sm" />
          <Text>Loading float data...</Text>
        </Group>
      </Card>
    );
  }

  if (floatError) {
    return (
      <Alert color="red" title="Error">
        {floatError}
      </Alert>
    );
  }

  // Show debugging info if no float stacks
  if (floatStacks.length === 0) {
    return (
      <Card withBorder>
        <Stack gap="md">
          <Title order={4}>
            {direction} Breakdown - {ticker}
          </Title>
          <Alert color="orange" title="No Float Data">
            <Stack gap="xs">
              <Text size="sm">
                No denomination data available for breakdown.
              </Text>
              <Text size="xs" c="dimmed">
                Debug info:
              </Text>
              <Text size="xs" c="dimmed">
                • Active Session: {activeSession?._id || "None"}
              </Text>
              <Text size="xs" c="dimmed">
                • Repositories: {repositories.length}
              </Text>
              <Text size="xs" c="dimmed">
                • Selected Repo: {selectedRepository || "None"}
              </Text>
              <Text size="xs" c="dimmed">
                • Float Data: {floatData ? "Loaded" : "Not loaded"}
              </Text>
              <Text size="xs" c="dimmed">
                • Ticker: {ticker}
              </Text>
            </Stack>
          </Alert>
        </Stack>
      </Card>
    );
  }

  return (
    <Card withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group gap="sm">
            {direction === "INBOUND" ? (
              <IconArrowDown size={20} color="green" />
            ) : (
              <IconArrowUp size={20} color="red" />
            )}
            <Title order={4}>
              {direction} Breakdown - {ticker}
            </Title>
          </Group>

          <Group gap="sm">
            <Text size="sm" c="dimmed">
              Target: {targetSum.toLocaleString()}
            </Text>
            <Text size="sm" fw={500} c={isBreakdownValid ? "green" : "red"}>
              Current: {currentTotal.toLocaleString()}
            </Text>
            {remainingAmount !== 0 && (
              <Text size="sm" c={remainingAmount > 0 ? "orange" : "red"}>
                Remaining: {remainingAmount.toLocaleString()}
              </Text>
            )}
          </Group>
        </Group>

        {/* Repository Selection */}
        {repositories.length > 1 && (
          <Select
            label="Repository"
            placeholder="Select a repository"
            value={selectedRepository}
            onChange={(value) => setSelectedRepository(value || "")}
            data={useMemo(
              () =>
                repositories.map((repo) => ({
                  value: repo.id,
                  label: repo.name,
                })),
              [repositories]
            )}
            disabled={disabled || breakdownCompleted}
          />
        )}

        {/* Auto-breakdown buttons */}
        {direction === "OUTBOUND" && !disabled && !breakdownCompleted && (
          <Group gap="xs">
            <Text size="sm" fw={500}>
              Quick Actions:
            </Text>
            {autoBreakdownOptions.map((option) => (
              <Button
                key={option.value}
                size="xs"
                variant={
                  autoBreakdownType === option.value ? "filled" : "light"
                }
                onClick={() => {
                  setAutoBreakdownType(option.value);
                  generateAutoBreakdown(option.value);
                }}
                leftSection={
                  option.value === "RESET" ? (
                    <IconRefresh size={14} />
                  ) : (
                    <IconCalculator size={14} />
                  )
                }
              >
                {option.name}
              </Button>
            ))}
          </Group>
        )}

        {/* Breakdown Table */}
        {floatStacks.length > 0 && (
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Denomination</Table.Th>
                <Table.Th>Available</Table.Th>
                <Table.Th>Use</Table.Th>
                <Table.Th>Subtotal</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {floatStacks.map((stack) => {
                const subtotal = stack.useCount * stack.denomination.value;
                const isOverAvailable = stack.useCount > stack.availableCount;

                return (
                  <Table.Tr key={stack.id}>
                    <Table.Td>
                      <Group gap="xs">
                        <IconCash size={16} />
                        <Text fw={500}>
                          {stack.denomination.value.toLocaleString()} {ticker}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text
                        c={stack.availableCount === 0 ? "dimmed" : undefined}
                      >
                        {stack.availableCount.toLocaleString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={stack.useCount}
                        onChange={(value) =>
                          handleUseCountChange(stack.id, value)
                        }
                        min={0}
                        max={
                          direction === "OUTBOUND"
                            ? stack.availableCount
                            : undefined
                        }
                        step={1}
                        size="sm"
                        style={{ width: 100 }}
                        disabled={disabled || breakdownCompleted}
                        error={isOverAvailable}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Text
                        fw={subtotal > 0 ? 500 : undefined}
                        c={isOverAvailable ? "red" : undefined}
                      >
                        {subtotal.toLocaleString()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}

        {/* Summary and Actions */}
        <Group justify="space-between" align="center">
          <Group gap="sm">
            {isBreakdownValid ? (
              <Badge color="green" leftSection={<IconCheck size={14} />}>
                Valid Breakdown
              </Badge>
            ) : (
              <Badge color="red" leftSection={<IconX size={14} />}>
                Invalid Breakdown
              </Badge>
            )}
          </Group>

          {!disabled && !breakdownCompleted && (
            <Button
              onClick={handleSubmitBreakdown}
              disabled={!isBreakdownValid}
              leftSection={<IconCheck size={16} />}
            >
              Submit Breakdown
            </Button>
          )}
        </Group>

        {breakdownCompleted && (
          <Alert color="green" title="Breakdown Completed">
            The breakdown has been saved successfully.
          </Alert>
        )}
      </Stack>
    </Card>
  );
}
