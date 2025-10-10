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
  IconRoad,
  IconBuilding,
  IconMap,
  IconMailbox,
  IconWorld,
  IconStar,
  IconCheck,
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
          <Group gap="xs">
            {hasAddresses && (
              <Button
                variant="light"
                size="xs"
                leftSection={<IconEdit size={14} />}
                onClick={() => handleEdit(addresses[0])}
              >
                Edit
              </Button>
            )}
            <Button
              variant="light"
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={handleAddNew}
            >
              Add
            </Button>
          </Group>
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
                <Stack gap="xs">
                  {/* Address Type */}
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs">
                      <IconHome size={14} color="var(--mantine-color-gray-6)" />
                      <Text size="xs" c="dimmed">
                        Type
                      </Text>
                    </Group>
                    <Group gap="xs">
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
                  </Group>

                  {/* Street Address */}
                  <Group
                    justify="space-between"
                    wrap="nowrap"
                    align="flex-start"
                  >
                    <Group gap="xs">
                      <IconRoad size={14} color="var(--mantine-color-gray-6)" />
                      <Text size="xs" c="dimmed">
                        Street
                      </Text>
                    </Group>
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
                    <Group gap="xs">
                      <IconBuilding
                        size={14}
                        color="var(--mantine-color-gray-6)"
                      />
                      <Text size="xs" c="dimmed">
                        City
                      </Text>
                    </Group>
                    <Text size="sm" ta="right">
                      {address.city}
                    </Text>
                  </Group>

                  {/* State/Province */}
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs">
                      <IconMap size={14} color="var(--mantine-color-gray-6)" />
                      <Text size="xs" c="dimmed">
                        State/Province
                      </Text>
                    </Group>
                    <Text size="sm" ta="right">
                      {address.stateName || address.stateCode}
                    </Text>
                  </Group>

                  {/* Postal Code */}
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs">
                      <IconMailbox
                        size={14}
                        color="var(--mantine-color-gray-6)"
                      />
                      <Text size="xs" c="dimmed">
                        Postal Code
                      </Text>
                    </Group>
                    <Text size="sm" ta="right">
                      {address.postalCode}
                    </Text>
                  </Group>

                  {/* Country */}
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs">
                      <IconWorld
                        size={14}
                        color="var(--mantine-color-gray-6)"
                      />
                      <Text size="xs" c="dimmed">
                        Country
                      </Text>
                    </Group>
                    <Text size="sm" ta="right">
                      {address.countryName || address.countryCode || "—"}
                    </Text>
                  </Group>

                  {/* Primary Status */}
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs">
                      <IconStar size={14} color="var(--mantine-color-gray-6)" />
                      <Text size="xs" c="dimmed">
                        Primary
                      </Text>
                    </Group>
                    <Badge
                      color={address.primary ? "blue" : "gray"}
                      size="sm"
                      variant="light"
                    >
                      {address.primary ? "Yes" : "No"}
                    </Badge>
                  </Group>

                  {/* Verified Status */}
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs">
                      <IconCheck
                        size={14}
                        color="var(--mantine-color-gray-6)"
                      />
                      <Text size="xs" c="dimmed">
                        Verified
                      </Text>
                    </Group>
                    <Badge
                      color={address.verified ? "green" : "gray"}
                      size="sm"
                      variant="light"
                    >
                      {address.verified ? "Yes" : "No"}
                    </Badge>
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
