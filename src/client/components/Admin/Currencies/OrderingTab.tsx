"use client";

import React, { useState, useEffect } from "react";
import { Center, Text, Table, Alert } from "@mantine/core";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { IconGripVertical } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useCurrencies } from "@/client/hooks/useCurrenciesConvex";
import { useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

interface CurrencyRecord {
  id: string;
  name: string;
  ticker: string;
  order: number;
}

export default function OrderingTab() {
  const { currencies, loading, error } = useCurrencies();
  const reorderMutation = useMutation(
    api.functions.orgCurrencies.reorderOrgCurrencies
  );
  const { orgId } = useAuth();
  const [records, setRecords] = useState<CurrencyRecord[]>([]);

  useEffect(() => {
    if (currencies && currencies.length > 0) {
      const sortedCurrencies = currencies
        .filter((c) => c)
        .sort(
          (a, b) => (a.floatDisplayOrder || 999) - (b.floatDisplayOrder || 999)
        );

      setRecords(
        sortedCurrencies.map((currency, index) => ({
          id: currency.id,
          name: currency.name,
          ticker: currency.ticker,
          order: index + 1,
        }))
      );
    }
  }, [currencies]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    if (!orgId) {
      notifications.show({
        title: "Error",
        message: "No organization selected",
        color: "red",
      });
      return;
    }

    const { source, destination } = result;
    const newRecords = Array.from(records);
    const [movedRecord] = newRecords.splice(source.index, 1);
    newRecords.splice(destination.index, 0, movedRecord);

    const updatedRecords = newRecords.map((record, index) => ({
      ...record,
      order: index + 1,
    }));

    const previousRecords = records;
    setRecords(updatedRecords);

    try {
      const orderedIds = updatedRecords.map(
        (record) => record.id as Id<"org_currencies">
      );

      await reorderMutation({
        orderedCurrencyIds: orderedIds,
        clerkOrganizationId: orgId,
      });

      notifications.show({
        title: "Success",
        message: "Currency order updated successfully",
        color: "green",
      });
    } catch (error) {
      console.error("Error reordering currencies:", error);
      setRecords(previousRecords);
      notifications.show({
        title: "Error",
        message: "Failed to update currency order",
        color: "red",
      });
    }
  };

  if (error) {
    return (
      <Center py="xl">
        <Text c="red">Error loading currencies: {error}</Text>
      </Center>
    );
  }

  if (loading) {
    return (
      <Center py="xl">
        <Text>Loading currencies...</Text>
      </Center>
    );
  }

  if (records.length === 0) {
    return (
      <Alert>No currencies found. Create a new currency to get started.</Alert>
    );
  }

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="currency-ordering">
          {(provided) => (
            <Table {...provided.droppableProps} ref={provided.innerRef}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 50 }}>Drag</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Ticker</Table.Th>
                  <Table.Th style={{ width: 120 }}>Order</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {records.map((record, index) => (
                  <Draggable
                    key={record.id}
                    draggableId={record.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <Table.Tr
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          ...provided.draggableProps.style,
                          backgroundColor: snapshot.isDragging
                            ? "#f8f9fa"
                            : undefined,
                        }}
                      >
                        <Table.Td>
                          <Center {...provided.dragHandleProps}>
                            <IconGripVertical size={18} />
                          </Center>
                        </Table.Td>
                        <Table.Td>
                          <Text fw={500}>{record.name}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text c="dimmed">{record.ticker}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{record.order}</Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Table.Tbody>
            </Table>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
