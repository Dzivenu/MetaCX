"use client";

import { useState } from "react";
import { useRouter } from "@/client/providers/router-provider";
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Badge,
  Table,
  TextInput,
  Card,
  Stack,
  Avatar,
  Loader,
  Alert,
  Menu,
  ActionIcon,
  Modal,
  Select,
  Box,
  Switch,
  ScrollArea,
} from "@mantine/core";
import { DataTable } from "mantine-datatable";
import {
  IconSearch,
  IconUsers,
  IconEye,
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconAlertCircle,
  IconChevronRight,
  IconChevronDown,
} from "@tabler/icons-react";
import { useAuth } from "@/client/hooks/useAuth";
import { useActiveOrganization } from "@/client/hooks/useActiveOrganization";
import { useOrgMembershipsConvex } from "@/client/hooks/useOrgMembershipsConvex";
import { useRepositories } from "@/client/hooks/useRepositoriesConvex";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { notifications } from "@mantine/notifications";

// Using the Convex types from the hook
import { ConvexFullOrganization } from "@/client/hooks/useOrgMembershipsConvex";

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, orgId } = useAuth();
  const { activeOrganization } = useActiveOrganization();
  const [searchTerm, setSearchTerm] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [expandedRecordIds, setExpandedRecordIds] = useState<string[]>([]);
  const [editingUsers, setEditingUsers] = useState<Set<string>>(new Set());
  const [editingData, setEditingData] = useState<{ [key: string]: any }>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());

  // Use Convex hook for organization membership data
  const {
    members,
    membersLoading: loading,
    fullOrganization,
    canManageMembers,
    updateMemberRole,
    removeMember,
    inviteMember,
  } = useOrgMembershipsConvex(
    undefined, // organizationId (Convex id)
    orgId || activeOrganization?.id // Clerk organization id
  );

  const { repositories, toggleUserAccess } = useRepositories();

  // Convex mutations
  const updateMemberDetails = useMutation(
    api.functions.orgMemberships.updateMemberDetails
  );
  const syncOrgMembers = useAction(
    api.actions.organizations.syncOrganizationMembers
  );

  // Check for errors in loading
  const error =
    !loading && !fullOrganization && activeOrganization?.id
      ? "Failed to load organization data"
      : null;

  // Get current user's role in the organization
  const currentUserRole = (members || []).find(
    (member: any) => member.user?.id === currentUser?.id
  )?.role;

  // Filter members based on search term
  const filteredMembers =
    (members || []).filter((member: any) => {
      // Skip members without user data
      if (!member.user) return false;

      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();

      const first = (
        member.firstName ??
        member.user?.firstName ??
        ""
      ).toLowerCase();
      const last = (
        member.lastName ??
        member.user?.lastName ??
        ""
      ).toLowerCase();
      const combined = `${first} ${last}`.trim();
      const displayName = combined || (member.user.name || "").toLowerCase();

      return (
        displayName.includes(searchLower) ||
        (member.user.email || "").toLowerCase().includes(searchLower) ||
        member.role.toLowerCase().includes(searchLower)
      );
    }) || [];

  const handleViewUser = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleInviteMember = async () => {
    if (!inviteEmail || !fullOrganization) return;

    try {
      await inviteMember(
        inviteEmail,
        inviteRole as "member" | "admin" | "owner"
      );

      setInviteModalOpen(false);
      setInviteEmail("");
      setInviteRole("member");
    } catch (err) {
      console.error("❌ Error inviting member:", err);
      alert(err instanceof Error ? err.message : "Failed to invite member");
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    if (!fullOrganization) return;

    try {
      await updateMemberRole(
        memberId as any,
        newRole as "member" | "admin" | "owner"
      );
      setEditingMember(null);
    } catch (err) {
      console.error("❌ Error updating member role:", err);
      alert(
        err instanceof Error ? err.message : "Failed to update member role"
      );
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!fullOrganization) return;

    if (
      !confirm(
        `Are you sure you want to remove ${memberName} from this organization?`
      )
    ) {
      return;
    }

    try {
      await removeMember(memberId as any);
    } catch (err) {
      console.error("❌ Error removing member:", err);
      alert(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "owner":
        return "red";
      case "admin":
        return "yellow";
      case "member":
        return "blue";
      default:
        return "gray";
    }
  };

  const handleEditUser = (member: any) => {
    // Initialize editing data with actual repository access
    const authorizedRepoIds = member.authorizedRepoIds || [];
    const repositoryAccess = repositories.reduce((acc: any, repo: any) => {
      acc[repo.id] = authorizedRepoIds.includes(repo.id);
      return acc;
    }, {});

    setEditingData({
      ...editingData,
      [member.id]: {
        ...member,
        firstName: member.firstName || member.user?.firstName || "",
        lastName: member.lastName || member.user?.lastName || "",
        repositoryAccess,
      },
    });
    setEditingUsers(new Set([...editingUsers, member.id]));
  };

  const handleCancelEdit = (memberId: string) => {
    const newEditingData = { ...editingData };
    delete newEditingData[memberId];
    setEditingData(newEditingData);

    const newEditingUsers = new Set(editingUsers);
    newEditingUsers.delete(memberId);
    setEditingUsers(newEditingUsers);
  };

  const handleSaveUser = async (memberId: string) => {
    const data = editingData[memberId];
    if (!data) return;

    setSaving(new Set([...saving, memberId]));

    try {
      // Convert repository access object to array of authorized repo IDs
      const authorizedRepoIds = Object.entries(data.repositoryAccess || {})
        .filter(([_, hasAccess]) => hasAccess)
        .map(([repoId, _]) => repoId);

      // Find the member data to get user information
      const memberData = filteredMembers.find((m: any) => m.id === memberId);
      if (!memberData) {
        throw new Error("Cannot find member information");
      }

      // Use Convex membership id only
      const membershipIdentifier: string = memberId;

      // Update member details using Convex mutation
      await updateMemberDetails({
        membershipId: membershipIdentifier,
        organizationId: activeOrganization?.id,
        clerkOrganizationId: orgId || undefined,
        firstName: data.firstName,
        lastName: data.lastName,
        authorizedRepoIds,
      });

      notifications.show({
        title: "Success",
        message: "Member details updated successfully",
        color: "green",
      });

      // Update local UI state without reloading
      setEditingUsers((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
      setEditingData((prev) => {
        const copy = { ...prev };
        delete copy[memberId];
        return copy;
      });
      setExpandedRecordIds((prev) => Array.from(new Set([...prev, memberId])));
    } catch (error) {
      console.error("Failed to save user:", error);
      notifications.show({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to save user changes",
        color: "red",
      });
    } finally {
      const newSaving = new Set(saving);
      newSaving.delete(memberId);
      setSaving(newSaving);
    }
  };

  const updateEditingUserData = (
    memberId: string,
    field: string,
    value: any
  ) => {
    setEditingData({
      ...editingData,
      [memberId]: {
        ...editingData[memberId],
        [field]: value,
      },
    });
  };

  const toggleRepositoryAccess = (
    memberId: string,
    repoId: string,
    hasAccess: boolean
  ) => {
    const currentAccess = editingData[memberId]?.repositoryAccess || {};
    updateEditingUserData(memberId, "repositoryAccess", {
      ...currentAccess,
      [repoId]: hasAccess,
    });
  };

  const renderEditForm = (member: any) => {
    const data = editingData[member.id] || {};
    const isSaving = saving.has(member.id);

    return (
      <Box p="md">
        <Stack gap="md">
          {/* User Details */}
          <Group grow>
            <TextInput
              label="First Name"
              value={data.firstName || ""}
              onChange={(e) =>
                updateEditingUserData(member.id, "firstName", e.target.value)
              }
            />
            <TextInput
              label="Last Name"
              value={data.lastName || ""}
              onChange={(e) =>
                updateEditingUserData(member.id, "lastName", e.target.value)
              }
            />
          </Group>

          <Group grow>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Email Address
              </Text>
              <Text>{member.user?.email || "No email"}</Text>
            </Box>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Full Name (Current)
              </Text>
              <Text>
                {(() => {
                  const first =
                    member.firstName ?? member.user?.firstName ?? "";
                  const last = member.lastName ?? member.user?.lastName ?? "";
                  const combined = `${first} ${last}`.trim();
                  return combined || member.user?.name || "Unknown User";
                })()}
              </Text>
            </Box>
          </Group>

          <Group grow>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                User ID
              </Text>
              <Text size="sm" ff="monospace" c="dimmed">
                {member.user?.id || member.userId}
              </Text>
            </Box>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Member ID
              </Text>
              <Text size="sm" ff="monospace" c="dimmed">
                {member.id}
              </Text>
            </Box>
          </Group>

          {/* Repository Access */}
          {repositories.length > 0 && (
            <Card withBorder p="md" radius="md">
              <Stack gap="md">
                <Text size="sm" fw={600}>
                  Repository Access
                  <Text size="xs" c="dimmed" span>
                    {" "}
                    (Toggle access for each repository)
                  </Text>
                </Text>

                <ScrollArea h={200} type="auto">
                  <Stack gap="sm">
                    {repositories.map((repo) => {
                      const hasAccess =
                        data.repositoryAccess?.[repo.id] || false;
                      return (
                        <Card key={repo.id} p="xs" withBorder>
                          <Group justify="space-between" align="center">
                            <Stack gap={0}>
                              <Text size="sm" fw={500}>
                                {repo.name}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {repo.typeOf || "Repository"}
                              </Text>
                            </Stack>
                            <Switch
                              size="sm"
                              checked={hasAccess}
                              onChange={(e) =>
                                toggleRepositoryAccess(
                                  member.id,
                                  repo.id,
                                  e.target.checked
                                )
                              }
                              label={hasAccess ? "Access Granted" : "No Access"}
                            />
                          </Group>
                        </Card>
                      );
                    })}
                  </Stack>
                </ScrollArea>
              </Stack>
            </Card>
          )}

          {/* Save/Cancel Actions */}
          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => handleCancelEdit(member.id)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSaveUser(member.id)}
              loading={isSaving}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Box>
    );
  };

  const renderDisplayView = (member: any) => {
    return (
      <Box p="md">
        <Stack gap="md">
          {/* User Details */}
          <Group grow>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Full Name
              </Text>
              <Text>
                {member.firstName && member.lastName
                  ? `${member.firstName} ${member.lastName}`
                  : member.user?.name || "Unknown User"}
              </Text>
            </Box>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Email Address
              </Text>
              <Text>{member.user?.email || "No email"}</Text>
            </Box>
          </Group>

          <Group grow>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                First Name
              </Text>
              <Text>{member.firstName || "Not set"}</Text>
            </Box>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Last Name
              </Text>
              <Text>{member.lastName || "Not set"}</Text>
            </Box>
          </Group>

          <Group grow>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                User ID
              </Text>
              <Text size="sm" ff="monospace" c="dimmed">
                {member.user?.id || member.userId}
              </Text>
            </Box>
            <Box>
              <Text size="sm" fw={500} c="dimmed">
                Member ID
              </Text>
              <Text size="sm" ff="monospace" c="dimmed">
                {member.id}
              </Text>
            </Box>
          </Group>

          {/* Repository Access */}
          {(() => {
            const authorizedRepoIds = member.authorizedRepoIds || [];
            const authorizedRepos = repositories.filter((repo) =>
              authorizedRepoIds.includes(repo.id)
            );

            return authorizedRepos.length > 0 ? (
              <Box>
                <Text size="sm" fw={500} c="dimmed" mb="xs">
                  Repository Access ({authorizedRepos.length} of{" "}
                  {repositories.length})
                </Text>
                <Group gap={6} wrap="wrap">
                  {authorizedRepos.map((repo) => (
                    <Badge
                      key={`${member.id}-${repo.id}`}
                      size="sm"
                      variant="filled"
                      color="blue"
                    >
                      {repo.name}
                    </Badge>
                  ))}
                </Group>
              </Box>
            ) : (
              <Box>
                <Text size="sm" fw={500} c="dimmed" mb="xs">
                  Repository Access
                </Text>
                <Text size="sm" c="dimmed">
                  No repositories authorized
                </Text>
              </Box>
            );
          })()}

          {/* Actions */}
          <Group justify="space-between" mt="md">
            <Button
              size="sm"
              variant="light"
              leftSection={<IconEdit size={16} />}
              onClick={() => handleEditUser(member)}
            >
              Edit User
            </Button>
            {canManageMembers && (
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button variant="light" color="gray" size="sm">
                    More Actions
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconEdit size={14} />}
                    onClick={() => setEditingMember(member)}
                  >
                    Change Role
                  </Menu.Item>
                  {member.role !== "owner" && (
                    <Menu.Item
                      leftSection={<IconTrash size={14} />}
                      color="red"
                      onClick={() =>
                        handleRemoveMember(
                          member.id,
                          member.user?.name || "Unknown User"
                        )
                      }
                    >
                      Remove Member
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Stack>
      </Box>
    );
  };

  const renderExpandedContent = (member: any) => {
    const isEditing = editingUsers.has(member.id);
    return isEditing ? renderEditForm(member) : renderDisplayView(member);
  };

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Loading organization members...</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error loading organization"
          color="red"
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (!activeOrganization) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="No Active Organization"
          color="yellow"
        >
          Please select an organization first to manage its members.
        </Alert>
      </Container>
    );
  }

  const pendingInvitations =
    fullOrganization?.invitations?.filter(
      (inv: any) => inv.status === "pending" && inv.email
    ) || [];

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={1}>Members Management</Title>
            <Text c="dimmed">
              Manage members for{" "}
              {fullOrganization?.name || activeOrganization.name}
            </Text>
          </div>
          <Group>
            <Button
              variant="outline"
              color="gray"
              onClick={async () => {
                if (!orgId && !activeOrganization?.id && !fullOrganization?.id)
                  return;
                try {
                  const res = await syncOrgMembers(
                    fullOrganization?.id
                      ? { organizationId: fullOrganization.id as any }
                      : {
                          clerkOrganizationId: (orgId ||
                            activeOrganization?.id) as string,
                        }
                  );
                  notifications.show({
                    title: "Sync complete",
                    message: `Synced ${res?.synced ?? 0} members from Clerk`,
                    color: "green",
                  });
                  window.location.reload();
                } catch (e: any) {
                  notifications.show({
                    title: "Sync failed",
                    message: e?.message || "Failed to sync from Clerk",
                    color: "red",
                  });
                }
              }}
            >
              Sync from Clerk
            </Button>
            {canManageMembers && (
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setInviteModalOpen(true)}
              >
                Invite Member
              </Button>
            )}
            <Badge variant="light" size="lg">
              {filteredMembers.length} Members
            </Badge>
          </Group>
        </Group>

        <Card withBorder>
          <Stack gap="md">
            <TextInput
              placeholder="Search members by name, email, or role..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
            />

            <DataTable
              withTableBorder
              borderRadius="sm"
              withColumnBorders
              striped
              highlightOnHover
              records={filteredMembers}
              idAccessor="id"
              columns={[
                {
                  accessor: "expand",
                  title: "",
                  width: 40,
                  textAlign: "center",
                  render: (member) => {
                    const isExpanded = expandedRecordIds.includes(member.id);
                    return (
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isExpanded) {
                            setExpandedRecordIds((prev) =>
                              prev.filter((id) => id !== member.id)
                            );
                          } else {
                            setExpandedRecordIds((prev) => [
                              ...prev,
                              member.id,
                            ]);
                          }
                        }}
                      >
                        {isExpanded ? (
                          <IconChevronDown size={16} />
                        ) : (
                          <IconChevronRight size={16} />
                        )}
                      </ActionIcon>
                    );
                  },
                },
                {
                  accessor: "member",
                  title: "Member",
                  render: (member: any) => {
                    const first =
                      member.firstName ?? member.user?.firstName ?? "";
                    const last = member.lastName ?? member.user?.lastName ?? "";
                    const combined = `${first} ${last}`.trim();
                    const displayName =
                      combined || member.user?.name || "Unknown User";
                    const initial =
                      displayName?.charAt(0)?.toUpperCase() || "?";
                    return (
                      <Group gap="sm">
                        <Avatar size={40} radius="xl" color="blue">
                          {initial}
                        </Avatar>
                        <div>
                          <Text fw={500}>{displayName}</Text>
                          <Text size="sm" c="dimmed">
                            {member.user?.email || "No email"}
                          </Text>
                        </div>
                      </Group>
                    );
                  },
                },
                {
                  accessor: "role",
                  title: "Role",
                  render: (member) => {
                    if (editingMember?.id === member.id) {
                      return (
                        <Group gap="xs">
                          <Select
                            data={[
                              { value: "member", label: "Member" },
                              { value: "admin", label: "Admin" },
                              { value: "owner", label: "Owner" },
                            ]}
                            value={member.role}
                            onChange={(value) => {
                              if (value) {
                                handleUpdateMemberRole(member.id, value);
                              }
                            }}
                            size="xs"
                          />
                          <Button
                            size="xs"
                            variant="subtle"
                            onClick={() => setEditingMember(null)}
                          >
                            Cancel
                          </Button>
                        </Group>
                      );
                    }
                    return (
                      <Badge
                        size="sm"
                        color={getRoleBadgeColor(member.role)}
                        variant="filled"
                      >
                        {member.role.toUpperCase()}
                      </Badge>
                    );
                  },
                },
                {
                  accessor: "joinedAt",
                  title: "Joined",
                  render: (member) => (
                    <Text size="sm" c="dimmed">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </Text>
                  ),
                },
              ]}
              rowExpansion={{
                allowMultiple: false,
                trigger: "never", // Disable automatic expansion on row click
                expanded: {
                  recordIds: expandedRecordIds,
                  onRecordIdsChange: setExpandedRecordIds,
                },
                content: ({ record }) => renderExpandedContent(record),
              }}
              emptyState={
                <Stack align="center" gap="md" py="xl">
                  <IconUsers size={48} color="gray" />
                  <Text ta="center" c="dimmed">
                    {searchTerm
                      ? "No members found matching your search"
                      : "No members found"}
                  </Text>
                </Stack>
              }
            />
          </Stack>
        </Card>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <Card withBorder>
            <Stack gap="md">
              <Title order={3}>
                Pending Invitations ({pendingInvitations.length})
              </Title>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th>Invited By</Table.Th>
                    <Table.Th>Expires</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pendingInvitations.map((invitation: any) => (
                    <Table.Tr key={invitation.id}>
                      <Table.Td>
                        <Text fw={500}>{invitation.email}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          color={getRoleBadgeColor(invitation.role)}
                          variant="light"
                        >
                          {invitation.role.toUpperCase()}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {invitation.inviter?.user?.name || "Unknown"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          </Card>
        )}
      </Stack>

      {/* Invite Member Modal */}
      <Modal
        opened={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite New Member"
      >
        <Stack gap="md">
          <TextInput
            label="Email Address"
            placeholder="Enter email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.currentTarget.value)}
          />
          <Select
            label="Role"
            data={[
              { value: "member", label: "Member" },
              { value: "admin", label: "Admin" },
              { value: "owner", label: "Owner" },
            ]}
            value={inviteRole}
            onChange={(value) => value && setInviteRole(value)}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={!inviteEmail}>
              Send Invitation
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
