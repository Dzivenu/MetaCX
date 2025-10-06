"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "@/client/providers/router-provider";
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Badge,
  Card,
  Avatar,
  Switch,
  Alert,
  Loader,
  Grid,
  Stack,
  SimpleGrid,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconAlertCircle,
  IconUser,
  IconDatabase,
} from "@tabler/icons-react";
import { useUsersConvex, ConvexUser } from "@/client/hooks/useUsersConvex";
import { useRepositories } from "@/client/hooks/useRepositoriesConvex";
import { useActiveUserOfActiveOrg } from "@/client/hooks/useActiveUserOfActiveOrg";

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const { activeUser: currentUser, activeUserIsActiveOrgAdminOrOwner } =
    useActiveUserOfActiveOrg();
  const { fetchUser, updateUser, archiveUser } = useUsersConvex();
  const { repositories, loading: repositoriesLoading } = useRepositories();

  const [user, setUser] = useState<ConvexUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const isOwnAccount = useMemo(() => {
    return currentUser?.id === userId;
  }, [currentUser, userId]);

  const isAdmin = activeUserIsActiveOrgAdminOrOwner;

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    setLoading(true);
    setError(null);

    try {
      const userData = await fetchUser(userId);
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveUser = async () => {
    if (!user || !isAdmin || isOwnAccount) return;

    const confirmed = confirm(
      "Are you sure you want to archive this user account? Their current login will be invalidated."
    );

    if (!confirmed) return;

    try {
      setIsUpdating(true);
      await archiveUser(user.id);
      await loadUser(); // Refresh user data
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to archive user");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user || !isAdmin || isOwnAccount) return;

    try {
      setIsUpdating(true);
      await updateUser(user.id, { active: !user.active });
      await loadUser(); // Refresh user data
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRepositoryToggle = async (repoId: string, isChecked: boolean) => {
    if (!user || !isAdmin) return;

    try {
      setIsUpdating(true);

      if (isChecked) {
        // Add user to repository
        await fetch(`/api/repositories/${repoId}/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ userId: user.id }),
        });
      } else {
        // Remove user from repository
        await fetch(`/api/repositories/${repoId}/users?userId=${user.id}`, {
          method: "DELETE",
          credentials: "include",
        });
      }

      await loadUser(); // Refresh user data
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to update repository access"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (isActive: boolean | undefined) => {
    const active = isActive ?? false;
    return (
      <Badge color={active ? "green" : "red"} variant="light">
        {active ? "Active" : "Inactive"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Group justify="center">
          <Loader size="md" />
        </Group>
      </Container>
    );
  }

  if (error || !user) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
          {error || "User not found"}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Group gap="md" mb="xs">
            <Title order={1}>User #{user.id.slice(0, 8)}...</Title>
            <Group gap="xs">
              {getStatusBadge(user.active)}
              {isOwnAccount && (
                <Badge color="yellow" variant="light">
                  Own Account
                </Badge>
              )}
            </Group>
          </Group>
        </div>

        <Group>
          <Button
            variant="light"
            leftSection={<IconArrowLeft size="1rem" />}
            onClick={() => router.push("/admin/users")}
          >
            Back to Users
          </Button>

          {isAdmin && (
            <Button
              leftSection={<IconEdit size="1rem" />}
              onClick={() => router.push(`/admin/users/${user.id}/edit`)}
              disabled={isUpdating}
            >
              Edit
            </Button>
          )}

          {isAdmin && !isOwnAccount && (
            <Button
              color="red"
              leftSection={<IconTrash size="1rem" />}
              onClick={handleArchiveUser}
              disabled={isUpdating}
              loading={isUpdating}
            >
              Archive
            </Button>
          )}
        </Group>
      </Group>

      {/* User archived notice */}
      {!user.active && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="User Archived"
          color="yellow"
          mb="xl"
        >
          User's login is no longer valid. Set a new password for the user to
          re-activate their account.
        </Alert>
      )}

      {/* User Details */}
      <Grid mb="xl">
        {/* Profile Card */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder>
            <Stack align="center" gap="md">
              <Avatar size={80} radius="xl" color="blue">
                <IconUser size="2rem" />
              </Avatar>
              <div style={{ textAlign: "center" }}>
                <Text fw={500} size="lg">
                  {user.firstName} {user.lastName}
                </Text>
                <Text c="dimmed" size="sm">
                  {user.email}
                </Text>
              </div>
            </Stack>
          </Card>
        </Grid.Col>

        {/* User Info */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder>
            <Title order={3} mb="md">
              User Information
            </Title>
            <SimpleGrid cols={2} spacing="md">
              <div>
                <Text size="sm" c="dimmed" fw={500}>
                  Created
                </Text>
                <Text>
                  {formatDate(new Date(user.createdAt).toISOString())}
                </Text>
              </div>
              <div>
                <Text size="sm" c="dimmed" fw={500}>
                  Last Sign In
                </Text>
                <Text>
                  {formatDate(
                    user.lastSeenAt
                      ? new Date(user.lastSeenAt).toISOString()
                      : undefined
                  )}
                </Text>
              </div>
              <div>
                <Text size="sm" c="dimmed" fw={500}>
                  Email Verified
                </Text>
                <Badge
                  color={user.emailVerified ? "green" : "red"}
                  variant="light"
                >
                  {user.emailVerified ? "Yes" : "No"}
                </Badge>
              </div>
              {isAdmin && !isOwnAccount && (
                <div>
                  <Text size="sm" c="dimmed" fw={500} mb="xs">
                    Active Status
                  </Text>
                  <Switch
                    checked={user.active}
                    onChange={handleToggleActive}
                    disabled={isUpdating}
                    label={user.active ? "Active" : "Inactive"}
                  />
                </div>
              )}
            </SimpleGrid>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Repository Access */}
      {isAdmin && (
        <Card withBorder>
          <Title order={3} mb="md">
            Repository Access
          </Title>

          {repositoriesLoading ? (
            <Group justify="center">
              <Loader size="sm" />
            </Group>
          ) : repositories.length === 0 ? (
            <Text c="dimmed">No repositories available.</Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {repositories.map((repo) => {
                // TODO: Implement repository access tracking in Convex
                const hasAccess = false;

                return (
                  <Card key={repo.id} withBorder p="md">
                    <Group justify="space-between" align="flex-start">
                      <Group gap="sm">
                        <IconDatabase
                          size={20}
                          color="var(--mantine-color-blue-6)"
                        />
                        <div>
                          <Text fw={500} size="sm">
                            {repo.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {repo.typeOf || "Repository"}
                          </Text>
                          <Group gap="xs" mt="xs">
                            {repo.currencyType && (
                              <Badge size="xs" variant="light" color="blue">
                                {repo.currencyType}
                              </Badge>
                            )}
                            {repo.active === false && (
                              <Badge size="xs" variant="light" color="red">
                                Inactive
                              </Badge>
                            )}
                          </Group>
                        </div>
                      </Group>
                      <Switch
                        checked={hasAccess}
                        onChange={(e) =>
                          handleRepositoryToggle(
                            repo.id,
                            e.currentTarget.checked
                          )
                        }
                        disabled={isUpdating}
                        size="sm"
                      />
                    </Group>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </Card>
      )}
    </Container>
  );
}
