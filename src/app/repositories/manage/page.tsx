"use client";

import { useState } from "react";
import {
  Container,
  Title,
  Table,
  Badge,
  ActionIcon,
  Group,
  Text,
  LoadingOverlay,
  Alert,
  Button,
  Modal,
  Stack,
  TextInput,
  Select,
  Switch,
  NumberInput,
  MultiSelect,
  Chip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconEdit, IconAlertCircle } from "@tabler/icons-react";
import { useRepositories } from "@/client/hooks/useRepositoriesConvex";
import { Repository } from "@/client/hooks/useRepositoriesConvex";
import { useCurrencies } from "@/client/hooks/useCurrenciesConvex";
import { notifications } from "@mantine/notifications";

interface EditRepositoryModalProps {
  repository: Repository | null;
  opened: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Repository>) => Promise<boolean>;
  currencies: Array<{ value: string; label: string }>;
}

function EditRepositoryModal({
  repository,
  opened,
  onClose,
  onSave,
  currencies,
}: EditRepositoryModalProps) {
  const [formData, setFormData] = useState<Partial<Repository>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!repository) return;

    setSaving(true);
    try {
      const success = await onSave(repository.id, formData);
      if (success) {
        notifications.show({
          title: "Success",
          message: "Repository updated successfully",
          color: "green",
        });
        onClose();
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to update repository",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!repository) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Edit Repository: ${repository.name}`}
      size="lg"
    >
      <Stack gap="md">
        <TextInput
          label="Name"
          placeholder="Repository name"
          defaultValue={repository.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
        />

        <Select
          label="Type"
          placeholder="Select repository type"
          defaultValue={repository.typeOf}
          data={[
            { value: "PHYSICAL", label: "Physical" },
            { value: "VIRTUAL", label: "Virtual" },
            { value: "HYBRID", label: "Hybrid" },
          ]}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, typeOf: value || undefined }))
          }
        />

        <Select
          label="Currency Type"
          placeholder="Select currency type"
          defaultValue={repository.currencyType}
          data={[
            { value: "FIAT", label: "Fiat" },
            { value: "CRYPTO", label: "Cryptocurrency" },
            { value: "METAL", label: "Metal" },
            { value: "MIXED", label: "Mixed" },
          ]}
          onChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              currencyType: value || undefined,
            }))
          }
        />

        <Select
          label="Form"
          placeholder="Select form"
          defaultValue={repository.form}
          data={[
            { value: "CASH", label: "Cash" },
            { value: "DIGITAL", label: "Digital" },
            { value: "CARD", label: "Card" },
          ]}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, form: value || undefined }))
          }
        />

        <TextInput
          label="Key"
          placeholder="Repository key"
          defaultValue={repository.key}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, key: e.target.value }))
          }
        />

        <Group grow>
          <NumberInput
            label="Float Threshold Bottom"
            placeholder="Bottom threshold"
            defaultValue={repository.floatThresholdBottom ?? undefined}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                floatThresholdBottom:
                  typeof value === "number" ? value : undefined,
              }))
            }
          />
          <NumberInput
            label="Float Threshold Top"
            placeholder="Top threshold"
            defaultValue={repository.floatThresholdTop ?? undefined}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                floatThresholdTop:
                  typeof value === "number" ? value : undefined,
              }))
            }
          />
        </Group>

        <MultiSelect
          label="Currency Tickers"
          placeholder="Select currencies"
          data={currencies}
          defaultValue={repository.currencyTickers ?? []}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, currencyTickers: value }))
          }
        />

        <Group>
          <Switch
            label="Float Count Required"
            defaultChecked={repository.floatCountRequired ?? false}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                floatCountRequired: e.target.checked,
              }))
            }
          />
          <Switch
            label="Active"
            defaultChecked={repository.active ?? false}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, active: e.target.checked }))
            }
          />
        </Group>

        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default function ManageRepositoriesPage() {
  const { repositories, loading, error, refresh, updateRepository } =
    useRepositories();
  const { currencies } = useCurrencies();
  const [editRepository, setEditRepository] = useState<Repository | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  const currencyOptions = currencies.map((currency) => ({
    value: currency.ticker,
    label: `${currency.ticker} - ${currency.name}`,
  }));

  const handleEdit = (repository: Repository) => {
    setEditRepository(repository);
    openModal();
  };

  const handleCloseModal = () => {
    setEditRepository(null);
    closeModal();
  };

  const handleSave = async (id: string, data: Partial<Repository>) => {
    try {
      const success = await updateRepository(id, data);
      if (success) {
        await refresh();
      }
      return success;
    } catch (error) {
      console.error("Error updating repository:", error);
      return false;
    }
  };

  if (loading) {
    return (
      <Container size="xl" py="xl" pos="relative">
        <LoadingOverlay visible />
        <Title order={2} mb="xl">
          Manage Repositories
        </Title>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Title order={2} mb="xl">
          Manage Repositories
        </Title>
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Manage Repositories</Title>
        <Button onClick={refresh} variant="outline">
          Refresh
        </Button>
      </Group>

      {repositories.length === 0 ? (
        <Alert>
          No repositories found. Create a new repository to get started.
        </Alert>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Currency Type</Table.Th>
              <Table.Th>Form</Table.Th>
              <Table.Th>Key</Table.Th>
              <Table.Th>Currencies</Table.Th>
              <Table.Th>Float Count Required</Table.Th>
              <Table.Th>Active</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {repositories.map((repository) => (
              <Table.Tr key={repository.id}>
                <Table.Td>
                  <Text fw={500}>{repository.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color="blue">
                    {repository.typeOf}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color="cyan">
                    {repository.currencyType}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color="grape">
                    {repository.form}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {repository.key}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {repository.currencyTickers?.slice(0, 3).map((ticker) => (
                      <Chip key={ticker} size="xs" variant="light">
                        {ticker}
                      </Chip>
                    ))}
                    {(repository.currencyTickers?.length ?? 0) > 3 && (
                      <Text size="xs" c="dimmed">
                        +{(repository.currencyTickers?.length ?? 0) - 3} more
                      </Text>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge
                    variant="light"
                    color={repository.floatCountRequired ? "green" : "orange"}
                  >
                    {repository.floatCountRequired ? "YES" : "NO"}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
                    variant="light"
                    color={repository.active ? "green" : "red"}
                  >
                    {repository.active ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => handleEdit(repository)}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <EditRepositoryModal
        repository={editRepository}
        opened={modalOpened}
        onClose={handleCloseModal}
        onSave={handleSave}
        currencies={currencyOptions}
      />
    </Container>
  );
}
