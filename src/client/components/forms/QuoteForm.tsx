"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  Button,
  Text,
  Grid,
  Alert,
  ActionIcon,
  Badge,
  Stack,
  Title,
  Card,
  Container,
  Divider,
  NumberInput,
  Tooltip,
  Group,
} from "@mantine/core";
import {
  IconRefresh,
  IconArrowsRightLeft,
  IconClock,
  IconLockOpen,
  IconInfoCircle,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useCurrencyCalculator } from "@/client/hooks/useCurrencyCalculator";
import { useCurrencies } from "@/client/hooks/useCurrenciesConvex";
import { CurrencySection } from "@/client/views/orders/steps/quote/CurrencySection";
import { SpotRatesSection } from "@/client/views/orders/steps/quote/SpotRatesSection";
import { WarningsSection } from "@/client/views/orders/steps/quote/WarningsSection";

export interface QuoteFormData {
  inboundTicker: string;
  inboundSum: number;
  outboundTicker: string;
  outboundSum: number;
  margin?: number;
  fee?: number;
  networkFee?: number;
  finalRate?: number;
}

export interface QuoteFormProps {
  // Data + change events
  initialData?: Partial<QuoteFormData>;
  onChange?: (data: QuoteFormData) => void;

  // Validation callback
  onValidationChange?: (isValid: boolean) => void;
}

export function QuoteForm({
  initialData,
  onChange,
  onValidationChange,
}: QuoteFormProps) {
  // Form state
  const [formData, setFormData] = useState<QuoteFormData>({
    inboundTicker: "CAD",
    inboundSum: 0,
    outboundTicker: "BTC",
    outboundSum: 0,
    margin: 0,
    fee: 2,
    networkFee: 0,
    finalRate: 0,
    ...initialData,
  });

  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<
    Array<{
      type: "warning" | "info" | "error";
      currency: string;
      message: string;
    }>
  >([]);

  // Get organization's currencies
  const { currencies: orgCurrencies } = useCurrencies();
  const calculatorCurrencies = useMemo(
    () =>
      (orgCurrencies || []).map((c) => ({
        ticker: c.ticker,
        name: c.name,
        rate: Number(c.rate || 0),
        buy_margin_max: 0,
        sell_margin_max: 0,
        we_buy: Number(c.rate || 0),
        we_sell: Number(c.rate || 0),
        typeof: c.typeOf || "Fiat",
        tradeable: true,
      })),
    [orgCurrencies]
  );

  // Initialize currency calculator - use a ref to avoid reinitializing on every render
  const [calcCurrencies, setCalcCurrencies] = useState(calculatorCurrencies);
  const prevTickersRef = useRef<string>("");

  useEffect(() => {
    const next = (calculatorCurrencies || []).map((c) => c.ticker).join(",");
    if (prevTickersRef.current !== next) {
      prevTickersRef.current = next;
      setCalcCurrencies(calculatorCurrencies);
    }
  }, [calculatorCurrencies]);

  // Use stable initial fee values to prevent calculator reinitialization
  // The actual fee values are updated via the effect below when formData changes
  const calculatorOptions = useMemo(
    () => ({
      serviceFee: 2, // Stable default
      networkFee: 0, // Stable default
      useMockData: false,
      autoLoadFloatBalance: true,
      currencies: calcCurrencies,
    }),
    [calcCurrencies]
  );

  const calculator = useCurrencyCalculator(calculatorOptions);

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [warningsExpanded, setWarningsExpanded] = useState(true);

  // Update calculator when formData changes
  useEffect(() => {
    if (!calculator) return;

    // Only apply changes that actually differ to avoid feedback loops
    if (calculator.inboundTicker !== formData.inboundTicker) {
      calculator.changeInboundCurrency(formData.inboundTicker);
    }
    if (calculator.outboundTicker !== formData.outboundTicker) {
      calculator.changeOutboundCurrency(formData.outboundTicker);
    }
    if (formData.inboundSum !== calculator.inboundAmount) {
      calculator.updateInboundAmount(formData.inboundSum);
    }
    if (
      formData.margin !== undefined &&
      formData.margin !== calculator.margin
    ) {
      calculator.updateMargin(formData.margin);
    }
    if (formData.fee !== undefined && formData.fee !== calculator.serviceFee) {
      calculator.updateServiceFee(formData.fee);
    }
    if (
      formData.networkFee !== undefined &&
      formData.networkFee !== calculator.networkFee
    ) {
      calculator.updateNetworkFee(formData.networkFee);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Do NOT include calculator in dependencies - it changes on every render
    formData.inboundTicker,
    formData.outboundTicker,
    formData.inboundSum,
    formData.margin,
    formData.fee,
    formData.networkFee,
  ]);

  // Sync calculator values back to form
  useEffect(() => {
    if (!calculator) return;
    // Avoid loops by only setting when values actually changed
    if (
      calculator.outboundAmount > 0 &&
      calculator.outboundAmount !== formData.outboundSum
    ) {
      setFormData((prev) => ({
        ...prev,
        outboundSum: calculator.outboundAmount,
      }));
    }
    if (
      calculator.finalRate > 0 &&
      calculator.finalRate !== formData.finalRate
    ) {
      setFormData((prev) => ({ ...prev, finalRate: calculator.finalRate }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Do NOT include calculator in dependencies - it changes on every render
    calculator?.outboundAmount,
    calculator?.finalRate,
    formData.outboundSum,
    formData.finalRate,
  ]);

  // Validation
  const isValid = useMemo(() => {
    return (
      Boolean(formData.inboundTicker) &&
      Boolean(formData.outboundTicker) &&
      formData.inboundSum > 0 &&
      formData.outboundSum > 0
    );
  }, [formData]);

  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  // Field update handlers
  const updateField = useCallback((field: keyof QuoteFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleRefresh = useCallback(() => {
    setLastRefresh(new Date());
    calculator?.refreshRates();
  }, [calculator]);

  const handleSwap = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      inboundTicker: prev.outboundTicker,
      outboundTicker: prev.inboundTicker,
      inboundSum: prev.outboundSum,
      outboundSum: prev.inboundSum,
    }));
  }, []);

  // Emit changes to parent consumers when formData changes
  const prevFormDataRef = React.useRef<QuoteFormData | null>(null);
  useEffect(() => {
    // Only call onChange if formData actually changed from previous value
    if (
      prevFormDataRef.current &&
      prevFormDataRef.current.inboundTicker === formData.inboundTicker &&
      prevFormDataRef.current.inboundSum === formData.inboundSum &&
      prevFormDataRef.current.outboundTicker === formData.outboundTicker &&
      prevFormDataRef.current.outboundSum === formData.outboundSum &&
      prevFormDataRef.current.margin === formData.margin &&
      prevFormDataRef.current.fee === formData.fee &&
      prevFormDataRef.current.networkFee === formData.networkFee &&
      prevFormDataRef.current.finalRate === formData.finalRate
    ) {
      return; // No change, skip onChange call
    }

    prevFormDataRef.current = formData;
    onChange?.(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // No title/header for pure form

  return (
    <div style={{ width: "100%" }}>
      <Stack gap="xl">
        {error && (
          <Alert color="red" icon={<IconClock size={16} />} variant="light">
            {error}
          </Alert>
        )}

        <Card padding="xl" radius="md" withBorder>
          <Stack gap="xl">
            <Grid gutter="xl" align="center">
              {/* Inbound Section */}
              <Grid.Col span={{ base: 12, md: 5 }}>
                <CurrencySection
                  type="INBOUND"
                  ticker={formData.inboundTicker}
                  amount={formData.inboundSum}
                  onTickerChange={(ticker) =>
                    updateField("inboundTicker", ticker)
                  }
                  onAmountChange={(amount) => updateField("inboundSum", amount)}
                  calculator={calculator}
                />

                {/* Spot FX Rates */}
                <SpotRatesSection
                  inboundTicker={formData.inboundTicker}
                  outboundTicker={formData.outboundTicker}
                  lastRefresh={lastRefresh}
                  onRefresh={handleRefresh}
                  loading={calculator?.isLoading}
                />
              </Grid.Col>

              {/* Swap Icon & Rate Controls */}
              <Grid.Col span={{ base: 12, md: 2 }}>
                <Stack align="center" gap="xs">
                  {/* Last Updated Badge */}
                  <Badge
                    leftSection={<IconClock size={12} />}
                    variant="light"
                    color="yellow"
                    size="sm"
                  >
                    {formatTimeAgo(lastRefresh)}
                  </Badge>

                  {/* Swap Button */}
                  <ActionIcon
                    size="xl"
                    variant="light"
                    color="blue"
                    onClick={handleSwap}
                    disabled={calculator?.isLoading}
                  >
                    <IconArrowsRightLeft size={24} />
                  </ActionIcon>

                  {/* Refresh Rate Button */}
                  <ActionIcon
                    size="lg"
                    variant="outline"
                    color="orange"
                    onClick={handleRefresh}
                    loading={calculator?.isLoading}
                  >
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Stack>
              </Grid.Col>

              {/* Outbound Section */}
              <Grid.Col span={{ base: 12, md: 5 }}>
                <CurrencySection
                  type="OUTBOUND"
                  ticker={formData.outboundTicker}
                  amount={formData.outboundSum}
                  onTickerChange={(ticker) =>
                    updateField("outboundTicker", ticker)
                  }
                  onAmountChange={(amount) =>
                    updateField("outboundSum", amount)
                  }
                  readOnly={true}
                  calculator={calculator}
                />
              </Grid.Col>
            </Grid>

            <Divider />

            {/* Rates & Fees Section */}
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <div />
                <Group gap="xs">
                  <Tooltip label="Reset to calculated defaults">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => {
                        updateField("fee", 2);
                        updateField("networkFee", 0);
                        updateField("margin", 0);
                      }}
                      disabled={calculator?.isLoading}
                    >
                      Reset
                    </Button>
                  </Tooltip>
                  <Tooltip label="Lock/unlock fields to prevent automatic recalculation">
                    <ActionIcon variant="outline" size="sm">
                      <IconInfoCircle size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>

              <Grid gutter="md">
                {/* Final Selling Rate */}
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Stack gap="xs">
                    <Group gap="xs" align="center">
                      <Text size="sm" fw={500}>
                        Final Selling Rate
                      </Text>
                      <ActionIcon variant="subtle" size="xs" color="gray">
                        <IconLockOpen size={12} />
                      </ActionIcon>
                    </Group>
                    <NumberInput
                      value={formData.finalRate}
                      onChange={(value) => {
                        const numValue =
                          typeof value === "string"
                            ? parseFloat(value) || 0
                            : value;
                        updateField("finalRate", numValue);
                      }}
                      decimalScale={6}
                      step={0.000001}
                      min={0}
                      placeholder="0.000000"
                      rightSection={
                        <Text size="xs" c="dimmed">
                          {formData.inboundTicker}/{formData.outboundTicker}
                        </Text>
                      }
                      styles={{
                        input: {
                          fontFamily: "monospace",
                        },
                      }}
                    />
                    <Text size="xs" c="dimmed">
                      Exchange rate including all margins and fees
                    </Text>
                  </Stack>
                </Grid.Col>

                {/* Margin */}
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Stack gap="xs">
                    <Group gap="xs" align="center">
                      <Text size="sm" fw={500}>
                        Margin
                      </Text>
                      <ActionIcon variant="subtle" size="xs" color="gray">
                        <IconLockOpen size={12} />
                      </ActionIcon>
                    </Group>
                    <NumberInput
                      value={formData.margin}
                      onChange={(value) => {
                        const numValue =
                          typeof value === "string"
                            ? parseFloat(value) || 0
                            : value;
                        updateField("margin", numValue);
                      }}
                      decimalScale={2}
                      step={0.1}
                      min={0}
                      max={100}
                      placeholder="0.00"
                      rightSection={
                        <Text size="xs" c="dimmed">
                          %
                        </Text>
                      }
                      styles={{
                        input: {
                          fontFamily: "monospace",
                        },
                      }}
                    />
                    <Text size="xs" c="dimmed">
                      Percentage margin applied to the base rate
                    </Text>
                  </Stack>
                </Grid.Col>

                {/* Service Fee */}
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Stack gap="xs">
                    <Group gap="xs" align="center">
                      <Text size="sm" fw={500}>
                        Service Fee
                      </Text>
                      <ActionIcon variant="subtle" size="xs" color="gray">
                        <IconLockOpen size={12} />
                      </ActionIcon>
                    </Group>
                    <NumberInput
                      value={formData.fee}
                      onChange={(value) => {
                        const numValue =
                          typeof value === "string"
                            ? parseFloat(value) || 0
                            : value;
                        updateField("fee", numValue);
                      }}
                      decimalScale={2}
                      step={0.01}
                      min={0}
                      placeholder="0.00"
                      leftSection={
                        <Text size="xs" c="dimmed">
                          $
                        </Text>
                      }
                      styles={{
                        input: {
                          fontFamily: "monospace",
                        },
                      }}
                    />
                    <Text size="xs" c="dimmed">
                      Fixed processing fee in CAD
                    </Text>
                  </Stack>
                </Grid.Col>

                {/* Network Fee */}
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Stack gap="xs">
                    <Group gap="xs" align="center">
                      <Text size="sm" fw={500}>
                        Network Fee
                      </Text>
                      <ActionIcon variant="subtle" size="xs" color="gray">
                        <IconLockOpen size={12} />
                      </ActionIcon>
                    </Group>
                    <NumberInput
                      value={formData.networkFee}
                      onChange={(value) => {
                        const numValue =
                          typeof value === "string"
                            ? parseFloat(value) || 0
                            : value;
                        updateField("networkFee", numValue);
                      }}
                      decimalScale={6}
                      step={0.000001}
                      min={0}
                      placeholder="0.000000"
                      leftSection={
                        <Text size="xs" c="dimmed">
                          $
                        </Text>
                      }
                      styles={{
                        input: {
                          fontFamily: "monospace",
                        },
                      }}
                    />
                    <Text size="xs" c="dimmed">
                      Blockchain network fee in CAD
                    </Text>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Stack>
          </Stack>
        </Card>

        {/* Warnings Section */}
        {warnings.length > 0 && (
          <WarningsSection
            expanded={warningsExpanded}
            onToggle={() => setWarningsExpanded(!warningsExpanded)}
            warnings={warnings}
          />
        )}
      </Stack>
    </div>
  );
}
