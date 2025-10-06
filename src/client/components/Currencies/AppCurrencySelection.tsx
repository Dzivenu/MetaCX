"use client";

import React, { useState } from "react";
import {
  Container,
  Stack,
  Title,
  TextInput,
  Grid,
  Card,
  Group,
  Text,
  LoadingOverlay,
  Alert,
  Badge,
  Button,
} from "@mantine/core";
import { IconSearch, IconAlertCircle } from "@tabler/icons-react";
import { useCurrencyCreation } from "@/client/contexts/CurrencyCreationContext";
import { useCurrencies } from "@/client/hooks/useCurrenciesConvex";
import { useAppCurrencies } from "@/client/hooks/useAppCurrenciesConvex";
import type { AppCurrency } from "@/client/hooks/useAppCurrenciesConvex";

export const AppCurrencySelection: React.FC = () => {
  const { setSelectedCurrency, setCurrentStep } = useCurrencyCreation();
  const { appCurrencies, loading, error } = useAppCurrencies();
  const { currencies } = useCurrencies();
  const [searchQuery, setSearchQuery] = useState("");

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

  const createdTickers = new Set(currencies.map((c) => c.ticker));
  const filteredCurrencies = appCurrencies
    .filter((currency) => !createdTickers.has(currency.ticker))
    .filter(
      (currency) =>
        currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        currency.ticker.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleCurrencySelect = (appCurrency: AppCurrency) => {
    // Convert AppCurrency to the expected Currency format for the context
    const currency = {
      id: appCurrency.id,
      name: appCurrency.name,
      ticker: appCurrency.ticker,
      symbol: appCurrency.ticker, // Use ticker as symbol
      type: appCurrency.type.toLowerCase(), // Convert to lowercase format expected by context
      rate: appCurrency.rate,
      typeof: appCurrency.type.toLowerCase(),
      network: appCurrency.network,
      contract: appCurrency.contract,
      chainId: appCurrency.chainId,
      rateApi: appCurrency.rateApi,
      rateApiIdentifier: appCurrency.rateApiIdentifier,
      icon: appCurrency.icon,
    };

    setSelectedCurrency(currency);
    setCurrentStep(1); // Move to details step
  };

  if (loading) {
    return (
      <Container size="lg">
        <div style={{ position: "relative", minHeight: "400px" }}>
          <LoadingOverlay visible />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        <div>
          <Title order={2}>Select Currency from App Database</Title>
          <Text c="dimmed" size="sm" mt="xs">
            Choose a currency from the available global currency rates in your
            system
          </Text>
        </div>

        <TextInput
          placeholder="Search currencies by name or ticker..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />

        {appCurrencies.length === 0 ? (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="No App Currencies Available"
            color="blue"
          >
            No global currency rates found in the system. Please go to the "App
            Currencies" tab and click "Refresh from API" to fetch the latest
            rates first.
          </Alert>
        ) : (
          <Grid>
            {filteredCurrencies.map((currency) => (
              <Grid.Col key={currency.id} span={{ base: 12, sm: 6, md: 4 }}>
                <Card
                  shadow="sm"
                  padding="lg"
                  radius="md"
                  withBorder
                  style={{
                    cursor: "pointer",
                    transition: "transform 0.2s",
                  }}
                  className="hover:transform hover:scale-105"
                  onClick={() => handleCurrencySelect(currency)}
                >
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Group gap="md">
                        {currency.icon && (
                          <img
                            src={currency.icon}
                            alt={currency.name}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <div>
                          <Text fw={600} size="lg">
                            {currency.ticker}
                          </Text>
                          <Text size="sm" c="dimmed" truncate>
                            {currency.name}
                          </Text>
                        </div>
                      </Group>
                      <Badge
                        color={getTypeColor(currency.type)}
                        variant="light"
                        size="sm"
                      >
                        {currency.type}
                      </Badge>
                    </Group>

                    <Group justify="space-between">
                      <div>
                        <Text size="xs" c="dimmed">
                          Rate vs {currency.baseRateTicker}
                        </Text>
                        <Text size="sm" fw={500} ff="monospace">
                          {new Intl.NumberFormat("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 8,
                          }).format(currency.rate)}
                        </Text>
                      </div>
                      <Button
                        variant="light"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCurrencySelect(currency);
                        }}
                      >
                        Select
                      </Button>
                    </Group>

                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">
                        Updated:{" "}
                        {new Date(currency.rateUpdatedAt).toLocaleDateString()}
                      </Text>
                      {currency.network && (
                        <Text size="xs" c="dimmed">
                          Network: {currency.network}
                        </Text>
                      )}
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}

        {filteredCurrencies.length === 0 &&
          searchQuery &&
          appCurrencies.length > 0 && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="No Results"
              color="blue"
            >
              No currencies found matching "{searchQuery}". Try a different
              search term.
            </Alert>
          )}
      </Stack>
    </Container>
  );
};
