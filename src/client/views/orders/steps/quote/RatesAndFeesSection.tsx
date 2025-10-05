/**
 * RatesAndFeesSection - Editable rates and fees inputs
 *
 * This component reproduces the /front functionality for manually adjusting:
 * - Final Selling Rate: Exchange rate including all margins and fees
 * - Margin: Percentage margin applied to the base rate
 * - Service Fee: Fixed processing fee in CAD
 * - Network Fee: Blockchain network fee in CAD
 *
 * Features:
 * - Real-time quote recalculation when values change
 * - Lock/unlock individual fields to prevent automatic updates
 * - Reset to calculated defaults
 * - Monospace font for numeric precision
 * - Proper decimal places based on currency type
 *
 * When rates or fees are manually adjusted, the calculator automatically
 * recalculates the quote amounts to reflect the changes, providing the same
 * experience as the /front implementation.
 */

"use client";

import React from "react";
import {
  Card,
  Title,
  Grid,
  NumberInput,
  Text,
  Stack,
  Group,
  Button,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { IconLock, IconLockOpen, IconInfoCircle } from "@tabler/icons-react";
import { useCurrencyCalculator } from "@/client/hooks/useCurrencyCalculator";

interface RatesAndFeesSectionProps {
  calculator: ReturnType<typeof useCurrencyCalculator>;
}

export function RatesAndFeesSection({ calculator }: RatesAndFeesSectionProps) {
  const {
    finalRate,
    margin,
    serviceFee,
    networkFee,
    updateServiceFee,
    updateNetworkFee,
    updateMargin,
    updateFinalRate,
    resetLocks,
    inboundTicker,
    outboundTicker,
    isLoading,
  } = calculator;

  // Track locked state for each field
  const [lockedFields, setLockedFields] = React.useState({
    finalRate: false,
    margin: false,
    serviceFee: false,
    networkFee: false,
  });

  const toggleLock = (field: keyof typeof lockedFields) => {
    setLockedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleFinalRateChange = (value: number | string) => {
    if (lockedFields.finalRate) return;
    const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
    updateFinalRate(numValue);
  };

  const handleMarginChange = (value: number | string) => {
    if (lockedFields.margin) return;
    const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
    updateMargin(numValue);
  };

  const handleServiceFeeChange = (value: number | string) => {
    if (lockedFields.serviceFee) return;
    const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
    updateServiceFee(numValue);
  };

  const handleNetworkFeeChange = (value: number | string) => {
    if (lockedFields.networkFee) return;
    const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
    updateNetworkFee(numValue);
  };

  const resetToDefaults = () => {
    // Reset all locked states to allow automatic recalculation
    resetLocks();

    // Reset to default values
    updateServiceFee(2); // Default service fee
    updateNetworkFee(0); // Default network fee

    // Reset local locked field states
    setLockedFields({
      finalRate: false,
      margin: false,
      serviceFee: false,
      networkFee: false,
    });
  };

  return (
    <Card padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={4} fw={600}>
            Rates & Fees
          </Title>
          <Group gap="xs">
            <Tooltip label="Reset to calculated defaults">
              <Button
                variant="outline"
                size="xs"
                onClick={resetToDefaults}
                disabled={isLoading}
              >
                Reset
              </Button>
            </Tooltip>
            <Tooltip label="Lock/unlock fields to prevent automatic recalculation">
              <ActionIcon variant="outline" size="sm">
                <IconInfoCircle size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <Grid gutter="md">
          {/* Final Selling Rate */}
          <Grid.Col span={{ base: 6, sm: 3 }}>
            <Stack gap="xs">
              <Group gap="xs" align="center">
                <Text size="sm" fw={500}>
                  Final Selling Rate
                </Text>
                <ActionIcon
                  variant="subtle"
                  size="xs"
                  onClick={() => toggleLock("finalRate")}
                  color={lockedFields.finalRate ? "red" : "gray"}
                >
                  {lockedFields.finalRate ? (
                    <IconLock size={12} />
                  ) : (
                    <IconLockOpen size={12} />
                  )}
                </ActionIcon>
              </Group>
              <NumberInput
                value={finalRate}
                onChange={handleFinalRateChange}
                decimalScale={6}
                step={0.000001}
                min={0}
                readOnly={lockedFields.finalRate}
                placeholder="0.000000"
                rightSection={
                  <Text size="xs" c="dimmed">
                    {inboundTicker}/{outboundTicker}
                  </Text>
                }
                styles={{
                  input: {
                    fontFamily: "monospace",
                  },
                }}
              />
              <Text size="xs" c="dimmed">
                Exchange rate including all margins and fees
              </Text>
            </Stack>
          </Grid.Col>

          {/* Margin */}
          <Grid.Col span={{ base: 6, sm: 3 }}>
            <Stack gap="xs">
              <Group gap="xs" align="center">
                <Text size="sm" fw={500}>
                  Margin
                </Text>
                <ActionIcon
                  variant="subtle"
                  size="xs"
                  onClick={() => toggleLock("margin")}
                  color={lockedFields.margin ? "red" : "gray"}
                >
                  {lockedFields.margin ? (
                    <IconLock size={12} />
                  ) : (
                    <IconLockOpen size={12} />
                  )}
                </ActionIcon>
              </Group>
              <NumberInput
                value={margin}
                onChange={handleMarginChange}
                decimalScale={2}
                step={0.1}
                min={0}
                max={100}
                readOnly={lockedFields.margin}
                placeholder="0.00"
                rightSection={
                  <Text size="xs" c="dimmed">
                    %
                  </Text>
                }
                styles={{
                  input: {
                    fontFamily: "monospace",
                  },
                }}
              />
              <Text size="xs" c="dimmed">
                Percentage margin applied to the base rate
              </Text>
            </Stack>
          </Grid.Col>

          {/* Service Fee */}
          <Grid.Col span={{ base: 6, sm: 3 }}>
            <Stack gap="xs">
              <Group gap="xs" align="center">
                <Text size="sm" fw={500}>
                  Service Fee
                </Text>
                <ActionIcon
                  variant="subtle"
                  size="xs"
                  onClick={() => toggleLock("serviceFee")}
                  color={lockedFields.serviceFee ? "red" : "gray"}
                >
                  {lockedFields.serviceFee ? (
                    <IconLock size={12} />
                  ) : (
                    <IconLockOpen size={12} />
                  )}
                </ActionIcon>
              </Group>
              <NumberInput
                value={serviceFee}
                onChange={handleServiceFeeChange}
                decimalScale={2}
                step={0.01}
                min={0}
                readOnly={lockedFields.serviceFee}
                placeholder="0.00"
                leftSection={
                  <Text size="xs" c="dimmed">
                    $
                  </Text>
                }
                styles={{
                  input: {
                    fontFamily: "monospace",
                  },
                }}
              />
              <Text size="xs" c="dimmed">
                Fixed processing fee in CAD
              </Text>
            </Stack>
          </Grid.Col>

          {/* Network Fee */}
          <Grid.Col span={{ base: 6, sm: 3 }}>
            <Stack gap="xs">
              <Group gap="xs" align="center">
                <Text size="sm" fw={500}>
                  Network Fee
                </Text>
                <ActionIcon
                  variant="subtle"
                  size="xs"
                  onClick={() => toggleLock("networkFee")}
                  color={lockedFields.networkFee ? "red" : "gray"}
                >
                  {lockedFields.networkFee ? (
                    <IconLock size={12} />
                  ) : (
                    <IconLockOpen size={12} />
                  )}
                </ActionIcon>
              </Group>
              <NumberInput
                value={networkFee}
                onChange={handleNetworkFeeChange}
                decimalScale={6}
                step={0.000001}
                min={0}
                readOnly={lockedFields.networkFee}
                placeholder="0.000000"
                leftSection={
                  <Text size="xs" c="dimmed">
                    $
                  </Text>
                }
                styles={{
                  input: {
                    fontFamily: "monospace",
                  },
                }}
              />
              <Text size="xs" c="dimmed">
                Blockchain network fee in CAD
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
}
