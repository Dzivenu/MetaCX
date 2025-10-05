"use client";

import {
  Container,
  Title,
  Button,
  Group,
  Card,
  Text,
  Stack,
  Badge,
  ActionIcon,
  Menu,
  rem,
  Tabs,
  Avatar,
  Table,
  Loader,
  Center,
  Alert,
} from "@mantine/core";
import {
  IconPlus,
  IconDots,
  IconTrash,
  IconUsers,
  IconSettings,
  IconMail,
  IconCrown,
  IconShield,
  IconArrowLeft,
} from "@tabler/icons-react";
import { useAuth } from "@/client/hooks/useAuth";
import { useOrganizationList } from "@clerk/nextjs";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { InviteMemberModal } from "@/client/components/organizations/InviteMemberModal";
import { notifications } from "@mantine/notifications";

export default function OrganizationPage() {
  const { user } = useAuth();
  const getOrganizationBySlug = useAction(
    api.actions.organizations.getOrganizationBySlug
  );
  const getOrganizationMemberships = useAction(
    api.actions.organizations.getOrganizationMemberships
  );
  const { setActive, isLoaded } = useOrganizationList();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  useEffect(() => {
    async function loadOrganization() {
      if (!slug) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch organization by slug from Clerk
        const orgData = await getOrganizationBySlug({ slug });
        console.log("Organization loaded:", orgData);
        setOrganization(orgData);

        // Fetch organization memberships
        const membershipData = await getOrganizationMemberships({
          organizationId: orgData.id,
        });
        console.log("Memberships loaded:", membershipData);
        setMembers(membershipData);
      } catch (error) {
        console.error("Failed to load organization:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load organization"
        );
        notifications.show({
          title: "Error",
          message: "Failed to load organization details",
          color: "red",
        });
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
  }, [slug, getOrganizationBySlug, getOrganizationMemberships]);

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Center h={200}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert color="red" variant="light">
          <Text fw={500}>Error loading organization</Text>
          <Text size="sm">{error}</Text>
        </Alert>
      </Container>
    );
  }

  if (!organization) {
    return (
      <Container size="lg" py="xl">
        <Alert color="yellow" variant="light">
          <Text fw={500}>Organization not found</Text>
          <Text size="sm">
            The organization you're looking for doesn't exist or you don't have
            access to it.
          </Text>
        </Alert>
      </Container>
    );
  }

  const userMembership = members.find(
    (member: any) => member.userId === user?.id
  );
  const userRole = userMembership?.role || "org:member";
  const canManageMembers =
    userRole === "org:admin" || userRole.includes("admin");
  const isOwner = userRole === "org:admin";

  const getRoleIcon = (role: string) => {
    if (role === "org:admin" || role.includes("admin")) {
      return <IconCrown size={16} color="gold" />;
    }
    return <IconUsers size={16} />;
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === "org:admin" || role.includes("admin")) {
      return "red";
    }
    return "blue";
  };

  const formatRole = (role: string) => {
    if (role === "org:admin" || role.includes("admin")) {
      return "Admin";
    }
    return "Member";
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove ${memberName} from this organization?`
      )
    ) {
      return;
    }

    notifications.show({
      title: "Feature Coming Soon",
      message: "Member management will be implemented in the next update",
      color: "yellow",
    });
  };

  const handleUpdateRole = async (
    memberId: string,
    newRole: string,
    memberName: string
  ) => {
    notifications.show({
      title: "Feature Coming Soon",
      message: "Role management will be implemented in the next update",
      color: "yellow",
    });
  };

  console.log("DEBUG members:", members);
  const pendingInvitations: any[] = []; // TODO: Implement invitations fetching from Clerk API

  return (
    <Container size="lg" py="xl">
      <Group mb="lg">
        <Button
          variant="subtle"
          size="sm"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          Back
        </Button>
      </Group>

      <Group justify="space-between" mb="xl">
        <div>
          <Group gap="sm" mb="xs">
            <Title order={1}>{organization.name}</Title>
            <Badge
              variant="light"
              size="lg"
              color={getRoleBadgeColor(userRole)}
            >
              {formatRole(userRole)}
            </Badge>
          </Group>
          <Text c="dimmed">@{organization.slug}</Text>
        </div>
        <Group>
          <Button
            variant="filled"
            onClick={async () => {
              if (!isLoaded) return;
              try {
                setActionLoading(true);
                await setActive({ organization: organization.id });
                router.refresh();
              } catch (e) {
                console.error("Failed to set active org", e);
                notifications.show({
                  title: "Error",
                  message: "Failed to set active organization",
                  color: "red",
                });
              } finally {
                setActionLoading(false);
              }
            }}
          >
            Set Active
          </Button>
          {canManageMembers && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setInviteModalOpen(true)}
            >
              Invite Member
            </Button>
          )}
        </Group>
      </Group>

      <Tabs defaultValue="members">
        <Tabs.List>
          <Tabs.Tab value="about" leftSection={<IconUsers size={16} />}>
            About
          </Tabs.Tab>
          <Tabs.Tab value="members" leftSection={<IconUsers size={16} />}>
            Members ({members.length})
          </Tabs.Tab>
          <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
            Settings
          </Tabs.Tab>
          {canManageMembers && pendingInvitations.length > 0 && (
            <Tabs.Tab value="invitations" leftSection={<IconMail size={16} />}>
              Pending Invitations ({pendingInvitations.length})
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="about" pt="lg">
          <Card withBorder>
            <Group justify="space-between" mb="lg">
              <div>
                <Title order={2} mb="xs">
                  {organization.name}
                </Title>
                <Text c="dimmed" size="sm">
                  @{organization.slug}
                </Text>
              </div>
              {organization.imageUrl && (
                <Avatar src={organization.imageUrl} size="xl" radius="md" />
              )}
            </Group>

            <Stack gap="md">
              <div>
                <Text size="sm" fw={500} mb="xs">
                  Description
                </Text>
                <Text size="sm" c="dimmed">
                  {organization.publicMetadata?.description ||
                    "No description provided."}
                </Text>
              </div>

              <Group grow>
                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Created
                  </Text>
                  <Text size="sm" c="dimmed">
                    {new Date(organization.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </Text>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Members
                  </Text>
                  <Text size="sm" c="dimmed">
                    {members.length}{" "}
                    {members.length === 1 ? "member" : "members"}
                  </Text>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Your Role
                  </Text>
                  <Badge
                    variant="light"
                    color={getRoleBadgeColor(userRole)}
                    size="sm"
                  >
                    {formatRole(userRole)}
                  </Badge>
                </div>
              </Group>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="members" pt="lg">
          <Card withBorder>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Member</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Joined</Table.Th>
                  {canManageMembers && <Table.Th>Actions</Table.Th>}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {members.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={canManageMembers ? 4 : 3}>
                      <Text c="dimmed">No members found.</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  members.map((member: any) => (
                    <Table.Tr key={member.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size="sm" radius="xl">
                            {member.user?.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <div>
                            <Text size="sm" fw={500}>
                              {member.user?.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {member.user?.email}
                            </Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {getRoleIcon(member.role)}
                          <Badge
                            variant="light"
                            color={getRoleBadgeColor(member.role)}
                            size="sm"
                          >
                            {formatRole(member.role)}
                          </Badge>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      {canManageMembers && (
                        <Table.Td>
                          {member.userId !== user?.id &&
                            !member.role.includes("admin") && (
                              <Menu shadow="md" width={200}>
                                <Menu.Target>
                                  <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    disabled={actionLoading}
                                  >
                                    <IconDots size={16} />
                                  </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                  {isOwner &&
                                    !member.role.includes("admin") && (
                                      <Menu.Item
                                        leftSection={
                                          <IconShield
                                            style={{
                                              width: rem(14),
                                              height: rem(14),
                                            }}
                                          />
                                        }
                                        onClick={() =>
                                          handleUpdateRole(
                                            member.userId,
                                            "org:admin",
                                            member.user?.name
                                          )
                                        }
                                      >
                                        Make Admin
                                      </Menu.Item>
                                    )}
                                  {isOwner && member.role.includes("admin") && (
                                    <Menu.Item
                                      leftSection={
                                        <IconUsers
                                          style={{
                                            width: rem(14),
                                            height: rem(14),
                                          }}
                                        />
                                      }
                                      onClick={() =>
                                        handleUpdateRole(
                                          member.userId,
                                          "org:member",
                                          member.user?.name
                                        )
                                      }
                                    >
                                      Make Member
                                    </Menu.Item>
                                  )}
                                  <Menu.Item
                                    leftSection={
                                      <IconTrash
                                        style={{
                                          width: rem(14),
                                          height: rem(14),
                                        }}
                                      />
                                    }
                                    color="red"
                                    onClick={() =>
                                      handleRemoveMember(
                                        member.userId,
                                        member.user?.name
                                      )
                                    }
                                  >
                                    Remove Member
                                  </Menu.Item>
                                </Menu.Dropdown>
                              </Menu>
                            )}
                        </Table.Td>
                      )}
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="settings" pt="lg">
          <Card withBorder>
            <Text size="lg" fw={500} mb="sm">
              Organization Settings
            </Text>
            <Text c="dimmed" mb="lg">
              Manage your organization's settings here.
            </Text>
            {/* Add settings UI and logic here */}
          </Card>
        </Tabs.Panel>

        {canManageMembers && pendingInvitations.length > 0 && (
          <Tabs.Panel value="invitations" pt="lg">
            <Card withBorder>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th>Invited</Table.Th>
                    <Table.Th>Expires</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pendingInvitations.map((invitation: any) => (
                    <Table.Tr key={invitation.id}>
                      <Table.Td>
                        <Text size="sm">{invitation.email}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          variant="light"
                          color={getRoleBadgeColor(invitation.role)}
                          size="sm"
                        >
                          {formatRole(invitation.role)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {new Date(invitation.createdAt).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon variant="subtle" color="red" size="sm">
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          </Tabs.Panel>
        )}
      </Tabs>

      <InviteMemberModal
        opened={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        organizationId={organization.id}
      />
    </Container>
  );
}
