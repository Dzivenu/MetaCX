"use client";

import React from "react";
import { Box, Group, Text, Button, Badge, Stack, Flex } from "@mantine/core";
import { IconRefresh, IconClock } from "@tabler/icons-react";

interface SpotRatesSectionProps {
  inboundTicker: string;
  outboundTicker: string;
  lastRefresh: Date;
  onRefresh: () => void;
  loading: boolean;
}

export function SpotRatesSection({
  inboundTicker,
  outboundTicker,
  lastRefresh,
  onRefresh,
  loading,
}: SpotRatesSectionProps) {
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Mock spot rates - in real app this would come from API
  const getSpotRate = (from: string, to: string) => {
    const rates: Record<string, Record<string, number>> = {
      BTC: { CAD: 148092 },
      CAD: { BTC: 0.00000675 },
      ETH: { CAD: 4250 },
      CAD: { ETH: 0.000235 },
    };
    return rates[from]?.[to] || 0;
  };

  const spotRate = getSpotRate(inboundTicker, outboundTicker);
  const reverseRate = getSpotRate(outboundTicker, inboundTicker);

  return (
    <Group justify="space-between" align="center">
      {/* Spot FX Rates */}
      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          Spot FX
        </Text>
        <Group gap="md">
          <Text size="sm">
            1 {inboundTicker} = {spotRate.toLocaleString()} {outboundTicker}
          </Text>
          <Text size="sm">
            1 {outboundTicker} = {reverseRate.toLocaleString()} {inboundTicker}
          </Text>
        </Group>
      </Stack>

      {/* Refresh Button */}
      <Group gap="md">
        <Badge
          leftSection={<IconClock size={12} />}
          variant="light"
          color="yellow"
          size="sm"
        >
          {formatTimeAgo(lastRefresh)}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          leftSection={<IconRefresh size={16} />}
          onClick={onRefresh}
          loading={loading}
          color="orange"
        >
          Refresh
        </Button>
      </Group>
    </Group>
  );
}
