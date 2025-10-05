import { useState } from "react";
import {
  Stack,
  TextInput,
  Select,
  Switch,
  NumberInput,
  MultiSelect,
  Button,
  Group,
  Alert,
  Paper,
  Title,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconAlertCircle } from "@tabler/icons-react";
import { useCurrencies } from "@/client/hooks/useCurrenciesConvex";
import { useCreateRepository } from "@/client/hooks/useRepositoriesConvex";

interface CreateRepositoryFormData {
  name: string;
  typeOf: string;
  currencyType: string;
  form: string;
  key: string;
  floatThresholdBottom: number;
  floatThresholdTop: number;
  floatCountRequired: boolean;
  active: boolean;
  currencyTickers: string[];
}

export default function CreateRepositoryTab({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const { currencies } = useCurrencies();
  const {
    createRepository,
    isLoading: isCreating,
    error: createError,
  } = useCreateRepository();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateRepositoryFormData>({
    initialValues: {
      name: "",
      typeOf: "PHYSICAL",
      currencyType: "FIAT",
      form: "CASH",
      key: "",
      floatThresholdBottom: 0,
      floatThresholdTop: 10000,
      floatCountRequired: false,
      active: true,
      currencyTickers: [],
    },
    validate: {
      name: (value) =>
        value.length < 2 ? "Name must have at least 2 letters" : null,
      key: (value) =>
        value.length < 2 ? "Key must have at least 2 letters" : null,
      floatThresholdBottom: (value) =>
        value < 0 ? "Bottom threshold must be non-negative" : null,
      floatThresholdTop: (value, values) =>
        value <= values.floatThresholdBottom
          ? "Top threshold must be greater than bottom threshold"
          : null,
    },
  });

  const currencyOptions = (currencies || []).map((currency) => ({
    value: currency.ticker,
    label: `${currency.ticker} - ${currency.name}`,
  }));

  const handleSubmit = async (values: CreateRepositoryFormData) => {
    console.log("🔍 CreateRepositoryTab - handleSubmit called with:", values);
    setSubmitting(true);
    try {
      const result = await Promise.race([
        createRepository({
          name: values.name,
          key: values.key,
          typeOf: values.typeOf,
          currencyType: values.currencyType,
          form: values.form,
          floatThresholdBottom: values.floatThresholdBottom,
          floatThresholdTop: values.floatThresholdTop,
          floatCountRequired: values.floatCountRequired,
          currencyTickers: values.currencyTickers,
        }),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "Repository creation timed out - backend may be unavailable"
                )
              ),
            10000
          )
        ),
      ]);

      console.log("🔍 CreateRepositoryTab - createRepository result:", result);

      notifications.show({
        title: "Success",
        message: "Repository created successfully",
        color: "green",
        icon: <IconCheck size={16} />,
      });

      // Reset form after successful creation
      form.reset();

      // Notify parent to switch to Manage tab
      if (onCreated) onCreated();
    } catch (error) {
      console.error("🔍 CreateRepositoryTab - createRepository error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create repository";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      console.log(
        "🔍 CreateRepositoryTab - finally block, setting submitting to false"
      );
      setSubmitting(false);
    }
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <div>
          <Title order={3} mb="xs">
            Create New Repository
          </Title>
          <Text size="sm" c="dimmed">
            Set up a new repository for managing your organization&apos;s
            assets.
          </Text>
        </div>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Repository Name"
              placeholder="e.g., Main Repository"
              required
              {...form.getInputProps("name")}
            />

            <TextInput
              label="Repository Key"
              placeholder="e.g., MAIN"
              required
              {...form.getInputProps("key")}
            />

            <Group grow>
              <Select
                label="Type"
                placeholder="Select repository type"
                required
                data={[
                  { value: "PHYSICAL", label: "Physical" },
                  { value: "VIRTUAL", label: "Virtual" },
                  { value: "HYBRID", label: "Hybrid" },
                ]}
                {...form.getInputProps("typeOf")}
              />

              <Select
                label="Currency Type"
                placeholder="Select currency type"
                required
                data={[
                  { value: "FIAT", label: "Fiat" },
                  { value: "CRYPTO", label: "Cryptocurrency" },
                  { value: "METAL", label: "Metal" },
                  { value: "MIXED", label: "Mixed" },
                ]}
                {...form.getInputProps("currencyType")}
              />
            </Group>

            <Select
              label="Form"
              placeholder="Select form"
              required
              data={[
                { value: "CASH", label: "Cash" },
                { value: "DIGITAL", label: "Digital" },
                { value: "CARD", label: "Card" },
              ]}
              {...form.getInputProps("form")}
            />

            <Group grow>
              <NumberInput
                label="Float Threshold Bottom"
                placeholder="Bottom threshold"
                min={0}
                {...form.getInputProps("floatThresholdBottom")}
              />
              <NumberInput
                label="Float Threshold Top"
                placeholder="Top threshold"
                min={0}
                {...form.getInputProps("floatThresholdTop")}
              />
            </Group>

            <MultiSelect
              label="Currency Tickers"
              placeholder="Select currencies for this repository"
              data={currencyOptions}
              searchable
              clearable
              disabled={!currencies || currencies.length === 0}
              {...form.getInputProps("currencyTickers")}
            />

            <Group>
              <Switch
                label="Float Count Required"
                description="Require float count validation"
                {...form.getInputProps("floatCountRequired", {
                  type: "checkbox",
                })}
              />
              <Switch
                label="Active"
                description="Repository is active and available for use"
                {...form.getInputProps("active", { type: "checkbox" })}
              />
            </Group>

            <Group justify="flex-end" mt="md">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={submitting}
              >
                Reset
              </Button>
              <Button type="submit" loading={submitting || isCreating}>
                Create Repository
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}
