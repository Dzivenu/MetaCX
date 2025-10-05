"use client";

import React, { useState } from "react";
import {
  Container,
  Stack,
  Title,
  TextInput,
  NumberInput,
  Textarea,
  Group,
  Button,
  Card,
  Text,
  Alert,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useCurrencyCreation } from "@/client/contexts/CurrencyCreationContext";
import { useCurrencies } from "@/client/hooks/useCurrenciesConvex";
import { DenominationInput } from "./DenominationInput";
import { RepositorySelection } from "./RepositorySelection";

export const CurrencyDetails: React.FC<{ onComplete?: () => void }> = ({
  onComplete,
}) => {
  const {
    selectedCurrency,
    denominations,
    selectedRepositories,
    setDenominations,
    setSelectedRepositories,
    setCurrentStep,
  } = useCurrencyCreation();

  // onComplete is provided by parent to switch tabs

  const { createCurrency } = useCurrencies();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      name: selectedCurrency?.name || "",
      ticker: selectedCurrency?.symbol || "",
      sign: selectedCurrency?.symbol || "",
      decimals: 2,
      description: "",
      rate: selectedCurrency?.rate || 1,
    },
    validate: {
      name: (value) =>
        value.length < 2 ? "Name must be at least 2 characters" : null,
      ticker: (value) =>
        value.length < 2 ? "Ticker must be at least 2 characters" : null,
      sign: (value) =>
        value.length < 1 ? "Sign must be at least 1 character" : null,
      decimals: (value) =>
        value < 0 || value > 18 ? "Decimals must be between 0 and 18" : null,
      rate: (value) => (value <= 0 ? "Rate must be greater than 0" : null),
    },
  });

  const handleRepositoryToggle = (id: string) => {
    if (selectedRepositories.includes(id)) {
      setSelectedRepositories(
        selectedRepositories.filter((repoId) => repoId !== id)
      );
    } else {
      setSelectedRepositories([...selectedRepositories, id]);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    // Validate required fields
    if (denominations.length === 0) {
      setSubmitError("At least one denomination must be added");
      return;
    }

    if (selectedRepositories.length === 0) {
      setSubmitError("At least one repository must be selected");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Prepare the data in the format expected by the backend
      const currencyData = {
        currency: {
          ...values,
          typeOf: selectedCurrency.type || selectedCurrency.typeof || "",
          typeof: selectedCurrency.type || selectedCurrency.typeof || "", // Backend expects 'typeof' field
          api: 0, // Default to manual API (0 = manual, 1 = automated)
          // Auto-populate fields from selected app currency
          network: selectedCurrency.network || "",
          contract: selectedCurrency.contract || "",
          chainId: selectedCurrency.chainId || "",
          rateApi: selectedCurrency.rateApi || "",
          rateApiIdentifier: selectedCurrency.rateApiIdentifier || "",
          icon: selectedCurrency.icon || "",
        },
        denominations: denominations.map((d) => ({ value: d.value })),
        repositories: selectedRepositories,
      };

      await createCurrency(currencyData);
      onComplete?.();
    } catch (error) {
      console.error("Error creating currency:", error);
      setSubmitError("Failed to create currency. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedCurrency) {
    return (
      <Container>
        <Text>No currency selected. Please go back and select a currency.</Text>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        <Title order={2}>Currency Details</Title>

        <Card withBorder>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Selected Currency
            </Text>
            <Group>
              {selectedCurrency.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedCurrency.icon}
                  alt={selectedCurrency.name}
                  style={{ width: 32, height: 32, borderRadius: "50%" }}
                />
              )}
              <div>
                <Text fw={500}>{selectedCurrency.name}</Text>
                <Text size="sm" c="dimmed">
                  {selectedCurrency.symbol}
                </Text>
              </div>
            </Group>
          </Stack>
        </Card>

        {submitError && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            {submitError}
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Currency Name"
              placeholder="Enter currency name"
              {...form.getInputProps("name")}
            />

            <TextInput
              label="Ticker Symbol"
              placeholder="e.g., BTC, USD"
              {...form.getInputProps("ticker")}
            />

            <TextInput
              label="Currency Sign"
              placeholder="e.g., $, €, ₿"
              {...form.getInputProps("sign")}
            />

            <NumberInput
              label="Rate"
              placeholder="Enter exchange rate"
              min={0}
              decimalScale={6}
              {...form.getInputProps("rate")}
            />

            <NumberInput
              label="Decimal Places"
              min={0}
              max={18}
              {...form.getInputProps("decimals")}
            />

            {/* Auto-populated fields from selected currency */}
            <Card
              withBorder
              padding="md"
              style={{ backgroundColor: "#f8f9fa" }}
            >
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">
                  Auto-populated from App Currency
                </Text>
                <Group grow>
                  <div>
                    <Text size="xs" c="dimmed">
                      Network
                    </Text>
                    <Text size="sm">{selectedCurrency?.network || "N/A"}</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Contract Address
                    </Text>
                    <Text size="sm" truncate>
                      {selectedCurrency?.contract || "N/A"}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Chain ID
                    </Text>
                    <Text size="sm">{selectedCurrency?.chainId || "N/A"}</Text>
                  </div>
                </Group>
                <Group grow>
                  <div>
                    <Text size="xs" c="dimmed">
                      Rate API
                    </Text>
                    <Text size="sm" truncate>
                      {selectedCurrency?.rateApi || "N/A"}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Rate API Identifier
                    </Text>
                    <Text size="sm">
                      {selectedCurrency?.rateApiIdentifier || "N/A"}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Icon URL
                    </Text>
                    <Text size="sm" truncate>
                      {selectedCurrency?.icon || "N/A"}
                    </Text>
                  </div>
                </Group>
              </Stack>
            </Card>

            <Textarea
              label="Description"
              placeholder="Enter a brief description of the currency"
              minRows={3}
              {...form.getInputProps("description")}
            />

            <DenominationInput
              denominations={denominations}
              onDenominationsChange={setDenominations}
            />

            <RepositorySelection
              selectedRepositories={selectedRepositories}
              onRepositoryToggle={handleRepositoryToggle}
              currencyType={
                selectedCurrency?.type || selectedCurrency?.typeof || ""
              }
            />

            <Group justify="space-between">
              <Button
                variant="default"
                onClick={() => setCurrentStep(0)}
                disabled={isSubmitting}
              >
                Back
              </Button>

              <Button
                type="submit"
                color="blue"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Create Currency
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
  );
};
