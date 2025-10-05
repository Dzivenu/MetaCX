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
      rate: currency.rate || 0,
      buyMarginMax: currency.buyMarginMax || 0,
      sellMarginMax: currency.sellMarginMax || 0,
      buyMarginMin: currency.buyMarginMin || 0,
      sellMarginMin: currency.sellMarginMin || 0,
      tradeable: currency.tradeable || false,
      advertisable: currency.advertisable || false,
      buy_advertisable: currency.buy_advertisable || false,
      sell_advertisable: currency.sell_advertisable || false,
      offset: currency.offset || 0,
      spread: currency.spread || 0,
      rateDecimalPlaces: currency.rateDecimalPlaces || 2,
      amountDecimalPlaces: currency.amountDecimalPlaces || 2,
      floatThresholdBottom: currency.floatThresholdBottom || 0,
      floatThresholdTop: currency.floatThresholdTop || 0,
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
                precision={6}
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
                precision={4}
                {...form.getInputProps("buyMarginMax")}
              />
              <NumberInput
                label="Sell Margin Max (%)"
                precision={4}
                {...form.getInputProps("sellMarginMax")}
              />
            </Group>
            <Group grow mt="md">
              <NumberInput
                label="Buy Margin Min (%)"
                precision={4}
                {...form.getInputProps("buyMarginMin")}
              />
              <NumberInput
                label="Sell Margin Min (%)"
                precision={4}
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
                precision={4}
                {...form.getInputProps("offset")}
              />
              <NumberInput
                label="Spread"
                precision={4}
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
