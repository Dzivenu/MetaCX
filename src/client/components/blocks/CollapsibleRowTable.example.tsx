"use client";

import React from "react";
import {
  Badge,
  Text,
  Group,
  Box,
  Stack,
  Button,
} from "@mantine/core";
import { CollapsibleRowTable } from "./CollapsibleRowTable";
import { DataTableColumn } from "mantine-datatable";

// Example data structure
interface ExampleRepository {
  id: string;
  name: string;
  typeOf: string;
  currencyType: string;
  form: string;
  key: string;
  currencyTickers: string[];
  floatCountRequired: boolean;
  active: boolean;
  floatThresholdBottom: number;
  floatThresholdTop: number;
}

// Example usage component
export function CollapsibleRowTableExample() {
  // Sample data
  const repositories: ExampleRepository[] = [
    {
      id: "1",
      name: "Main Repository",
      typeOf: "PRIMARY",
      currencyType: "FIAT",
      form: "CASH",
      key: "main-repo",
      currencyTickers: ["USD", "CAD", "EUR"],
      floatCountRequired: true,
      active: true,
      floatThresholdBottom: 1000,
      floatThresholdTop: 10000,
    },
    {
      id: "2",
      name: "Crypto Repository",
      typeOf: "SECONDARY",
      currencyType: "CRYPTO",
      form: "DIGITAL",
      key: "crypto-repo",
      currencyTickers: ["BTC", "ETH"],
      floatCountRequired: false,
      active: true,
      floatThresholdBottom: 0.1,
      floatThresholdTop: 10,
    },
  ];

  // Define table columns
  const columns: DataTableColumn<ExampleRepository>[] = [
    {
      accessor: "name",
      title: "Name",
      render: ({ name }) => <Text fw={500}>{name}</Text>,
    },
    {
      accessor: "typeOf",
      title: "Type",
      render: ({ typeOf }) => (
        <Badge variant="light" color="blue">
          {typeOf}
        </Badge>
      ),
    },
    {
      accessor: "currencyType",
      title: "Currency Type",
      render: ({ currencyType }) => (
        <Badge variant="light" color="cyan">
          {currencyType}
        </Badge>
      ),
    },
    {
      accessor: "form",
      title: "Form",
      render: ({ form }) => (
        <Badge variant="light" color="grape">
          {form}
        </Badge>
      ),
    },
    {
      accessor: "key",
      title: "Key",
      render: ({ key }) => (
        <Text size="sm" c="dimmed">
          {key}
        </Text>
      ),
    },
    {
      accessor: "currencyTickers",
      title: "Currencies",
      render: ({ currencyTickers }) => (
        <Group gap="xs">
          {currencyTickers.slice(0, 3).map((ticker) => (
            <Badge key={ticker} size="xs" variant="light">
              {ticker}
            </Badge>
          ))}
          {currencyTickers.length > 3 && (
            <Text size="xs" c="dimmed">
              +{currencyTickers.length - 3} more
            </Text>
          )}
        </Group>
      ),
    },
    {
      accessor: "active",
      title: "Status",
      render: ({ active }) => (
        <Badge variant="light" color={active ? "green" : "red"}>
          {active ? "ACTIVE" : "INACTIVE"}
        </Badge>
      ),
    },
  ];

  // Render expanded content
  const renderExpandedContent = (repository: ExampleRepository, collapse: () => void) => {
    return (
      <Box p="md">
        <Stack gap="md">
          <Group grow>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Name
              </Text>
              <Text>{repository.name}</Text>
            </Box>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Key
              </Text>
              <Text>{repository.key}</Text>
            </Box>
          </Group>

          <Group grow>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Type
              </Text>
              <Badge variant="light" color="blue">
                {repository.typeOf}
              </Badge>
            </Box>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Currency Type
              </Text>
              <Badge variant="light" color="cyan">
                {repository.currencyType}
              </Badge>
            </Box>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Form
              </Text>
              <Badge variant="light" color="grape">
                {repository.form}
              </Badge>
            </Box>
          </Group>

          <Group grow>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Float Threshold Bottom
              </Text>
              <Text>{repository.floatThresholdBottom}</Text>
            </Box>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Float Threshold Top
              </Text>
              <Text>{repository.floatThresholdTop}</Text>
            </Box>
          </Group>

          <Box>
            <Text size="sm" fw={500} c="dimmed">
              Currency Tickers
            </Text>
            <Group gap="xs" mt="xs">
              {repository.currencyTickers.map((ticker) => (
                <Badge key={ticker} size="sm" variant="light">
                  {ticker}
                </Badge>
              ))}
            </Group>
          </Box>

          <Group>
            <Badge
              variant="light"
              color={repository.floatCountRequired ? "green" : "orange"}
            >
              Float Count Required: {repository.floatCountRequired ? "YES" : "NO"}
            </Badge>
            <Badge variant="light" color={repository.active ? "green" : "red"}>
              Status: {repository.active ? "ACTIVE" : "INACTIVE"}
            </Badge>
          </Group>

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={collapse}>
              Close Details
            </Button>
            <Button>
              Edit Repository
            </Button>
          </Group>
        </Stack>
      </Box>
    );
  };

  const handleRefresh = () => {
    // Refresh logic would go here
  };

  return (
    <CollapsibleRowTable
      records={repositories}
      idAccessor="id"
      columns={columns}
      renderExpandedContent={renderExpandedContent}
      title="Repository List"
      onRefresh={handleRefresh}
      allowMultiple={false}
      emptyStateMessage="No repositories found"
    />
  );
}

export default CollapsibleRowTableExample;
