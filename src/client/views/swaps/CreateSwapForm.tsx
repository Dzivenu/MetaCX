"use client";

import { useState, useMemo } from "react";
import {
  Card,
  Stack,
  Select,
  NumberInput,
  Button,
  Group,
  Text,
  Stepper,
  Table,
  Badge,
  Grid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import type { Id } from "../../../../convex/_generated/dataModel";
import { formatCurrency } from "@/client/utils/formatters";

interface CreateSwapFormProps {
  sessionId: Id<"org_cx_sessions">;
  currencies: any[];
  repositories: any[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function CreateSwapForm({
  sessionId,
  currencies,
  repositories,
  onSubmit,
  onCancel,
}: CreateSwapFormProps) {
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [inboundBreakdowns, setInboundBreakdowns] = useState<any[]>([]);
  const [outboundBreakdowns, setOutboundBreakdowns] = useState<any[]>([]);

  const form = useForm({
    initialValues: {
      ticker: "",
      amount: 0,
      inboundRepositoryId: "",
      outboundRepositoryId: "",
    },
    validate: {
      ticker: (value) => (!value ? "Currency is required" : null),
      amount: (value) => (value <= 0 ? "Amount must be greater than 0" : null),
      inboundRepositoryId: (value) =>
        !value ? "Inbound repository is required" : null,
      outboundRepositoryId: (value) =>
        !value ? "Outbound repository is required" : null,
    },
  });

  const selectedCurrency = currencies.find((c) => c.ticker === form.values.ticker);
  const filteredRepositories = useMemo(() => {
    if (!form.values.ticker) return [];
    return repositories.filter((repo) =>
      repo.currencyTickers?.includes(form.values.ticker)
    );
  }, [repositories, form.values.ticker]);

  const inboundRepo = repositories.find(
    (r) => r._id === form.values.inboundRepositoryId
  );
  const outboundRepo = repositories.find(
    (r) => r._id === form.values.outboundRepositoryId
  );

  const denominations = selectedCurrency?.denominations || [];

  const handleInboundBreakdownChange = (denominationId: string, count: number) => {
    setInboundBreakdowns((prev) => {
      const existing = prev.find((b) => b.denominationId === denominationId);
      if (existing) {
        if (count === 0) {
          return prev.filter((b) => b.denominationId !== denominationId);
        }
        return prev.map((b) =>
          b.denominationId === denominationId ? { ...b, count: count.toString() } : b
        );
      }
      if (count > 0) {
        const denomination = denominations.find((d: any) => d._id === denominationId);
        return [
          ...prev,
          {
            denominationId,
            denominationValue: denomination?.value || "0",
            count: count.toString(),
            direction: "INBOUND",
            repositoryId: form.values.inboundRepositoryId,
            floatStackId: "", 
          },
        ];
      }
      return prev;
    });
  };

  const handleOutboundBreakdownChange = (denominationId: string, count: number) => {
    setOutboundBreakdowns((prev) => {
      const existing = prev.find((b) => b.denominationId === denominationId);
      if (existing) {
        if (count === 0) {
          return prev.filter((b) => b.denominationId !== denominationId);
        }
        return prev.map((b) =>
          b.denominationId === denominationId ? { ...b, count: count.toString() } : b
        );
      }
      if (count > 0) {
        const denomination = denominations.find((d: any) => d._id === denominationId);
        return [
          ...prev,
          {
            denominationId,
            denominationValue: denomination?.value || "0",
            count: count.toString(),
            direction: "OUTBOUND",
            repositoryId: form.values.outboundRepositoryId,
            floatStackId: "",
          },
        ];
      }
      return prev;
    });
  };

  const calculateSum = (breakdowns: any[]) => {
    return breakdowns.reduce((sum, b) => {
      const count = parseFloat(b.count) || 0;
      const value = parseFloat(b.denominationValue) || 0;
      return sum + count * value;
    }, 0);
  };

  const inboundSum = calculateSum(inboundBreakdowns);
  const outboundSum = calculateSum(outboundBreakdowns);
  const breakdownsValid =
    inboundSum === form.values.amount && outboundSum === form.values.amount;

  const nextStep = () => {
    if (active === 0) {
      const validation = form.validate();
      if (!validation.hasErrors) {
        setActive(1);
      }
    } else if (active === 1) {
      if (breakdownsValid) {
        setActive(2);
      } else {
        notifications.show({
          title: "Invalid Breakdowns",
          message: "Inbound and outbound sums must match the amount",
          color: "red",
        });
      }
    }
  };

  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit({
        sessionId,
        ticker: form.values.ticker,
        inboundRepositoryId: form.values.inboundRepositoryId as Id<"org_repositories">,
        outboundRepositoryId: form.values.outboundRepositoryId as Id<"org_repositories">,
        inboundSum: inboundSum.toString(),
        outboundSum: outboundSum.toString(),
        breakdowns: [...inboundBreakdowns, ...outboundBreakdowns],
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card withBorder>
      <Stepper active={active} onStepClick={setActive}>
        <Stepper.Step label="Details" description="Currency & Amount">
          <Stack gap="md" mt="md">
            <Select
              label="Currency"
              placeholder="Select currency"
              data={currencies.map((c) => ({ value: c.ticker, label: c.ticker }))}
              {...form.getInputProps("ticker")}
              required
            />
            <NumberInput
              label="Amount"
              placeholder="Enter amount"
              min={0}
              {...form.getInputProps("amount")}
              required
            />
            <Select
              label="Inbound Repository"
              placeholder="Select inbound repository"
              data={filteredRepositories.map((r) => ({
                value: r._id,
                label: r.name,
              }))}
              {...form.getInputProps("inboundRepositoryId")}
              required
              disabled={!form.values.ticker}
            />
            <Select
              label="Outbound Repository"
              placeholder="Select outbound repository"
              data={filteredRepositories.map((r) => ({
                value: r._id,
                label: r.name,
              }))}
              {...form.getInputProps("outboundRepositoryId")}
              required
              disabled={!form.values.ticker}
            />
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Breakdowns" description="Enter counts">
          <Stack gap="md" mt="md">
            <Text fw={500}>
              Amount: {formatCurrency(form.values.amount, form.values.ticker)}
            </Text>
            <Grid>
              <Grid.Col span={6}>
                <Card withBorder>
                  <Text fw={500} mb="md">
                    Inbound ({inboundRepo?.name})
                  </Text>
                  <Stack gap="xs">
                    {denominations.map((denom: any) => (
                      <Group key={denom._id} justify="space-between">
                        <Text size="sm">
                          {formatCurrency(parseFloat(denom.value), form.values.ticker)}
                        </Text>
                        <NumberInput
                          w={100}
                          min={0}
                          value={
                            inboundBreakdowns.find((b) => b.denominationId === denom._id)
                              ?.count || 0
                          }
                          onChange={(val) =>
                            handleInboundBreakdownChange(denom._id, Number(val))
                          }
                        />
                      </Group>
                    ))}
                    <Text size="sm" fw={500} mt="md">
                      Sum: {formatCurrency(inboundSum, form.values.ticker)}
                    </Text>
                  </Stack>
                </Card>
              </Grid.Col>
              <Grid.Col span={6}>
                <Card withBorder>
                  <Text fw={500} mb="md">
                    Outbound ({outboundRepo?.name})
                  </Text>
                  <Stack gap="xs">
                    {denominations.map((denom: any) => (
                      <Group key={denom._id} justify="space-between">
                        <Text size="sm">
                          {formatCurrency(parseFloat(denom.value), form.values.ticker)}
                        </Text>
                        <NumberInput
                          w={100}
                          min={0}
                          value={
                            outboundBreakdowns.find((b) => b.denominationId === denom._id)
                              ?.count || 0
                          }
                          onChange={(val) =>
                            handleOutboundBreakdownChange(denom._id, Number(val))
                          }
                        />
                      </Group>
                    ))}
                    <Text size="sm" fw={500} mt="md">
                      Sum: {formatCurrency(outboundSum, form.values.ticker)}
                    </Text>
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Confirm" description="Review & Submit">
          <Stack gap="md" mt="md">
            <Card withBorder>
              <Text fw={500} mb="md">
                Swap Summary
              </Text>
              <Table>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td fw={500}>Currency</Table.Td>
                    <Table.Td>
                      <Badge>{form.values.ticker}</Badge>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td fw={500}>Amount</Table.Td>
                    <Table.Td>
                      {formatCurrency(form.values.amount, form.values.ticker)}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td fw={500}>Inbound Repository</Table.Td>
                    <Table.Td>{inboundRepo?.name}</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td fw={500}>Outbound Repository</Table.Td>
                    <Table.Td>{outboundRepo?.name}</Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Card>
          </Stack>
        </Stepper.Step>
      </Stepper>

      <Group justify="space-between" mt="xl">
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Group>
          {active > 0 && (
            <Button variant="default" onClick={prevStep}>
              Back
            </Button>
          )}
          {active < 2 ? (
            <Button onClick={nextStep}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>
              Confirm Swap
            </Button>
          )}
        </Group>
      </Group>
    </Card>
  );
}
