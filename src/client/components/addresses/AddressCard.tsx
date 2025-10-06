"use client";

import React from "react";
import {
  Paper,
  Text,
  Box,
  Badge,
  ActionIcon,
  Tooltip,
  Group,
  Stack,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconStar,
  IconStarFilled,
  IconCheck,
  IconPhone,
  IconMail,
  IconNotes,
} from "@tabler/icons-react";
import type { OrgAddress } from "@/client/hooks/useOrgAddresses";

interface AddressCardProps {
  address: OrgAddress;
  onEdit?: (address: OrgAddress) => void;
  onDelete?: (address: OrgAddress) => void;
  onSetPrimary?: (address: OrgAddress) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  onEdit,
  onDelete,
  onSetPrimary,
  showActions = true,
  compact = false,
}) => {
  const formatAddress = () => {
    const parts = [address.line1, address.line2, address.line3].filter(Boolean);

    const cityStateZip = [
      address.city,
      `${address.stateName} ${address.postalCode}`,
      address.countryName,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      streetLines: parts,
      cityStateCountry: cityStateZip,
    };
  };

  const { streetLines, cityStateCountry } = formatAddress();

  const getAddressTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "home":
        return "blue";
      case "work":
      case "business":
        return "violet";
      case "mailing":
        return "cyan";
      case "billing":
        return "orange";
      case "shipping":
        return "green";
      default:
        return "gray";
    }
  };

  return (
    <Paper
      withBorder
      p={compact ? "sm" : "md"}
      style={{
        position: "relative",
        transition: "box-shadow 0.2s ease",
      }}
      className="address-card"
    >
      {/* Header with type and primary indicator */}
      <Group justify="space-between" align="flex-start" mb="xs">
        <Group gap="xs">
          {address.addressType && (
            <Badge
              size="sm"
              color={getAddressTypeColor(address.addressType)}
              variant="light"
            >
              {address.addressType}
            </Badge>
          )}
          {address.primary && (
            <Tooltip label="Primary Address">
              <IconStarFilled
                size={16}
                style={{ color: "var(--mantine-color-yellow-6)" }}
              />
            </Tooltip>
          )}
          {address.verified && (
            <Tooltip label="Verified Address">
              <IconCheck
                size={16}
                style={{ color: "var(--mantine-color-green-6)" }}
              />
            </Tooltip>
          )}
        </Group>

        {/* Actions */}
        {showActions && (
          <Group
            gap="xs"
            className="address-actions"
            style={{
              opacity: 1, // Always visible now
              transition: "opacity 0.2s",
            }}
          >
            {onEdit && (
              <Tooltip label="Edit Address">
                <ActionIcon
                  size="sm"
                  onClick={() => onEdit(address)}
                  color="blue"
                  variant="light"
                >
                  <IconEdit size={14} />
                </ActionIcon>
              </Tooltip>
            )}
            {onSetPrimary && !address.primary && (
              <Tooltip label="Set as Primary">
                <ActionIcon
                  size="sm"
                  onClick={() => onSetPrimary(address)}
                  color="yellow"
                  variant="subtle"
                >
                  <IconStar size={14} />
                </ActionIcon>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip label="Delete Address">
                <ActionIcon
                  size="sm"
                  onClick={() => onDelete(address)}
                  color="red"
                  variant="subtle"
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        )}
      </Group>

      {/* Address Lines */}
      <Stack gap={2} mb={compact ? "xs" : "sm"}>
        {streetLines.map((line, index) => (
          <Text key={index} size="sm" style={{ lineHeight: 1.4 }}>
            {line}
          </Text>
        ))}
        <Text size="sm" style={{ lineHeight: 1.4 }}>
          {cityStateCountry}
        </Text>
      </Stack>

      {/* Contact Information */}
      {(address.contactPhone || address.contactEmail) && (
        <Stack gap="xs" mb={compact ? "xs" : "sm"}>
          {address.contactPhone && (
            <Group gap="xs">
              <IconPhone
                size={14}
                style={{ color: "var(--mantine-color-gray-6)" }}
              />
              <Text size="sm" c="dimmed">
                {address.contactPhone}
              </Text>
            </Group>
          )}
          {address.contactEmail && (
            <Group gap="xs">
              <IconMail
                size={14}
                style={{ color: "var(--mantine-color-gray-6)" }}
              />
              <Text size="sm" c="dimmed">
                {address.contactEmail}
              </Text>
            </Group>
          )}
        </Stack>
      )}

      {/* Delivery Instructions */}
      {address.deliveryInstructions && (
        <Box mb={compact ? "xs" : "sm"}>
          <Group gap="xs" align="flex-start">
            <IconNotes
              size={14}
              style={{ color: "var(--mantine-color-gray-6)", marginTop: 2 }}
            />
            <Text size="sm" c="dimmed" fs="italic">
              {address.deliveryInstructions}
            </Text>
          </Group>
        </Box>
      )}

      {/* Notes */}
      {address.notes && !compact && (
        <Box mb="xs">
          <Text size="sm" c="dimmed" fs="italic">
            {address.notes}
          </Text>
        </Box>
      )}

      {/* Building/Department Info */}
      {(address.buildingName ||
        address.departmentName ||
        address.floorNumber ||
        address.roomNumber) &&
        !compact && (
          <Box
            mt="xs"
            pt="xs"
            style={{ borderTop: "1px solid var(--mantine-color-gray-3)" }}
          >
            <Text size="xs" c="dimmed">
              {[
                address.buildingName,
                address.departmentName,
                address.floorNumber && `Floor ${address.floorNumber}`,
                address.roomNumber && `Room ${address.roomNumber}`,
              ]
                .filter(Boolean)
                .join(" • ")}
            </Text>
          </Box>
        )}
    </Paper>
  );
};
