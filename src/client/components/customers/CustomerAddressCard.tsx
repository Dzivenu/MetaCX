"use client";

import React, { useState } from "react";
import {
  Card,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Loader,
  Button,
  Menu,
  ActionIcon,
} from "@mantine/core";
import {
  IconMapPin,
  IconHome,
  IconEdit,
  IconPlus,
  IconDotsVertical,
} from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { OrgCustomer } from "@/client/hooks/useOrgCustomersConvex";
import { CustomerAddressModal } from "./CustomerAddressModal";

interface CustomerAddressCardProps {
  customer: OrgCustomer;
  showTitle?: boolean;
}

export function CustomerAddressCard({
  customer,
  showTitle = true,
}: CustomerAddressCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  // Fetch addresses for this customer
  const addresses = useQuery(
    api.functions.orgAddresses.getOrgAddressesByParent,
    {
      parentType: "org_customers",
      parentId: customer.id,
      clerkOrganizationId: customer.clerkOrganizationId,
    }
  );

  const isLoading = addresses === undefined;
  const hasAddresses = addresses && addresses.length > 0;

  const handleAddNew = () => {
    setSelectedAddress(null);
    setIsModalOpen(true);
  };

  const handleEdit = (address: any) => {
    setSelectedAddress(address);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAddress(null);
  };

  const formatAddress = (address: any) => {
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.stateCode,
      address.postalCode,
      address.countryName,
    ].filter(Boolean);

    return parts.join(", ");
  };

  const getAddressTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "home":
        return "blue";
      case "work":
        return "green";
      case "mailing":
        return "orange";
      case "billing":
        return "purple";
      default:
        return "gray";
    }
  };

  return (
    <>
      <Card withBorder>
        {/* Header with title and add/edit button */}
        <Group justify="space-between" align="center" mb="md">
          {showTitle && <Title order={4}>Address Information</Title>}
          {!showTitle && <Title order={5}>Address</Title>}
          <Button
            variant="light"
            size="xs"
            leftSection={
              hasAddresses ? <IconEdit size={14} /> : <IconPlus size={14} />
            }
            onClick={handleAddNew}
          >
            {hasAddresses ? "Add" : "Add"}
          </Button>
        </Group>

        {isLoading && (
          <Group gap="sm">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Loading addresses...
            </Text>
          </Group>
        )}

        {!isLoading && !hasAddresses && (
          <Group gap="sm">
            <IconMapPin size={20} color="var(--mantine-color-gray-6)" />
            <Text size="sm" c="dimmed">
              No address information available
            </Text>
          </Group>
        )}

        {!isLoading && hasAddresses && (
          <Stack gap="lg">
            {addresses.map((address) => (
              <div key={address._id}>
                <Group gap="sm" align="flex-start" mb="xs">
                  <IconHome
                    size={16}
                    color="var(--mantine-color-gray-6)"
                    style={{ marginTop: 2 }}
                  />
                  <div style={{ flex: 1 }}>
                    <Group gap="xs" mb="xs">
                      <Badge
                        color={getAddressTypeColor(address.addressType)}
                        size="xs"
                        variant="light"
                      >
                        {address.addressType || "Address"}
                      </Badge>
                      {address.primary && (
                        <Badge color="blue" size="xs" variant="outline">
                          Primary
                        </Badge>
                      )}
                      {!address.active && (
                        <Badge color="red" size="xs" variant="outline">
                          Inactive
                        </Badge>
                      )}
                    </Group>
                  </div>
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    onClick={() => handleEdit(address)}
                  >
                    <IconEdit size={14} />
                  </ActionIcon>
                </Group>

                <Stack gap="xs" pl="xs">
                  {/* Street Address */}
                  <Group
                    justify="space-between"
                    wrap="nowrap"
                    align="flex-start"
                  >
                    <Text
                      size="xs"
                      c="dimmed"
                      style={{ minWidth: "fit-content" }}
                    >
                      Street
                    </Text>
                    <Text
                      size="sm"
                      ta="right"
                      style={{ wordBreak: "break-word" }}
                    >
                      {address.line1}
                      {address.line2 && `, ${address.line2}`}
                    </Text>
                  </Group>

                  {/* City */}
                  <Group justify="space-between" wrap="nowrap">
                    <Text size="xs" c="dimmed">
                      City
                    </Text>
                    <Text size="sm" ta="right">
                      {address.city}
                    </Text>
                  </Group>

                  {/* State */}
                  <Group justify="space-between" wrap="nowrap">
                    <Text size="xs" c="dimmed">
                      State
                    </Text>
                    <Text size="sm" ta="right">
                      {address.stateName || address.stateCode}
                    </Text>
                  </Group>

                  {/* Postal Code */}
                  <Group justify="space-between" wrap="nowrap">
                    <Text size="xs" c="dimmed">
                      Postal Code
                    </Text>
                    <Text size="sm" ta="right">
                      {address.postalCode}
                    </Text>
                  </Group>

                  {/* Country */}
                  <Group justify="space-between" wrap="nowrap">
                    <Text size="xs" c="dimmed">
                      Country
                    </Text>
                    <Text size="sm" ta="right">
                      {address.countryName || address.countryCode || "—"}
                    </Text>
                  </Group>

                  {/* Notes */}
                  {address.notes && (
                    <Group
                      justify="space-between"
                      wrap="nowrap"
                      align="flex-start"
                    >
                      <Text size="xs" c="dimmed">
                        Notes
                      </Text>
                      <Text
                        size="sm"
                        ta="right"
                        style={{ maxWidth: "60%", wordBreak: "break-word" }}
                      >
                        {address.notes}
                      </Text>
                    </Group>
                  )}
                </Stack>
              </div>
            ))}
          </Stack>
        )}
      </Card>

      <CustomerAddressModal
        customer={customer}
        opened={isModalOpen}
        onClose={handleCloseModal}
        addressToEdit={selectedAddress}
      />
    </>
  );
}
