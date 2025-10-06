"use client";

import { useState } from "react";
import {
  Stack,
  Group,
  Text,
  Badge,
  Button,
  TextInput,
  Switch,
  NumberInput,
  Box,
  ActionIcon,
  Card,
  ScrollArea,
} from "@mantine/core";
import { DataTable } from "mantine-datatable";
import {
  IconEdit,
  IconChevronRight,
  IconChevronDown,
  IconTrash,
} from "@tabler/icons-react";
// Using Convex-based Currency shape from useCurrenciesConvex
import type {
  Currency,
  Denomination,
} from "@/client/hooks/useCurrenciesConvex";
import { notifications } from "@mantine/notifications";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

interface CurrencyDataTableProps {
  currencies: Currency[];
  onUpdateCurrency: (id: string, data: Partial<Currency>) => Promise<boolean>;
  onDeleteCurrency: (id: string) => Promise<boolean>;
  onRefresh: () => void;
}

interface CurrencyEditingData extends Partial<Currency> {
  denominationUpdates?: { [denominationId: string]: { accepted: boolean } };
}

interface EditingState {
  [key: string]: CurrencyEditingData;
}

export function CurrencyDataTable({
  currencies,
  onUpdateCurrency,
  onDeleteCurrency,
  onRefresh,
}: CurrencyDataTableProps) {
  const [editingData, setEditingData] = useState<EditingState>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [expandedRecordIds, setExpandedRecordIds] = useState<string[]>([]);

  const handleEdit = (currency: Currency) => {
    // Initialize editing data and set editing mode
    setEditingData({
      ...editingData,
      [currency.id]: { ...currency },
    });
    setEditingRows(new Set([...editingRows, currency.id]));
  };

  const handleCancel = (currencyId: string) => {
    const newEditingData = { ...editingData };
    delete newEditingData[currencyId];
    setEditingData(newEditingData);

    const newEditingRows = new Set(editingRows);
    newEditingRows.delete(currencyId);
    setEditingRows(newEditingRows);
  };

  const handleSave = async (currencyId: string) => {
    const data = editingData[currencyId];
    if (!data) return;

    setSaving(new Set([...saving, currencyId]));

    try {
      const success = await onUpdateCurrency(currencyId, data);
      if (success) {
        notifications.show({
          title: "Success",
          message: "Currency updated successfully",
          color: "green",
        });
        handleCancel(currencyId);
        onRefresh();
      } else {
        notifications.show({
          title: "Error",
          message: "Failed to update currency",
          color: "red",
        });
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to update currency",
        color: "red",
      });
    } finally {
      const newSaving = new Set(saving);
      newSaving.delete(currencyId);
      setSaving(newSaving);
    }
  };

  const handleDelete = async (currencyId: string) => {
    if (window.confirm("Are you sure you want to delete this currency?")) {
      try {
        const success = await onDeleteCurrency(currencyId);
        if (success) {
          notifications.show({
            title: "Success",
            message: "Currency deleted successfully",
            color: "green",
          });
          onRefresh();
        } else {
          notifications.show({
            title: "Error",
            message: "Failed to delete currency",
            color: "red",
          });
        }
      } catch {
        notifications.show({
          title: "Error",
          message: "Failed to delete currency",
          color: "red",
        });
      }
    }
  };

  const updateEditingData = (currencyId: string, field: string, value: any) => {
    setEditingData({
      ...editingData,
      [currencyId]: {
        ...editingData[currencyId],
        [field]: value,
      },
    });
  };

  const renderDisplayView = (currency: Currency) => {
    return (
      <Box p="md">
        <Stack gap="md">
          <Group grow>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Name
              </Text>
              <Text>{currency.name}</Text>
            </Box>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Ticker
              </Text>
              <Badge variant="light" color="blue">
                {currency.ticker}
              </Badge>
            </Box>
          </Group>

          <Group grow>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Rate API Identifier
              </Text>
              <Text>{currency.rateApiIdentifier || "N/A"}</Text>
            </Box>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Rate
              </Text>
              <Text fw={500}>{currency.rate?.toFixed(6) || "N/A"}</Text>
            </Box>
          </Group>

          <Group grow>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Float Display Order
              </Text>
              <Text>{currency.floatDisplayOrder || 0}</Text>
            </Box>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Tradeable
              </Text>
              <Badge
                variant="light"
                color={currency.tradeable ? "green" : "red"}
              >
                {currency.tradeable ? "YES" : "NO"}
              </Badge>
            </Box>
          </Group>

          <Group justify="space-between" mt="md">
            <Button
              variant="outline"
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={() => handleDelete(currency.id)}
            >
              Delete Currency
            </Button>
            <Button
              variant="outline"
              leftSection={<IconEdit size={16} />}
              onClick={() => handleEdit(currency)}
            >
              Edit Currency
            </Button>
          </Group>
        </Stack>
      </Box>
    );
  };

  const DenominationToggleSection = ({
    currency,
    data,
  }: {
    currency: Currency;
    data: CurrencyEditingData;
  }) => {
    // Fetch org denominations for this org currency
    const denomRecords = useQuery(
      api.functions.orgCurrencies.getOrgDenominations,
      currency.id
        ? { orgCurrencyId: currency.id as unknown as Id<"org_currencies"> }
        : "skip"
    );
    const updateDenomination = useMutation(
      api.functions.orgCurrencies.updateOrgDenomination
    );

    const denominations = (denomRecords || []).map((d: any) => ({
      id: d._id as string,
      name: d.name as string | undefined,
      value: d.value as number,
      accepted: d.accepted as boolean | undefined,
    }));

    const handleDenominationToggle = (
      denominationId: string,
      accepted: boolean
    ) => {
      const currentUpdates = data.denominationUpdates || {};
      const newUpdates = {
        ...currentUpdates,
        [denominationId]: { accepted },
      };

      updateEditingData(currency.id, "denominationUpdates", newUpdates);
    };

    const isDenominationAccepted = (denomination: Denomination) => {
      const updates = data.denominationUpdates?.[denomination.id];
      return updates ? updates.accepted : !!denomination.accepted;
    };

    if (denominations.length === 0) {
      return (
        <Card withBorder p="md" radius="md">
          <Text size="sm" c="dimmed" ta="center">
            No denominations found for this currency
          </Text>
        </Card>
      );
    }

    return (
      <Card withBorder p="md" radius="md">
        <Stack gap="md">
          <Text size="sm" fw={600}>
            Manage Denominations
            <Text size="xs" c="dimmed" span>
              {" "}
              (Toggle active/inactive status for each denomination)
            </Text>
          </Text>

          <ScrollArea h={200} type="auto">
            <Stack gap="sm">
              {denominations.map((denomination) => (
                <Card key={denomination.id} p="xs" withBorder>
                  <Group justify="space-between" align="center">
                    <Stack gap={0}>
                      <Text size="sm" fw={500}>
                        {denomination.name ||
                          `Denomination ${denomination.value}`}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Value: {denomination.value}
                      </Text>
                    </Stack>
                    <Switch
                      size="sm"
                      checked={isDenominationAccepted(denomination)}
                      onChange={async (e) => {
                        const next = e.target.checked;
                        handleDenominationToggle(denomination.id, next);
                        try {
                          await updateDenomination({
                            denominationId:
                              denomination.id as unknown as Id<"org_denominations">,
                            accepted: next,
                          });
                        } catch (err) {
                          notifications.show({
                            title: "Error",
                            message: "Failed to update denomination",
                            color: "red",
                          });
                        }
                      }}
                      label={
                        isDenominationAccepted(denomination)
                          ? "Active"
                          : "Inactive"
                      }
                    />
                  </Group>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
        </Stack>
      </Card>
    );
  };

  const renderEditForm = (currency: Currency) => {
    const data = editingData[currency.id] || {};
    const isSaving = saving.has(currency.id);

    return (
      <Box p="md">
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="Name"
              value={data.name || ""}
              onChange={(e) =>
                updateEditingData(currency.id, "name", e.target.value)
              }
            />
            <TextInput
              label="Ticker"
              value={data.ticker || ""}
              onChange={(e) =>
                updateEditingData(currency.id, "ticker", e.target.value)
              }
            />
          </Group>

          <Group grow>
            <TextInput
              label="Rate API Identifier"
              value={data.rateApiIdentifier || ""}
              onChange={(e) =>
                updateEditingData(
                  currency.id,
                  "rateApiIdentifier",
                  e.target.value
                )
              }
            />
            <NumberInput
              label="Rate"
              value={data.rate || 0}
              decimalScale={6}
              onChange={(value) =>
                updateEditingData(currency.id, "rate", value)
              }
            />
          </Group>

          <Group grow>
            <NumberInput
              label="Float Display Order"
              value={data.floatDisplayOrder || 0}
              onChange={(value) =>
                updateEditingData(currency.id, "floatDisplayOrder", value)
              }
            />
            <Box>
              <Switch
                label="Tradeable"
                checked={data.tradeable || false}
                onChange={(e) =>
                  updateEditingData(currency.id, "tradeable", e.target.checked)
                }
              />
            </Box>
          </Group>

          <DenominationToggleSection currency={currency} data={data} />

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => handleCancel(currency.id)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={() => handleSave(currency.id)} loading={isSaving}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Box>
    );
  };

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={500}>
          Currency List
        </Text>
        <Button onClick={onRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </Group>

      <DataTable
        withTableBorder
        borderRadius="sm"
        withColumnBorders
        striped
        highlightOnHover
        records={currencies}
        idAccessor="id"
        columns={[
          {
            accessor: "expand",
            title: "",
            width: 40,
            textAlign: "center",
            render: (currency) => {
              const isExpanded = expandedRecordIds.includes(currency.id);
              return (
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isExpanded) {
                      setExpandedRecordIds((prev) =>
                        prev.filter((id) => id !== currency.id)
                      );
                    } else {
                      setExpandedRecordIds((prev) => [...prev, currency.id]);
                    }
                  }}
                >
                  {isExpanded ? (
                    <IconChevronDown size={16} />
                  ) : (
                    <IconChevronRight size={16} />
                  )}
                </ActionIcon>
              );
            },
          },
          {
            accessor: "name",
            title: "Name",
            render: ({ name }) => <Text fw={500}>{name}</Text>,
          },
          {
            accessor: "ticker",
            title: "Ticker",
            render: ({ ticker }) => (
              <Badge variant="light" color="blue">
                {ticker}
              </Badge>
            ),
          },
          {
            accessor: "rate",
            title: "Rate",
            render: ({ rate }) => (
              <Text fw={500}>{rate?.toFixed(6) || "N/A"}</Text>
            ),
          },
          {
            accessor: "tradeable",
            title: "Tradeable",
            render: ({ tradeable }) => (
              <Badge variant="light" color={tradeable ? "green" : "red"}>
                {tradeable ? "YES" : "NO"}
              </Badge>
            ),
          },
          {
            accessor: "floatDisplayOrder",
            title: "Display Order",
            render: ({ floatDisplayOrder }) => (
              <Text size="sm" c="dimmed">
                {floatDisplayOrder || 0}
              </Text>
            ),
          },
        ]}
        rowExpansion={{
          allowMultiple: false,
          trigger: "never", // Disable automatic expansion on row click
          expanded: {
            recordIds: expandedRecordIds,
            onRecordIdsChange: setExpandedRecordIds,
          },
          content: ({ record }) => {
            const isEditing = editingRows.has(record.id);
            return isEditing
              ? renderEditForm(record)
              : renderDisplayView(record);
          },
        }}
      />
    </Box>
  );
}
