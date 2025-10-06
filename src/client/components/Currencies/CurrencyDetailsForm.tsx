import React, { useState } from "react";
import {
  Button,
  Group,
  Modal,
  TextInput,
  NumberInput,
  Switch,
  Text,
  Stack,
  Title,
  Divider,
  Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import type { Currency } from "@/client/hooks/useCurrenciesConvex";
import { useCurrencies } from "@/client/hooks/useCurrenciesConvex";

interface CurrencyDetailsFormProps {
  currency: Currency;
  opened: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const CurrencyDetailsForm: React.FC<CurrencyDetailsFormProps> = ({
  currency,
  opened,
  onClose,
  onSave,
}) => {
  const { updateCurrency } = useCurrencies();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: currency.name || "",
      ticker: currency.ticker || "",
      rate: (currency as any).rate || 0,
      buyMarginMax: (currency as any).buyMarginMax || 0,
      sellMarginMax: (currency as any).sellMarginMax || 0,
      buyMarginMin: (currency as any).buyMarginMin || 0,
      sellMarginMin: (currency as any).sellMarginMin || 0,
      tradeable: currency.tradeable || false,
      advertisable: (currency as any).advertisable || false,
      buy_advertisable: (currency as any).buy_advertisable || false,
      sell_advertisable: (currency as any).sell_advertisable || false,
      offset: (currency as any).offset || 0,
      spread: (currency as any).spread || 0,
      rateDecimalPlaces: (currency as any).rateDecimalPlaces || 2,
      amountDecimalPlaces: (currency as any).amountDecimalPlaces || 2,
      floatThresholdBottom: (currency as any).floatThresholdBottom || 0,
      floatThresholdTop: (currency as any).floatThresholdTop || 0,
    },

    validate: {
      name: (value) =>
        value.length < 2 ? "Name must be at least 2 characters" : null,
      ticker: (value) => (value.length < 1 ? "Ticker is required" : null),
      rate: (value) => (value < 0 ? "Rate must be positive" : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await updateCurrency(currency.id, values);
      onSave();
      onClose();
    } catch (error) {
      console.error("Error updating currency:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={3}>Edit Currency</Title>}
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Box>
            <Text fw={500} size="sm">
              Basic Information
            </Text>
            <Divider my="sm" />
            <Group grow>
              <TextInput
                label="Name"
                placeholder="Currency name"
                {...form.getInputProps("name")}
              />
              <TextInput
                label="Ticker"
                placeholder="Currency ticker"
                {...form.getInputProps("ticker")}
              />
            </Group>
            <Group grow mt="md">
              <NumberInput
                label="Rate"
                placeholder="Currency rate"
                decimalScale={6}
                {...form.getInputProps("rate")}
              />
            </Group>
          </Box>

          <Box>
            <Text fw={500} size="sm">
              Margins
            </Text>
            <Divider my="sm" />
            <Group grow>
              <NumberInput
                label="Buy Margin Max (%)"
                decimalScale={4}
                {...form.getInputProps("buyMarginMax")}
              />
              <NumberInput
                label="Sell Margin Max (%)"
                decimalScale={4}
                {...form.getInputProps("sellMarginMax")}
              />
            </Group>
            <Group grow mt="md">
              <NumberInput
                label="Buy Margin Min (%)"
                decimalScale={4}
                {...form.getInputProps("buyMarginMin")}
              />
              <NumberInput
                label="Sell Margin Min (%)"
                decimalScale={4}
                {...form.getInputProps("sellMarginMin")}
              />
            </Group>
          </Box>

          <Box>
            <Text fw={500} size="sm">
              Settings
            </Text>
            <Divider my="sm" />
            <Group>
              <Switch
                label="Tradeable"
                {...form.getInputProps("tradeable", { type: "checkbox" })}
              />
              <Switch
                label="Advertisable"
                {...form.getInputProps("advertisable", { type: "checkbox" })}
              />
            </Group>
            <Group mt="md">
              <Switch
                label="Buy Advertisable"
                {...form.getInputProps("buy_advertisable", {
                  type: "checkbox",
                })}
              />
              <Switch
                label="Sell Advertisable"
                {...form.getInputProps("sell_advertisable", {
                  type: "checkbox",
                })}
              />
            </Group>
          </Box>

          <Box>
            <Text fw={500} size="sm">
              Advanced Settings
            </Text>
            <Divider my="sm" />
            <Group grow>
              <NumberInput
                label="Offset"
                decimalScale={4}
                {...form.getInputProps("offset")}
              />
              <NumberInput
                label="Spread"
                decimalScale={4}
                {...form.getInputProps("spread")}
              />
            </Group>
            <Group grow mt="md">
              <NumberInput
                label="Rate Decimal Places"
                {...form.getInputProps("rateDecimalPlaces")}
              />
              <NumberInput
                label="Amount Decimal Places"
                {...form.getInputProps("amountDecimalPlaces")}
              />
            </Group>
            <Group grow mt="md">
              <NumberInput
                label="Float Threshold Bottom"
                {...form.getInputProps("floatThresholdBottom")}
              />
              <NumberInput
                label="Float Threshold Top"
                {...form.getInputProps("floatThresholdTop")}
              />
            </Group>
          </Box>

          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
