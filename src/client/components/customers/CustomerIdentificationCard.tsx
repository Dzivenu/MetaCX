"use client";

import React from "react";
import {
  Card,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Loader,
  Button,
} from "@mantine/core";
import {
  IconId,
  IconIdBadge2,
  IconCreditCard,
  IconEdit,
  IconPlus,
} from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { OrgCustomer } from "@/client/hooks/useOrgCustomersConvex";

interface CustomerIdentificationCardProps {
  customer: OrgCustomer;
  showTitle?: boolean;
}

export function CustomerIdentificationCard({
  customer,
  showTitle = true,
}: CustomerIdentificationCardProps) {
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
    <Card withBorder>
      {/* Header with title and add/edit button */}
      <Group justify="space-between" align="center" mb="md">
        {showTitle && <Title order={4}>Identification Documents</Title>}
        {!showTitle && <Title order={5}>Identification</Title>}
        <Button
          variant="light"
          size="xs"
          leftSection={
            hasIdentifications ? <IconEdit size={14} /> : <IconPlus size={14} />
          }
          onClick={() => {
            // TODO: Implement identification editing/creation
            const action = hasIdentifications ? "Edit" : "Add";
            console.log(`${action} identifications for customer:`, customer.id);
          }}
        >
          {hasIdentifications ? "Edit" : "Add"}
        </Button>
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
        <Stack gap="md">
          {identifications.map((id: any) => (
            <div key={id._id}>
              <Group gap="sm" align="flex-start">
                {getIdTypeIcon(id.typeOf)}
                <div style={{ flex: 1 }}>
                  <Group gap="xs" mb="xs">
                    <Badge
                      color={getIdTypeColor(id.typeOf)}
                      size="xs"
                      variant="light"
                    >
                      {formatIdType(id.typeOf)}
                    </Badge>
                    {!id.active && (
                      <Badge color="red" size="xs" variant="outline">
                        Inactive
                      </Badge>
                    )}
                    {id.verified && (
                      <Badge color="green" size="xs" variant="outline">
                        Verified
                      </Badge>
                    )}
                  </Group>

                  <Stack gap="xs">
                    {id.documentNumber && (
                      <div>
                        <Text size="xs" c="dimmed">
                          Document Number
                        </Text>
                        <Text size="sm" fw={500}>
                          {id.documentNumber}
                        </Text>
                      </div>
                    )}

                    {(id.issuingCountryName || id.issuingCountryCode) && (
                      <div>
                        <Text size="xs" c="dimmed">
                          Issuing Country
                        </Text>
                        <Text size="sm">
                          {id.issuingCountryName || id.issuingCountryCode}
                        </Text>
                      </div>
                    )}

                    <Group gap="md">
                      {id.issueDate && (
                        <div>
                          <Text size="xs" c="dimmed">
                            Issued
                          </Text>
                          <Text size="sm">{formatDate(id.issueDate)}</Text>
                        </div>
                      )}
                      {id.expiryDate && (
                        <div>
                          <Text size="xs" c="dimmed">
                            Expires
                          </Text>
                          <Text
                            size="sm"
                            c={id.expiryDate < Date.now() ? "red" : undefined}
                          >
                            {formatDate(id.expiryDate)}
                          </Text>
                        </div>
                      )}
                    </Group>

                    {id.notes && (
                      <div>
                        <Text size="xs" c="dimmed">
                          Notes
                        </Text>
                        <Text size="sm">{id.notes}</Text>
                      </div>
                    )}
                  </Stack>
                </div>
              </Group>
            </div>
          ))}
        </Stack>
      )}
    </Card>
  );
}
