"use client";

import React, { useState } from "react";
import { Card, Title, Text, Group, Stack, Badge, Button } from "@mantine/core";
import {
  IconUser,
  IconBriefcase,
  IconCalendar,
  IconMail,
  IconPhone,
  IconEdit,
} from "@tabler/icons-react";
import type { OrgCustomer } from "@/client/hooks/useOrgCustomersConvex";
import { CustomerEditModal } from "./CustomerEditModal";

interface CustomerBioCardProps {
  customer: OrgCustomer;
  showTitle?: boolean;
  onCustomerUpdate?: (updatedCustomer: OrgCustomer) => void;
}

export function CustomerBioCard({
  customer,
  showTitle = true,
  onCustomerUpdate,
}: CustomerBioCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const fullName = [
    customer.title,
    customer.firstName,
    customer.middleName,
    customer.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleCustomerSave = (updatedCustomer: OrgCustomer) => {
    onCustomerUpdate?.(updatedCustomer);
  };

  return (
    <>
      <Card withBorder>
        {/* Header with title and edit button */}
        <Group justify="space-between" align="center" mb="md">
          {showTitle && <Title order={4}>Personal Information</Title>}
          {!showTitle && <Title order={5}>Bio</Title>}
          <Button
            variant="light"
            size="xs"
            leftSection={<IconEdit size={14} />}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit
          </Button>
        </Group>

        <Stack gap="xs">
          {/* Name */}
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs">
              <IconUser size={14} color="var(--mantine-color-gray-6)" />
              <Text size="xs" c="dimmed">
                Name
              </Text>
            </Group>
            <Text size="sm" fw={500} ta="right">
              {fullName}
            </Text>
          </Group>

          {/* Date of Birth */}
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs">
              <IconCalendar size={14} color="var(--mantine-color-gray-6)" />
              <Text size="xs" c="dimmed">
                Date of Birth
              </Text>
            </Group>
            <Text size="sm" ta="right">
              {customer.dob ? formatDate(customer.dob) : "—"}
            </Text>
          </Group>

          {/* Email */}
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs">
              <IconMail size={14} color="var(--mantine-color-gray-6)" />
              <Text size="xs" c="dimmed">
                Email
              </Text>
            </Group>
            <Text size="sm" ta="right" style={{ wordBreak: "break-word" }}>
              {customer.email || "—"}
            </Text>
          </Group>

          {/* Telephone */}
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs">
              <IconPhone size={14} color="var(--mantine-color-gray-6)" />
              <Text size="xs" c="dimmed">
                Telephone
              </Text>
            </Group>
            <Text size="sm" ta="right">
              {customer.telephone || "—"}
            </Text>
          </Group>

          {/* Occupation */}
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs">
              <IconBriefcase size={14} color="var(--mantine-color-gray-6)" />
              <Text size="xs" c="dimmed">
                Occupation
              </Text>
            </Group>
            <Text size="sm" ta="right">
              {customer.occupation || "—"}
            </Text>
          </Group>

          {/* Employer */}
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs">
              <IconBriefcase size={14} color="var(--mantine-color-gray-6)" />
              <Text size="xs" c="dimmed">
                Employer
              </Text>
            </Group>
            <Text size="sm" ta="right">
              {customer.employer || "—"}
            </Text>
          </Group>

          {/* Active Status */}
          <Group justify="space-between" wrap="nowrap">
            <Text size="xs" c="dimmed">
              Active
            </Text>
            <Badge
              color={customer.active ? "green" : "gray"}
              size="sm"
              variant="light"
            >
              {customer.active ? "Yes" : "No"}
            </Badge>
          </Group>

          {/* Blacklisted Status */}
          <Group justify="space-between" wrap="nowrap">
            <Text size="xs" c="dimmed">
              Blacklisted
            </Text>
            <Badge
              color={customer.blacklisted ? "red" : "green"}
              size="sm"
              variant="light"
            >
              {customer.blacklisted ? "Yes" : "No"}
            </Badge>
          </Group>

          {/* Blacklist Reason */}
          {customer.blacklisted && customer.blacklistReason && (
            <Group justify="space-between" wrap="nowrap" align="flex-start">
              <Text size="xs" c="dimmed">
                Reason
              </Text>
              <Text size="xs" c="red" ta="right" style={{ maxWidth: "60%" }}>
                {customer.blacklistReason}
              </Text>
            </Group>
          )}
        </Stack>
      </Card>

      <CustomerEditModal
        customer={customer}
        opened={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleCustomerSave}
      />
    </>
  );
}
