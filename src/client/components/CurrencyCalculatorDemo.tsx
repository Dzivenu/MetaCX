/**
 * CurrencyCalculatorDemo - Demo component showing real-time currency calculations
 * This demonstrates the functionality reproduced from the front implementation
 */

"use client";

import React from "react";
import {
  Box,
  Container,
  Title,
  Text,
  Grid,
  Paper,
  Group,
  ActionIcon,
  Badge,
  Alert,
} from "@mantine/core";
import {
  IconArrowsRightLeft,
  IconRefresh,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useCurrencyCalculator } from "@/client/hooks/useCurrencyCalculator";
import { CurrencySection } from "@/client/views/orders/steps/quote/CurrencySection";

export function CurrencyCalculatorDemo() {
  const calculator = useCurrencyCalculator({
    serviceFee: 2,
    networkFee: 0,
    useMockData: true,
    autoLoadFloatBalance: true,
  });

  const {
    inboundTicker,
    outboundTicker,
    inboundAmount,
    outboundAmount,
    spotRate,
    finalRate,
    margin,
    serviceFee,
    networkFee,
    isLoading,
    error,
    swapCurrencies,
    refreshRates,
    getFormattedRate,
    getFormattedMargin,
  } = calculator;

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert color="red" icon={<IconInfoCircle size={16} />}>
          Error loading currency calculator: {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <Title order={1} className="text-color-text-primary mb-2">
            Real-Time Currency Calculator
          </Title>
          <Text className="text-color-text-secondary mb-4">
            Reproduced from /front implementation with TypeScript and real-time
            calculations
          </Text>
          <Group justify="center" gap="xs">
            <Badge color="blue" variant="light">
              Base Currency: CAD
            </Badge>
            <Badge color="green" variant="light">
              Real-time FX
            </Badge>
            <Badge color="orange" variant="light">
              Auto Float Balance
            </Badge>
          </Group>
        </div>

        {/* Main Calculator Interface */}
        <Paper
          p="xl"
          radius="md"
          withBorder
          className="bg-color-bg-surface border-color-border-base"
        >
          <div className="@container">
            <Grid gutter="xl">
              {/* Inbound Section */}
              <Grid.Col span={{ base: 12, md: 5 }}>
                <CurrencySection
                  type="INBOUND"
                  ticker={inboundTicker}
                  amount={inboundAmount}
                  onTickerChange={() => {}} // Handled by calculator
                  onAmountChange={() => {}} // Handled by calculator
                  calculator={calculator}
                />
              </Grid.Col>

              {/* Swap Icon */}
              <Grid.Col
                span={{ base: 12, md: 2 }}
                className="flex items-center justify-center"
              >
                <ActionIcon
                  size="xl"
                  variant="light"
                  className="@md:mt-8 bg-color-primary/10 hover:bg-color-primary/20 text-color-primary"
                  onClick={swapCurrencies}
                  disabled={isLoading}
                >
                  <IconArrowsRightLeft size={24} />
                </ActionIcon>
              </Grid.Col>

              {/* Outbound Section */}
              <Grid.Col span={{ base: 12, md: 5 }}>
                <CurrencySection
                  type="OUTBOUND"
                  ticker={outboundTicker}
                  amount={outboundAmount}
                  onTickerChange={() => {}} // Handled by calculator
                  onAmountChange={() => {}} // Handled by calculator
                  readOnly={true}
                  calculator={calculator}
                />
              </Grid.Col>
            </Grid>

            {/* Refresh Rates */}
            <Group justify="center" className="mt-6">
              <ActionIcon
                variant="outline"
                size="lg"
                onClick={refreshRates}
                disabled={isLoading}
                className="btn-secondary"
              >
                <IconRefresh size={20} />
              </ActionIcon>
              <Text size="sm" className="text-color-text-secondary">
                Click to refresh currency rates
              </Text>
            </Group>
          </div>
        </Paper>

        {/* Real-time Quote Details */}
        <Paper
          p="lg"
          radius="md"
          withBorder
          className="bg-color-bg-surface border-color-border-base"
        >
          <Title order={3} className="text-color-text-primary mb-4">
            Real-time Quote Details
          </Title>
          <div className="@container">
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Box className="text-center">
                  <Text
                    size="xs"
                    className="text-color-text-secondary uppercase font-medium mb-1"
                  >
                    Spot Rate
                  </Text>
                  <Text
                    size="lg"
                    className="text-color-text-primary font-semibold"
                  >
                    {spotRate.toFixed(6)}
                  </Text>
                  <Text size="xs" className="text-color-text-tertiary">
                    {inboundTicker}/{outboundTicker}
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Box className="text-center">
                  <Text
                    size="xs"
                    className="text-color-text-secondary uppercase font-medium mb-1"
                  >
                    Final Rate
                  </Text>
                  <Text
                    size="lg"
                    className="text-color-text-primary font-semibold"
                  >
                    {getFormattedRate()}
                  </Text>
                  <Text size="xs" className="text-color-text-tertiary">
                    Including fees
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Box className="text-center">
                  <Text
                    size="xs"
                    className="text-color-text-secondary uppercase font-medium mb-1"
                  >
                    Margin
                  </Text>
                  <Text
                    size="lg"
                    className="text-color-text-primary font-semibold"
                  >
                    {getFormattedMargin()}%
                  </Text>
                  <Text size="xs" className="text-color-text-tertiary">
                    Applied margin
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Box className="text-center">
                  <Text
                    size="xs"
                    className="text-color-text-secondary uppercase font-medium mb-1"
                  >
                    Service Fee
                  </Text>
                  <Text
                    size="lg"
                    className="text-color-text-primary font-semibold"
                  >
                    ${serviceFee.toFixed(2)}
                  </Text>
                  <Text size="xs" className="text-color-text-tertiary">
                    Processing fee
                  </Text>
                </Box>
              </Grid.Col>
            </Grid>
          </div>
        </Paper>

        {/* Instructions */}
        <Paper
          p="md"
          radius="sm"
          className="bg-color-bg-elevated border border-color-border-base"
        >
          <Group gap="md" align="flex-start">
            <IconInfoCircle
              size={20}
              className="text-color-primary flex-shrink-0 mt-1"
            />
            <div>
              <Text
                size="sm"
                className="text-color-text-primary font-medium mb-2"
              >
                Real-time Currency Calculator Features:
              </Text>
              <ul className="text-color-text-secondary text-sm space-y-1 ml-4">
                <li>
                  • Enter an amount in the INBOUND field to see real-time
                  OUTBOUND calculations
                </li>
                <li>• Swap currencies using the arrows icon</li>
                <li>• View available float balance for outbound currencies</li>
                <li>
                  • All calculations use the base currency (CAD) for FX
                  conversions
                </li>
                <li>
                  • Margins and fees are applied automatically based on currency
                  type
                </li>
                <li>
                  • Crypto currencies show 8 decimal places, fiat shows 2
                  decimal places
                </li>
              </ul>
            </div>
          </Group>
        </Paper>
      </div>
    </Container>
  );
}
