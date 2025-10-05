"use client";

import React, { useMemo } from "react";
import {
  Box,
  Title,
  Group,
  Select,
  NumberInput,
  Text,
  Badge,
  Loader,
  Stack,
  Flex,
} from "@mantine/core";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import { useCurrencyCalculator } from "@/client/hooks/useCurrencyCalculator";

interface CurrencySectionProps {
  type: "INBOUND" | "OUTBOUND";
  ticker: string;
  amount: number;
  onTickerChange: (ticker: string) => void;
  onAmountChange: (amount: number) => void;
  readOnly?: boolean;
  calculator?: ReturnType<typeof useCurrencyCalculator>;
}

export function CurrencySection({
  type,
  ticker,
  amount,
  onTickerChange,
  onAmountChange,
  readOnly = false,
  calculator,
}: CurrencySectionProps) {
  // Get currency info from calculator if available
  const getCurrencyInfo = (ticker: string) => {
    if (calculator?.currencies) {
      const currency = calculator.currencies.find((c) => c.ticker === ticker);
      return {
        name: currency?.name || ticker,
        flag: getFlagEmoji(ticker),
        icon: getCurrencyIcon(ticker),
        currency,
      };
    }
    return {
      name: ticker,
      flag: getFlagEmoji(ticker),
      icon: getCurrencyIcon(ticker),
      currency: null,
    };
  };

  const getFlagEmoji = (ticker: string) => {
    const flags: Record<string, string> = {
      CAD: "🇨🇦",
      USD: "🇺🇸",
      EUR: "🇪🇺",
      GBP: "🇬🇧",
      BTC: "₿",
      ETH: "Ξ",
    };
    return flags[ticker] || "💰";
  };

  const getCurrencyIcon = (ticker: string) => {
    return type === "INBOUND" ? (
      <IconTrendingDown size={20} />
    ) : (
      <IconTrendingUp size={20} />
    );
  };

  const currencyInfo = getCurrencyInfo(ticker);

  // Get available float from calculator if available
  const availableFloat =
    calculator && type === "OUTBOUND"
      ? calculator.outboundFloatBalance || "Loading..."
      : "";

  // Memoize currency options to avoid recreating the array each render (prevents Select thrashing)
  const currenciesKey = useMemo(
    () => (calculator?.currencies || []).map((c) => c.ticker).join(","),
    [calculator?.currencies]
  );

  const currencyOptions = useMemo(
    () =>
      (calculator?.currencies || []).map((c) => ({
        value: c.ticker,
        label: `${getFlagEmoji(c.ticker)} ${c.ticker} - ${c.name}`,
      })),
    [currenciesKey]
  );

  // Handle amount change with real-time calculation
  const handleAmountChange = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;

    // Guard against redundant updates
    if (numValue === amount) return;

    if (calculator) {
      if (type === "INBOUND") {
        calculator.updateInboundAmount(numValue);
      } else {
        calculator.updateOutboundAmount(numValue);
      }
    }

    onAmountChange(numValue);
  };

  // Handle currency change with recalculation
  const handleCurrencyChange = (newTicker: string) => {
    // Guard against redundant updates
    if (!newTicker || newTicker === ticker) return;

    if (calculator) {
      if (type === "INBOUND") {
        calculator.changeInboundCurrency(newTicker);
      } else {
        calculator.changeOutboundCurrency(newTicker);
      }
    }

    onTickerChange(newTicker);
  };

  return (
    <Stack gap="md">
      {/* Section Header */}
      <Group justify="space-between" align="center">
        <Group gap="xs">
          {getCurrencyIcon(ticker)}
          <Title order={4} c={type === "INBOUND" ? "red" : "teal"}>
            {type}
          </Title>
        </Group>
        {type === "OUTBOUND" && (
          <Text size="xs" c="dimmed">
            Available float
          </Text>
        )}
      </Group>

      {/* Currency Selector */}
      <Select
        data={currencyOptions}
        value={ticker}
        onChange={(value) => handleCurrencyChange(value || "")}
        size="lg"
        disabled={calculator?.isLoading}
        placeholder={
          calculator?.isLoading ? "Loading currencies..." : "Select currency"
        }
        rightSection={calculator?.isLoading ? <Loader size="xs" /> : null}
      />

      {/* Amount Input */}
      <NumberInput
        value={amount}
        onChange={handleAmountChange}
        size="xl"
        decimalScale={
          currencyInfo.currency?.typeof?.toUpperCase() === "CRYPTOCURRENCY"
            ? 8
            : 2
        }
        step={
          currencyInfo.currency?.typeof?.toUpperCase() === "CRYPTOCURRENCY"
            ? 0.00000001
            : 0.01
        }
        min={0}
        readOnly={readOnly}
        placeholder="0.00"
        rightSection={calculator?.isLoading ? <Loader size="xs" /> : null}
        styles={{
          input: {
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: 600,
          },
        }}
      />

      {/* Available Float Display */}
      {type === "OUTBOUND" && availableFloat && (
        <Stack gap="xs" align="center">
          <Group justify="center" gap="xs">
            <Text size="sm" c="dimmed" ta="center">
              Available: {availableFloat}
            </Text>
            {calculator?.loadingFloatBalance && <Loader size="xs" />}
          </Group>
          {calculator?.outboundFloatBalanceCAD && (
            <Text size="xs" c="dimmed">
              (≈ ${calculator.outboundFloatBalanceCAD} CAD)
            </Text>
          )}
        </Stack>
      )}

      {/* Lock Icon for Read-only */}
      {readOnly && (
        <Flex justify="center">
          <Badge color="gray" variant="light" size="sm">
            🔒 Read Only
          </Badge>
        </Flex>
      )}
    </Stack>
  );
}
