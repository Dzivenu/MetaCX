"use client";

import React from "react";
import {
  Paper,
  Group,
  Badge,
  Text,
  Tooltip,
  ActionIcon,
  Stack,
  Box,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconShieldCheck,
  IconStar,
  IconStarFilled,
  IconId,
} from "@tabler/icons-react";
import type { OrgIdentification } from "@/client/hooks/useOrgIdentifications";

interface IdentificationCardProps {
  item: OrgIdentification;
  onEdit?: (item: OrgIdentification) => void;
  onDelete?: (item: OrgIdentification) => void;
  onSetPrimary?: (item: OrgIdentification) => void;
  compact?: boolean;
}

export const IdentificationCard: React.FC<IdentificationCardProps> = ({
  item,
  onEdit,
  onDelete,
  onSetPrimary,
  compact = false,
}) => {
  const topBadges = (
    <Group gap="xs">
      <Badge
        leftSection={<IconId size={12} />}
        color="blue"
        variant="light"
        size="sm"
      >
        {item.typeOf}
      </Badge>
      {item.verified && (
        <Tooltip label="Verified">
          <Badge
            leftSection={<IconShieldCheck size={12} />}
            color="green"
            variant="light"
            size="sm"
          >
            Verified
          </Badge>
        </Tooltip>
      )}
      {item.primary && (
        <Tooltip label="Primary">
          <Badge
            leftSection={<IconStarFilled size={12} />}
            color="yellow"
            variant="light"
            size="sm"
          >
            Primary
          </Badge>
        </Tooltip>
      )}
    </Group>
  );

  const actions = (
    <Group gap="xs">
      {onEdit && (
        <Tooltip label="Edit Identification">
          <ActionIcon
            variant="light"
            color="blue"
            size="sm"
            onClick={() => onEdit(item)}
          >
            <IconEdit size={14} />
          </ActionIcon>
        </Tooltip>
      )}
      {onSetPrimary && !item.primary && (
        <Tooltip label="Set Primary">
          <ActionIcon
            variant="subtle"
            color="yellow"
            size="sm"
            onClick={() => onSetPrimary(item)}
          >
            <IconStar size={14} />
          </ActionIcon>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip label="Delete Identification">
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            onClick={() => onDelete(item)}
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );

  return (
    <Paper withBorder p={compact ? "sm" : "md"}>
      <Group justify="space-between" align="center" mb="xs">
        {topBadges}
        {actions}
      </Group>
      <Stack gap={4}>
        <Group gap="sm">
          <Text size="sm" c="dimmed">
            Reference
          </Text>
          <Text size="sm" fw={500}>
            {item.referenceNumber}
          </Text>
        </Group>
        <Group gap="sm">
          <Text size="sm" c="dimmed">
            Issuing
          </Text>
          <Text size="sm" fw={500}>
            {item.issuingStateName ? `${item.issuingStateName}, ` : ""}
            {item.issuingCountryName || item.issuingCountryCode || "-"}
          </Text>
        </Group>
        <Group gap="sm">
          <Text size="sm" c="dimmed">
            Validity
          </Text>
          <Text size="sm" fw={500}>
            {item.issueDate
              ? new Date(item.issueDate).toLocaleDateString()
              : "-"}
            →{" "}
            {item.expiryDate
              ? new Date(item.expiryDate).toLocaleDateString()
              : "-"}
          </Text>
        </Group>
        {item.description && (
          <Box>
            <Text size="sm" c="dimmed">
              Notes
            </Text>
            <Text size="sm">{item.description}</Text>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};
