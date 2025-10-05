"use client";

import React, { useEffect, useState } from "react";
import {
  LoadingOverlay,
  Alert,
  Stack,
  Text,
  Group,
  Badge,
  Button,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCurrencyDollar,
  IconRefresh,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useAppCurrencies } from "@/client/hooks/useAppCurrenciesConvex";
import { AppCurrenciesDataTable } from "./AppCurrenciesDataTable";

export default function AppCurrenciesTab({
  active,
  refreshSignal,
}: {
  active?: boolean;
  refreshSignal?: number;
}) {
  const { appCurrencies, loading, error, refresh, refreshFromAPI, refreshing } =
    useAppCurrencies();

  // Refresh when tab becomes active
  useEffect(() => {
    if (active) refresh();
  }, [active]);

  // Refresh when an external signal changes
  useEffect(() => {
    if (typeof refreshSignal === "number") refresh();
  }, [refreshSignal]);

  const handleRefreshFromAPI = async () => {
    const result = await refreshFromAPI();

    if (result) {
      notifications.show({
        title: "Success",
        message: `Refreshed ${result.totalCurrencies} currencies from ${result.baseCurrency} rates`,
        color: "green",
      });
    }
  };

  if (loading) {
    return (
      <div style={{ position: "relative", minHeight: "200px" }}>
        <LoadingOverlay visible />
      </div>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
        {error}
      </Alert>
    );
  }

  // Group currencies by type for summary
  const currencyTypes = appCurrencies.reduce(
    (acc, currency) => {
      acc[currency.type] = (acc[currency.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Stack gap="md">
      {/* Header with Summary and Refresh Button */}
      <Group justify="space-between">
        <Group gap="md">
          <Text size="sm" c="dimmed">
            Total: {appCurrencies.length} currencies
          </Text>
          {Object.entries(currencyTypes).map(([type, count]) => (
            <Badge key={type} variant="light" size="sm">
              {type}: {count}
            </Badge>
          ))}
        </Group>

        <Button
          leftSection={<IconRefresh size={16} />}
          onClick={handleRefreshFromAPI}
          loading={refreshing}
          variant="light"
          size="sm"
        >
          Refresh from API
        </Button>
      </Group>

      {/* Content Area */}
      {appCurrencies.length === 0 ? (
        <Alert
          icon={<IconCurrencyDollar size={16} />}
          title="No Data"
          color="blue"
        >
          No global currency rates found in the system. Click "Refresh from API"
          to fetch the latest rates.
        </Alert>
      ) : (
        <AppCurrenciesDataTable appCurrencies={appCurrencies} />
      )}
    </Stack>
  );
}
