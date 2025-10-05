"use client";

import { useState, useMemo } from "react";
import {
  Stack,
  Group,
  Text,
  Badge,
  Button,
  TextInput,
  Select,
  Switch,
  NumberInput,
  Box,
  Checkbox,
  ScrollArea,
} from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";
import { DataTableColumn } from "mantine-datatable";
import { Repository } from "@/client/hooks/useRepositoriesConvex";
import { notifications } from "@mantine/notifications";
import { CollapsibleRowTable } from "@/client/components/blocks";

interface Currency {
  ticker: string;
  name: string;
  typeOf: string;
}

interface RepositoryDataTableProps {
  repositories: Repository[];
  currencies: Currency[];
  onUpdateRepository: (
    id: string,
    data: Partial<Repository>
  ) => Promise<boolean>;
  onRefresh: () => void;
}

interface EditingState {
  [key: string]: Partial<Repository>;
}

export function RepositoryDataTable({
  repositories,
  currencies,
  onUpdateRepository,
  onRefresh,
}: RepositoryDataTableProps) {
  const [editingData, setEditingData] = useState<EditingState>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());

  // Function to get display name for currency type
  const getCurrencyTypeDisplayName = (currencyType: string) => {
    switch (currencyType) {
      case "CRYPTO":
        return "Cryptocurrency";
      case "FIAT":
        return "Fiat";
      case "METAL":
        return "Metal";
      default:
        return currencyType;
    }
  };

  const handleEdit = (repository: Repository) => {
    setEditingData({
      ...editingData,
      [repository.id]: { ...repository },
    });
    setEditingRows(new Set([...editingRows, repository.id]));
  };

  const handleCancel = (repositoryId: string) => {
    const newEditingData = { ...editingData };
    delete newEditingData[repositoryId];
    setEditingData(newEditingData);

    const newEditingRows = new Set(editingRows);
    newEditingRows.delete(repositoryId);
    setEditingRows(newEditingRows);
  };

  const handleSave = async (repositoryId: string) => {
    const data = editingData[repositoryId];
    if (!data) return;

    setSaving(new Set([...saving, repositoryId]));

    try {
      const success = await onUpdateRepository(repositoryId, data);
      if (success) {
        notifications.show({
          title: "Success",
          message: "Repository updated successfully",
          color: "green",
        });
        handleCancel(repositoryId);
        onRefresh();
      } else {
        notifications.show({
          title: "Error",
          message: "Failed to update repository",
          color: "red",
        });
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to update repository",
        color: "red",
      });
    } finally {
      const newSaving = new Set(saving);
      newSaving.delete(repositoryId);
      setSaving(newSaving);
    }
  };

  const updateEditingData = (
    repositoryId: string,
    field: string,
    value: string | number | boolean | string[] | null
  ) => {
    setEditingData({
      ...editingData,
      [repositoryId]: {
        ...editingData[repositoryId],
        [field]: value,
      },
    });
  };

  const CurrencyToggleSection = ({
    repository,
    data,
  }: {
    repository: Repository;
    data: Partial<Repository>;
  }) => {
    const repositoryCurrencyType = data.currencyType || repository.currencyType;

    const filteredCurrencies = useMemo(() => {
      if (!currencies || currencies.length === 0) return [];
      return currencies.filter((currency: Currency) => {
        if (!currency?.typeOf) return false;
        const currencyType = currency.typeOf.toLowerCase();
        switch (repositoryCurrencyType) {
          case "FIAT":
            return currencyType === "fiat";
          case "CRYPTO":
            return currencyType === "crypto";
          case "METAL":
            return currencyType === "metal";
          default:
            return true;
        }
      });
    }, [currencies, repositoryCurrencyType]);

    const selectedTickers =
      data.currencyTickers || repository.currencyTickers || [];

    return (
      <Box>
        <Text size="sm" fw={500} mb="xs">
          Available Currencies
        </Text>
        <ScrollArea h={200}>
          <Stack gap="xs">
            {filteredCurrencies.map((currency) => (
              <Checkbox
                key={currency.ticker}
                label={`${currency.ticker} - ${currency.name}`}
                checked={selectedTickers.includes(currency.ticker)}
                onChange={(event) => {
                  const isChecked = event.currentTarget.checked;
                  let newTickers;
                  if (isChecked) {
                    newTickers = [...selectedTickers, currency.ticker];
                  } else {
                    newTickers = selectedTickers.filter(
                      (ticker: string) => ticker !== currency.ticker
                    );
                  }
                  updateEditingData(
                    repository.id,
                    "currencyTickers",
                    newTickers
                  );
                }}
              />
            ))}
          </Stack>
        </ScrollArea>
      </Box>
    );
  };

  const renderDisplayView = (repository: Repository) => {
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
                {getCurrencyTypeDisplayName(repository.currencyType)}
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
              <Text>{repository.floatThresholdBottom || 0}</Text>
            </Box>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Float Threshold Top
              </Text>
              <Text>{repository.floatThresholdTop || 0}</Text>
            </Box>
          </Group>

          <Box>
            <Text size="sm" fw={500} c="dimmed">
              Currency Tickers
            </Text>
            <Group gap="xs" mt="xs">
              {(repository.currencyTickers || []).map((ticker) => (
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
              Float Count Required:{" "}
              {repository.floatCountRequired ? "YES" : "NO"}
            </Badge>
            <Badge variant="light" color={repository.active ? "green" : "red"}>
              Status: {repository.active ? "ACTIVE" : "INACTIVE"}
            </Badge>
          </Group>

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              leftSection={<IconEdit size={16} />}
              onClick={() => handleEdit(repository)}
            >
              Edit Repository
            </Button>
          </Group>
        </Stack>
      </Box>
    );
  };

  const renderEditForm = (repository: Repository, collapse: () => void) => {
    const data = editingData[repository.id] || {};
    const isSaving = saving.has(repository.id);

    return (
      <Box p="md">
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="Name"
              value={data.name || ""}
              onChange={(e) =>
                updateEditingData(repository.id, "name", e.target.value)
              }
            />
            <TextInput
              label="Key"
              value={data.key || ""}
              onChange={(e) =>
                updateEditingData(repository.id, "key", e.target.value)
              }
            />
          </Group>

          <Group grow>
            <Select
              label="Type"
              value={data.typeOf || ""}
              data={[
                { value: "PRIMARY", label: "Primary" },
                { value: "SECONDARY", label: "Secondary" },
                { value: "TERTIARY", label: "Tertiary" },
              ]}
              onChange={(value) =>
                updateEditingData(repository.id, "typeOf", value)
              }
            />
            <Select
              label="Currency Type"
              value={data.currencyType || ""}
              data={[
                { value: "FIAT", label: "Fiat" },
                { value: "CRYPTO", label: "Cryptocurrency" },
                { value: "METAL", label: "Metal" },
              ]}
              onChange={(value) => {
                updateEditingData(repository.id, "currencyType", value);
                const filteredCurrencies = currencies.filter((currency) => {
                  switch (value) {
                    case "FIAT":
                      return currency.typeOf === "fiat";
                    case "CRYPTO":
                      return currency.typeOf === "crypto";
                    case "METAL":
                      return currency.typeOf === "metal";
                    default:
                      return true;
                  }
                });
                const validTickers = (
                  data.currencyTickers ||
                  repository.currencyTickers ||
                  []
                ).filter((ticker: string) =>
                  filteredCurrencies.some((c: Currency) => c.ticker === ticker)
                );
                updateEditingData(
                  repository.id,
                  "currencyTickers",
                  validTickers
                );
              }}
            />
            <Select
              label="Form"
              value={data.form || ""}
              data={[
                { value: "CASH", label: "Cash" },
                { value: "DIGITAL", label: "Digital" },
                { value: "CARD", label: "Card" },
              ]}
              onChange={(value) =>
                updateEditingData(repository.id, "form", value)
              }
            />
          </Group>

          <Group grow>
            <NumberInput
              label="Float Threshold Bottom"
              value={data.floatThresholdBottom || 0}
              onChange={(value) =>
                updateEditingData(repository.id, "floatThresholdBottom", value)
              }
            />
            <NumberInput
              label="Float Threshold Top"
              value={data.floatThresholdTop || 0}
              onChange={(value) =>
                updateEditingData(repository.id, "floatThresholdTop", value)
              }
            />
          </Group>

          <CurrencyToggleSection repository={repository} data={data} />

          <Group>
            <Switch
              label="Float Count Required"
              checked={data.floatCountRequired || false}
              onChange={(e) =>
                updateEditingData(
                  repository.id,
                  "floatCountRequired",
                  e.target.checked
                )
              }
            />
            <Switch
              label="Active"
              checked={data.active || false}
              onChange={(e) =>
                updateEditingData(repository.id, "active", e.target.checked)
              }
            />
          </Group>

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                handleCancel(repository.id);
                collapse();
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await handleSave(repository.id);
                collapse();
              }}
              loading={isSaving}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Box>
    );
  };

  const columns: DataTableColumn<Repository>[] = [
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
          {getCurrencyTypeDisplayName(currencyType)}
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
          {(currencyTickers || []).slice(0, 3).map((ticker) => (
            <Badge key={ticker} size="xs" variant="light">
              {ticker}
            </Badge>
          ))}
          {(currencyTickers || []).length > 3 && (
            <Text size="xs" c="dimmed">
              +{(currencyTickers || []).length - 3} more
            </Text>
          )}
        </Group>
      ),
    },
    {
      accessor: "floatCountRequired",
      title: "Float Count Required",
      render: ({ floatCountRequired }) => (
        <Badge variant="light" color={floatCountRequired ? "green" : "orange"}>
          {floatCountRequired ? "YES" : "NO"}
        </Badge>
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

  const renderExpandedContent = (
    repository: Repository,
    collapse: () => void
  ) => {
    const isEditing = editingRows.has(repository.id);
    return isEditing
      ? renderEditForm(repository, collapse)
      : renderDisplayView(repository);
  };

  return (
    <CollapsibleRowTable
      records={repositories}
      idAccessor="id"
      columns={columns}
      renderExpandedContent={renderExpandedContent}
      // title removed per request
      // refresh button removed per request
      allowMultiple={false}
      emptyStateMessage="No repositories found. Create a new repository to get started."
    />
  );
}
