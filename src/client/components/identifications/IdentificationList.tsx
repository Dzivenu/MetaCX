"use client";

import React, { useState } from "react";
import {
  Box,
  Title,
  Button,
  Grid,
  Alert,
  Group,
  Modal,
  Skeleton,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { IdentificationCard } from "./IdentificationCard";
import { IdentificationForm } from "./IdentificationForm";
import {
  useOrgIdentifications,
  type OrgIdentification,
} from "@/client/hooks/useOrgIdentifications";
import type { Id } from "../../../../convex/_generated/dataModel";

interface Props {
  orgCustomerId?: Id<"org_customers">;
  title?: string;
  compact?: boolean;
  showAddButton?: boolean;
}

export const IdentificationList: React.FC<Props> = ({
  orgCustomerId,
  title = "Identifications",
  compact = false,
  showAddButton = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<OrgIdentification | null>(null);

  const { items, loading, error, createItem, updateItem, deleteItem } =
    useOrgIdentifications({ orgCustomerId });

  const handleAdd = () => {
    setEditing(null);
    setIsOpen(true);
  };

  const handleEdit = (item: OrgIdentification) => {
    setEditing(item);
    setIsOpen(true);
  };

  const handleDelete = async (item: OrgIdentification) => {
    await deleteItem(item._id);
  };

  const handlePrimary = async (item: OrgIdentification) => {
    await updateItem({ id: item._id, primary: true });
  };

  const handleSubmit = async (data: any) => {
    if (editing) {
      await updateItem({ id: editing._id, ...data });
    } else {
      await createItem(data);
    }
    setIsOpen(false);
    setEditing(null);
  };

  if (loading) {
    return (
      <Box>
        <Group justify="space-between" mb="md">
          <Title order={3}>{title}</Title>
        </Group>
        <Grid>
          {[1, 2].map((i) => (
            <Grid.Col key={i} span={{ base: 12, md: compact ? 12 : 6 }}>
              <Skeleton height={compact ? 120 : 160} />
            </Grid.Col>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Group justify="space-between" mb="md">
          <Title order={3}>{title}</Title>
        </Group>
        <Alert color="red" title="Error">
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Title order={3}>{title}</Title>
        {showAddButton && orgCustomerId && (
          <Button
            size="sm"
            variant="outline"
            leftSection={<IconPlus size={16} />}
            onClick={handleAdd}
          >
            Add Identification
          </Button>
        )}
      </Group>

      {items.length === 0 ? (
        <Alert color="blue" title="No identifications found" mb="md">
          {showAddButton &&
            orgCustomerId &&
            "Click 'Add Identification' to create one."}
        </Alert>
      ) : (
        <Grid>
          {items.map((item) => (
            <Grid.Col key={item._id} span={{ base: 12, md: compact ? 12 : 6 }}>
              <IdentificationCard
                item={item}
                compact={compact}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSetPrimary={handlePrimary}
              />
            </Grid.Col>
          ))}
        </Grid>
      )}

      <Modal
        opened={isOpen}
        onClose={() => setIsOpen(false)}
        title={editing ? "Edit Identification" : "Add Identification"}
        size="lg"
      >
        {orgCustomerId && (
          <IdentificationForm
            initialData={editing || undefined}
            orgCustomerId={orgCustomerId as any}
            onSubmit={handleSubmit}
            onCancel={() => setIsOpen(false)}
            submitText={editing ? "Update" : "Create"}
          />
        )}
      </Modal>
    </Box>
  );
};
