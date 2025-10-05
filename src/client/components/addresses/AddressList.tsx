"use client";

import React, { useState } from "react";
import {
  Box,
  Text,
  Button,
  Alert,
  Modal,
  Title,
  Grid,
  Skeleton,
  Group,
  Stack,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { AddressCard } from "./AddressCard";
import { AddressForm } from "./AddressForm";
import {
  useOrgAddresses,
  type OrgAddress,
} from "@/client/hooks/useOrgAddresses";
import type { Id } from "../../../../convex/_generated/dataModel";

interface AddressListProps {
  parentType: string;
  parentId?: string;
  title?: string;
  showAddButton?: boolean;
  maxHeight?: number | string;
  compact?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  allowSetPrimary?: boolean;
}

export const AddressList: React.FC<AddressListProps> = ({
  parentType,
  parentId,
  title = "Addresses",
  showAddButton = true,
  maxHeight,
  compact = false,
  allowEdit = true,
  allowDelete = true,
  allowSetPrimary = true,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<OrgAddress | null>(null);
  const [deleteConfirmAddress, setDeleteConfirmAddress] =
    useState<OrgAddress | null>(null);

  const {
    addresses,
    loading,
    error,
    createAddress,
    updateAddress,
    deleteAddress,
    setPrimaryAddress,
  } = useOrgAddresses({
    parentType,
    parentId,
  });

  const handleAddAddress = () => {
    console.log("Add Address clicked", { parentType, parentId, isFormOpen });
    setEditingAddress(null);
    setIsFormOpen(true);
    console.log("Modal should open, isFormOpen set to:", true);
  };

  const handleEditAddress = (address: OrgAddress) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  const handleDeleteAddress = (address: OrgAddress) => {
    setDeleteConfirmAddress(address);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmAddress) return;

    try {
      await deleteAddress(deleteConfirmAddress._id);
      setDeleteConfirmAddress(null);
    } catch (error) {
      console.error("Failed to delete address:", error);
    }
  };

  const handleSetPrimary = async (address: OrgAddress) => {
    try {
      await setPrimaryAddress(address._id);
    } catch (error) {
      console.error("Failed to set primary address:", error);
    }
  };

  const handleFormSubmit = async (data: any) => {
    console.log("🚀 Form submit called with data:", data);
    try {
      if (editingAddress) {
        console.log("📝 Updating existing address:", editingAddress._id);
        // Update existing address
        await updateAddress({
          addressId: editingAddress._id,
          ...data,
        });
        console.log("✅ Address updated successfully");
      } else {
        console.log("🆕 Creating new address for:", { parentType, parentId });
        // Create new address
        if (!parentId) {
          throw new Error("Parent ID is required to create an address");
        }
        const result = await createAddress({
          parentType,
          parentId,
          ...data,
        });
        console.log("✅ Address created successfully:", result);
      }
      setIsFormOpen(false);
      setEditingAddress(null);
      console.log("🔄 Modal closed, form reset");
    } catch (error) {
      console.error("❌ Failed to save address:", error);
      throw error;
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingAddress(null);
  };

  // Show loading skeleton
  if (loading) {
    return (
      <Box>
        <Group justify="space-between" mb="md">
          <Title order={3}>{title}</Title>
        </Group>
        <Grid>
          {[1, 2].map((i) => (
            <Grid.Col span={{ base: 12, md: 6 }} key={i}>
              <Skeleton height={compact ? 120 : 180} />
            </Grid.Col>
          ))}
        </Grid>
      </Box>
    );
  }

  // Show error if there's one
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
      {/* Header */}
      <Group justify="space-between" mb="md">
        <Title order={3}>{title}</Title>
        {/* Debug info */}
        {console.log("AddressList render debug:", {
          showAddButton,
          parentId,
          parentType,
          shouldShowButton: showAddButton && parentId,
          isFormOpen,
          addresses: addresses?.length,
        })}
        {showAddButton && parentId && (
          <Button
            variant="outline"
            leftSection={<IconPlus size={16} />}
            onClick={handleAddAddress}
            size="sm"
          >
            Add Address
          </Button>
        )}
        {/* Show debug button if parentId is missing */}
        {showAddButton && !parentId && (
          <Button variant="outline" disabled size="sm">
            Add Address (No Parent ID)
          </Button>
        )}
      </Group>

      {/* Address List */}
      <Box
        style={{
          maxHeight,
          overflowY: maxHeight ? "auto" : "visible",
        }}
      >
        {addresses.length === 0 ? (
          <Alert color="blue" title="No addresses found" mb="md">
            {showAddButton && parentId && "Click 'Add Address' to create one."}
          </Alert>
        ) : (
          <Grid>
            {addresses.map((address) => (
              <Grid.Col
                span={{ base: 12, md: compact ? 12 : 6 }}
                key={address._id}
              >
                <AddressCard
                  address={address}
                  onEdit={allowEdit ? handleEditAddress : undefined}
                  onDelete={allowDelete ? handleDeleteAddress : undefined}
                  onSetPrimary={allowSetPrimary ? handleSetPrimary : undefined}
                  compact={compact}
                />
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Box>

      {/* Add/Edit Address Modal */}
      {console.log("Modal render debug:", {
        isFormOpen,
        editingAddress: !!editingAddress,
        modalTitle: editingAddress ? "Edit Address" : "Add New Address",
      })}
      <Modal
        opened={isFormOpen}
        onClose={handleFormCancel}
        title={editingAddress ? "Edit Address" : "Add New Address"}
        size="lg"
        style={{ minHeight: "60vh" }}
      >
        <AddressForm
          initialData={editingAddress || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          submitText={editingAddress ? "Update Address" : "Add Address"}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={!!deleteConfirmAddress}
        onClose={() => setDeleteConfirmAddress(null)}
        title="Confirm Delete"
        size="sm"
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete this address? This action cannot be
            undone.
          </Text>
          {deleteConfirmAddress && (
            <Box
              p="md"
              style={{
                backgroundColor: "var(--mantine-color-gray-1)",
                borderRadius: "var(--mantine-radius-sm)",
              }}
            >
              <Text size="sm" style={{ whiteSpace: "pre-line" }}>
                {deleteConfirmAddress.line1}
                {deleteConfirmAddress.line2 &&
                  `\n${deleteConfirmAddress.line2}`}
                {deleteConfirmAddress.line3 &&
                  `\n${deleteConfirmAddress.line3}`}
                {`\n${deleteConfirmAddress.city}, ${deleteConfirmAddress.stateName} ${deleteConfirmAddress.postalCode}`}
                {`\n${deleteConfirmAddress.countryName}`}
              </Text>
            </Box>
          )}
          <Group justify="flex-end" gap="sm">
            <Button
              onClick={() => setDeleteConfirmAddress(null)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} color="red">
              Delete Address
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};
