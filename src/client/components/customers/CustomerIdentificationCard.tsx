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
  ActionIcon,
} from "@mantine/core";
import {
  IconId,
  IconIdBadge2,
  IconCreditCard,
  IconEdit,
  IconPlus,
  IconHash,
  IconWorld,
  IconMap,
  IconCalendar,
  IconStar,
  IconCheck,
} from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { OrgCustomer } from "@/client/hooks/useOrgCustomersConvex";
import { CustomerIdentificationModal } from "./CustomerIdentificationModal";

interface CustomerIdentificationCardProps {
  customer: OrgCustomer;
  showTitle?: boolean;
}

export function CustomerIdentificationCard({
  customer,
  showTitle = true,
}: CustomerIdentificationCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIdentification, setSelectedIdentification] =
    useState<any>(null);

  // Fetch identifications for this customer
  const identifications = useQuery(
    api.functions.orgIdentifications.listByCustomer,
    {
      orgCustomerId: customer.id as any,
      clerkOrganizationId: customer.clerkOrganizationId,
    }
  );

  const isLoading = identifications === undefined;
  const hasIdentifications = identifications && identifications.length > 0;

  const handleAddNew = () => {
    setSelectedIdentification(null);
    setIsModalOpen(true);
  };

  const handleEdit = (identification: any) => {
    setSelectedIdentification(identification);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedIdentification(null);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleDateString();
  };

  const getIdTypeIcon = (type?: string) => {
    switch (type?.toUpperCase()) {
      case "PASSPORT":
        return <IconIdBadge2 size={16} color="var(--mantine-color-gray-6)" />;
      case "DRIVING_LICENSE":
        return <IconCreditCard size={16} color="var(--mantine-color-gray-6)" />;
      case "NATIONAL_ID":
        return <IconId size={16} color="var(--mantine-color-gray-6)" />;
      default:
        return <IconId size={16} color="var(--mantine-color-gray-6)" />;
    }
  };

  const getIdTypeColor = (type?: string) => {
    switch (type?.toUpperCase()) {
      case "PASSPORT":
        return "blue";
      case "DRIVING_LICENSE":
        return "green";
      case "NATIONAL_ID":
        return "orange";
      case "RESIDENCY_CARD":
        return "purple";
      default:
        return "gray";
    }
  };

  const formatIdType = (type?: string) => {
    if (!type) return "ID Document";
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <>
      <Card withBorder>
        {/* Header with title and add/edit button */}
        <Group justify="space-between" align="center" mb="md">
          {showTitle && <Title order={4}>Identification Documents</Title>}
          {!showTitle && <Title order={5}>Identification</Title>}
          <Group gap="xs">
            {hasIdentifications && (
              <Button
                variant="light"
                size="xs"
                leftSection={<IconEdit size={14} />}
                onClick={() => handleEdit(identifications[0])}
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
              Loading identification documents...
            </Text>
          </Group>
        )}

        {!isLoading && !hasIdentifications && (
          <Group gap="sm">
            <IconId size={20} color="var(--mantine-color-gray-6)" />
            <Text size="sm" c="dimmed">
              No identification documents available
            </Text>
          </Group>
        )}

        {!isLoading && hasIdentifications && (
          <Stack gap="lg">
            {identifications.map((id: any) => (
              <div key={id._id}>
                <Stack gap="xs">
                  {/* Document Type */}
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs">
                      {getIdTypeIcon(id.typeOf)}
                      <Text size="xs" c="dimmed">
                        Type
                      </Text>
                    </Group>
                    <Group gap="xs">
                      <Badge
                        color={getIdTypeColor(id.typeOf)}
                        size="xs"
                        variant="light"
                      >
                        {formatIdType(id.typeOf)}
                      </Badge>
                      {id.primary && (
                        <Badge color="blue" size="xs" variant="outline">
                          Primary
                        </Badge>
                      )}
                      {id.verified && (
                        <Badge color="green" size="xs" variant="outline">
                          Verified
                        </Badge>
                      )}
                      {!id.active && (
                        <Badge color="red" size="xs" variant="outline">
                          Inactive
                        </Badge>
                      )}
                    </Group>
                  </Group>

                  {/* Document Number */}
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs">
                      <IconHash size={14} color="var(--mantine-color-gray-6)" />
                      <Text size="xs" c="dimmed">
                        Document #
                      </Text>
                    </Group>
                    <Text size="sm" fw={500} ta="right">
                      {id.referenceNumber || "—"}
                    </Text>
                  </Group>

                  {/* Issuing Country */}
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
                      {id.issuingCountryName || id.issuingCountryCode || "—"}
                    </Text>
                  </Group>

                  {/* Issuing State/Province */}
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs">
                      <IconMap size={14} color="var(--mantine-color-gray-6)" />
                      <Text size="xs" c="dimmed">
                        State/Province
                      </Text>
                    </Group>
                    <Text size="sm" ta="right">
                      {id.issuingStateName || id.issuingStateCode || "—"}
                    </Text>
                  </Group>

                  {/* Issue Date */}
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs">
                      <IconCalendar
                        size={14}
                        color="var(--mantine-color-gray-6)"
                      />
                      <Text size="xs" c="dimmed">
                        Issued
                      </Text>
                    </Group>
                    <Text size="sm" ta="right">
                      {id.issueDate ? formatDate(id.issueDate) : "—"}
                    </Text>
                  </Group>

                  {/* Expiry Date */}
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs">
                      <IconCalendar
                        size={14}
                        color="var(--mantine-color-gray-6)"
                      />
                      <Text size="xs" c="dimmed">
                        Expires
                      </Text>
                    </Group>
                    <Text
                      size="sm"
                      ta="right"
                      c={
                        id.expiryDate && id.expiryDate < Date.now()
                          ? "red"
                          : undefined
                      }
                    >
                      {id.expiryDate ? (
                        <>
                          {formatDate(id.expiryDate)}
                          {id.expiryDate < Date.now() && " (Expired)"}
                        </>
                      ) : (
                        "—"
                      )}
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
                      color={id.primary ? "blue" : "gray"}
                      size="sm"
                      variant="light"
                    >
                      {id.primary ? "Yes" : "No"}
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
                      color={id.verified ? "green" : "gray"}
                      size="sm"
                      variant="light"
                    >
                      {id.verified ? "Yes" : "No"}
                    </Badge>
                  </Group>

                  {/* Description/Notes */}
                  {id.description && (
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
                        {id.description}
                      </Text>
                    </Group>
                  )}
                </Stack>
              </div>
            ))}
          </Stack>
        )}
      </Card>

      <CustomerIdentificationModal
        customer={customer}
        opened={isModalOpen}
        onClose={handleCloseModal}
        identificationToEdit={selectedIdentification}
      />
    </>
  );
}
