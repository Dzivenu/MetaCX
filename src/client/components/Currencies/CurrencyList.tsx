import React, { useState } from "react";
import { useCurrencies } from "@/client/hooks/useCurrenciesConvex";
import type { Currency } from "@/client/hooks/useCurrenciesConvex";
import { CurrencyDetailsForm } from "./CurrencyDetailsForm";
import {
  Table,
  Group,
  Badge,
  Button,
  Text,
  ActionIcon,
  Tooltip,
  Center,
  Loader,
  Alert,
} from "@mantine/core";
import { IconEdit, IconTrash, IconRefresh } from "@tabler/icons-react";

interface CurrencyListProps {
  onDelete?: (currencyId: string) => void;
}

export const CurrencyList: React.FC<CurrencyListProps> = ({ onDelete }) => {
  const { currencies, loading, error, refresh } = useCurrencies();
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [editModalOpened, setEditModalOpened] = useState(false);

  const handleEditClick = (currency: Currency) => {
    setEditingCurrency(currency);
    setEditModalOpened(true);
  };

  const handleDeleteClick = (currencyId: string) => {
    if (window.confirm("Are you sure you want to delete this currency?")) {
      if (onDelete) {
        onDelete(currencyId);
      }
    }
  };

  const handleEditSave = () => {
    refresh();
  };

  if (loading) {
    return (
      <Center style={{ height: "300px" }}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert
        color="red"
        title="Error loading currencies"
        action={
          <Button
            variant="outline"
            color="red"
            onClick={refresh}
            leftSection={<IconRefresh size={16} />}
          >
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Ticker</Table.Th>
            <Table.Th>Rate</Table.Th>
            <Table.Th>Tradeable</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {currencies &&
            currencies.map((currency) => (
              <Table.Tr key={currency.id}>
                <Table.Td>
                  <Group align="center">{currency.name}</Group>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light">{currency.ticker}</Badge>
                </Table.Td>
                <Table.Td>
                  <Text fw={500}>{currency.rate?.toFixed(6)}</Text>
                </Table.Td>
                <Table.Td>
                  {currency.tradeable ? (
                    <Badge color="green">Yes</Badge>
                  ) : (
                    <Badge color="red">No</Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <Tooltip label="Edit currency">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => handleEditClick(currency)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete currency">
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDeleteClick(currency.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
        </Table.Tbody>
      </Table>

      {editingCurrency && (
        <CurrencyDetailsForm
          currency={editingCurrency}
          opened={editModalOpened}
          onClose={() => setEditModalOpened(false)}
          onSave={handleEditSave}
        />
      )}

      {currencies && currencies.length === 0 && (
        <Center py="xl">
          <Text c="dimmed">
            No currencies found. Create your first currency to get started.
          </Text>
        </Center>
      )}
    </>
  );
};
