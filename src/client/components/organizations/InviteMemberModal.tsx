"use client";

import { useState } from "react";
import { useOrgMembershipsConvex } from "@/client/hooks/useOrgMembershipsConvex";
import { useActiveOrganization } from "@/client/hooks/useActiveOrganization";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Modal,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

interface InviteMemberModalProps {
  organizationId: string;
  opened: boolean;
  onClose: () => void;
}

export function InviteMemberModal({
  organizationId,
  opened,
  onClose,
}: InviteMemberModalProps) {
  const { activeOrganization } = useActiveOrganization();
  const { inviteMember, membersLoading } = useOrgMembershipsConvex(
    organizationId as Id<"organizations">,
    activeOrganization?.id
  );
  const [formData, setFormData] = useState({
    email: "",
    role: "member",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await inviteMember(
        formData.email.trim(),
        formData.role as "member" | "admin" | "owner"
      );
      notifications.show({
        title: "Success",
        message: "Invitation sent successfully",
        color: "green",
      });
      onClose();
    } catch (err) {
      notifications.show({
        title: "Error",
        message:
          err instanceof Error ? err.message : "Failed to send invitation",
        color: "red",
      });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Invite Member" size="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Email Address"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            error={errors.email}
            required
          />

          <Select
            label="Role"
            value={formData.role}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, role: value || "member" }))
            }
            data={[
              { value: "member", label: "Member" },
              { value: "admin", label: "Admin" },
              { value: "owner", label: "Owner" },
            ]}
            error={errors.role}
            required
          />

          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Role Permissions:
            </Text>
            <Text size="xs" c="dimmed">
              • <strong>Member:</strong> Basic access to organization resources
            </Text>
            <Text size="xs" c="dimmed">
              • <strong>Admin:</strong> Can manage members and organization
              settings
            </Text>
            <Text size="xs" c="dimmed">
              • <strong>Owner:</strong> Full control including organization
              deletion
            </Text>
          </Stack>

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={membersLoading}>
              Send Invitation
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
