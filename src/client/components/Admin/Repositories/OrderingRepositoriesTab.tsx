"use client";

import React, { useEffect, useState } from "react";
import { Center, Text, Table } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useRepositories } from "@/client/hooks/useRepositoriesConvex";
import { IconGripVertical } from "@tabler/icons-react";

interface RepoRecord {
  id: string;
  name: string;
  order: number;
}

export default function OrderingRepositoriesTab() {
  const { repositories, loading, error, reorderRepositories } =
    useRepositories();
  const [records, setRecords] = useState<RepoRecord[]>([]);

  // Update records when repositories data changes
  useEffect(() => {
    if (repositories) {
      const mapped: RepoRecord[] = repositories
        .slice()
        .sort((a, b) => (a.displayOrderId ?? 0) - (b.displayOrderId ?? 0))
        .map((r, idx) => ({
          id: r.id,
          name: r.name,
          order: r.displayOrderId ?? idx + 1,
        }));

      setRecords(mapped);
    }
  }, [repositories]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(records);
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(destinationIndex, 0, reorderedItem);

    const updated = items.map((item, index) => ({ ...item, order: index + 1 }));
    setRecords(updated);

    try {
      const orderedRepositoryIds = updated.map((r) => r.id);
      const success = await reorderRepositories(orderedRepositoryIds);

      if (success) {
        notifications.show({
          title: "Success",
          message: "Repository order updated",
          color: "green",
        });
      } else {
        throw new Error("Failed to reorder repositories");
      }
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e?.message || "Failed to reorder repositories",
        color: "red",
      });

      // Revert the local changes on error
      const reverted: RepoRecord[] = repositories
        .slice()
        .sort((a, b) => (a.displayOrderId ?? 0) - (b.displayOrderId ?? 0))
        .map((r, idx) => ({
          id: r.id,
          name: r.name,
          order: r.displayOrderId ?? idx + 1,
        }));
      setRecords(reverted);
    }
  };

  if (loading) {
    return (
      <div>
        <Text fw={500} mb="sm">
          Loading repositories...
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Text fw={500} mb="sm" c="red">
          Error: {error}
        </Text>
        <Text size="sm" c="dimmed">
          Check the browser console for more details.
        </Text>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div>
        <Text fw={500} mb="sm">
          No repositories found
        </Text>
        <Text size="sm" c="dimmed">
          Create some repositories first to be able to reorder them.
        </Text>
      </div>
    );
  }

  return (
    <div>
      {/* Instruction text removed per request */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="repository-ordering">
          {(provided) => (
            <Table {...provided.droppableProps} ref={provided.innerRef}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 50 }}>Drag</Table.Th>
                  <Table.Th>Name</Table.Th>
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
                          opacity: snapshot.isDragging ? 0.5 : 1,
                        }}
                      >
                        <Table.Td>
                          <Center
                            {...provided.dragHandleProps}
                            style={{ cursor: "grab" }}
                          >
                            <IconGripVertical size={16} />
                          </Center>
                        </Table.Td>
                        <Table.Td>{record.name}</Table.Td>
                        <Table.Td>{record.order}</Table.Td>
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
