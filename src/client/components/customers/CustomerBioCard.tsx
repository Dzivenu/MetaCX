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

        <Stack gap="md">
          {/* Name */}
          <Group gap="sm">
            <IconUser size={20} color="var(--mantine-color-gray-6)" />
            <div>
              <Text fw={500} size="sm">
                {fullName}
              </Text>
              <Text size="xs" c="dimmed">
                Customer ID: {customer.id}
              </Text>
            </div>
          </Group>

          {/* Contact Information */}
          {(customer.email || customer.telephone) && (
            <Stack gap="xs">
              {customer.email && (
                <Group gap="sm">
                  <IconMail size={16} color="var(--mantine-color-gray-6)" />
                  <Text size="sm">{customer.email}</Text>
                </Group>
              )}
              {customer.telephone && (
                <Group gap="sm">
                  <IconPhone size={16} color="var(--mantine-color-gray-6)" />
                  <Text size="sm">{customer.telephone}</Text>
                </Group>
              )}
            </Stack>
          )}

          {/* Date of Birth */}
          {customer.dob && (
            <Group gap="sm">
              <IconCalendar size={16} color="var(--mantine-color-gray-6)" />
              <div>
                <Text size="sm">Date of Birth</Text>
                <Text size="xs" c="dimmed">
                  {formatDate(customer.dob)}
                </Text>
              </div>
            </Group>
          )}

          {/* Occupation & Employer */}
          {(customer.occupation || customer.employer) && (
            <Group gap="sm">
              <IconBriefcase size={16} color="var(--mantine-color-gray-6)" />
              <div>
                {customer.occupation && (
                  <Text size="sm">{customer.occupation}</Text>
                )}
                {customer.employer && (
                  <Text size="xs" c="dimmed">
                    at {customer.employer}
                  </Text>
                )}
              </div>
            </Group>
          )}

          {/* Status */}
          <Group gap="sm">
            <Badge
              color={customer.blacklisted ? "red" : "green"}
              size="sm"
              variant="light"
            >
              {customer.blacklisted ? "Blacklisted" : "Active"}
            </Badge>
            {customer.blacklisted && customer.blacklistReason && (
              <Text size="xs" c="red">
                {customer.blacklistReason}
              </Text>
            )}
          </Group>
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
