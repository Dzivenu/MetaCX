"use client";

import React from "react";
import { Badge, Text, Group, Stack } from "@mantine/core";
import { DataTable } from "mantine-datatable";
import type { AppCurrency } from "@/client/hooks/useAppCurrenciesConvex";

interface AppCurrenciesDataTableProps {
  appCurrencies: AppCurrency[];
}

export function AppCurrenciesDataTable({
  appCurrencies,
}: AppCurrenciesDataTableProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "CRYPTOCURRENCY":
        return "orange";
      case "FIAT":
        return "blue";
      case "METAL":
        return "yellow";
      default:
        return "gray";
    }
  };

  const formatRate = (rate: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(rate);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <DataTable
      withTableBorder
      borderRadius="sm"
      withColumnBorders
      striped
      highlightOnHover
      records={appCurrencies}
      columns={[
        {
          accessor: "ticker",
          title: "Ticker",
          width: 100,
          render: ({ ticker }) => (
            <Text fw={600} size="sm">
              {ticker}
            </Text>
          ),
        },
        {
          accessor: "name",
          title: "Name",
          width: 200,
          render: ({ name }) => (
            <Text size="sm" truncate>
              {name}
            </Text>
          ),
        },
        {
          accessor: "type",
          title: "Type",
          width: 140,
          render: ({ type }) => (
            <Badge color={getTypeColor(type)} variant="light" size="sm">
              {type}
            </Badge>
          ),
        },
        {
          accessor: "baseRateTicker",
          title: "Base Rate",
          width: 100,
          render: ({ baseRateTicker }) => (
            <Text size="sm" fw={500}>
              {baseRateTicker}
            </Text>
          ),
        },
        {
          accessor: "network",
          title: "Network",
          width: 120,
          render: ({ network }) => (
            <Text size="sm" c={network ? "dark" : "dimmed"}>
              {network || "N/A"}
            </Text>
          ),
        },
        {
          accessor: "contract",
          title: "Contract Address",
          width: 220,
          render: ({ contract }) => (
            <Text size="sm" c={contract ? "dark" : "dimmed"} truncate>
              {contract || "N/A"}
            </Text>
          ),
        },
        {
          accessor: "chainId",
          title: "Chain ID",
          width: 120,
          render: ({ chainId }) => (
            <Text size="sm" c={chainId ? "dark" : "dimmed"}>
              {chainId || "N/A"}
            </Text>
          ),
        },
        {
          accessor: "rateApi",
          title: "Rate API",
          width: 220,
          render: ({ rateApi }) => (
            <Text size="sm" c={rateApi ? "dark" : "dimmed"} truncate>
              {rateApi || "N/A"}
            </Text>
          ),
        },
        {
          accessor: "rateApiIdentifier",
          title: "Rate API Identifier",
          width: 220,
          render: ({ rateApiIdentifier }) => (
            <Text size="sm" c={rateApiIdentifier ? "dark" : "dimmed"}>
              {rateApiIdentifier || "N/A"}
            </Text>
          ),
        },
        {
          accessor: "icon",
          title: "Icon",
          width: 60,
          render: ({ icon }) =>
            icon ? (
              <img
                src={icon}
                alt="Currency icon"
                style={{ width: 24, height: 24, borderRadius: "50%" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <Text size="xs" c="dimmed">
                N/A
              </Text>
            ),
        },
        {
          accessor: "iconUrl",
          title: "Icon URL",
          width: 240,
          render: ({ icon }) => (
            <Text size="sm" c={icon ? "dark" : "dimmed"} truncate>
              {icon || "N/A"}
            </Text>
          ),
        },
        {
          accessor: "rate",
          title: "Rate",
          width: 150,
          textAlign: "right",
          render: ({ rate }) => (
            <Text size="sm" fw={500} family="monospace">
              {formatRate(rate)}
            </Text>
          ),
        },
        {
          accessor: "rateUpdatedAt",
          title: "Last Updated",
          width: 180,
          render: ({ rateUpdatedAt }) => (
            <Text size="xs" c="dimmed">
              {formatDate(rateUpdatedAt)}
            </Text>
          ),
        },
      ]}
      emptyState={
        <Stack align="center" gap="md" py="xl">
          <Text size="lg" fw={500} c="dimmed">
            No App Currencies Found
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            There are no global currency rates available at the moment.
          </Text>
        </Stack>
      }
    />
  );
}
