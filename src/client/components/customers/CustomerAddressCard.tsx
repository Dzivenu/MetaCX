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
import { IconMapPin, IconHome, IconEdit, IconPlus } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { OrgCustomer } from "@/client/hooks/useOrgCustomersConvex";

interface CustomerAddressCardProps {
  customer: OrgCustomer;
  showTitle?: boolean;
}

export function CustomerAddressCard({
  customer,
  showTitle = true,
}: CustomerAddressCardProps) {
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
          onClick={() => {
            // TODO: Implement address editing/creation
            const action = hasAddresses ? "Edit" : "Add";
            console.log(`${action} addresses for customer:`, customer.id);
          }}
        >
          {hasAddresses ? "Edit" : "Add"}
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
        <Stack gap="md">
          {addresses.map((address) => (
            <div key={address._id}>
              <Group gap="sm" align="flex-start">
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

                  <Text size="sm">{formatAddress(address)}</Text>

                  {address.notes && (
                    <Text size="xs" c="dimmed" mt="xs">
                      {address.notes}
                    </Text>
                  )}
                </div>
              </Group>
            </div>
          ))}
        </Stack>
      )}
    </Card>
  );
}
