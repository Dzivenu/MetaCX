"use client";

import {
  Container,
  Title,
  Text,
  Grid,
  Card,
  Group,
  Button,
  Stack,
  Badge,
  Box,
} from "@mantine/core";
import {
  IconUsers,
  IconBuilding,
  IconPlus,
  IconSettings,
  IconChevronRight,
} from "@tabler/icons-react";
import { useAuth } from "@/client/hooks/useAuth";
import Link from "next/link";

export default function DashboardPage() {
  const { user, activeOrganization, organizationList } = useAuth();

  return (
    <Box style={{ minHeight: "100vh" }}>
      <Container size="xl" py="xl">
        <Stack gap="xl">
          {/* Welcome Section */}
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs">
                <Title order={1}>
                  Welcome back, {user?.firstName || user?.name || "User"}!
                </Title>
                {activeOrganization ? (
                  <Text c="dimmed">
                    You're currently working in{" "}
                    <strong>{activeOrganization.name}</strong>
                  </Text>
                ) : (
                  <Text c="dimmed">
                    Get started by creating or joining an organization
                  </Text>
                )}
              </Stack>

              {!activeOrganization && (
                <Button
                  component={Link}
                  href="/organizations/create"
                  leftSection={<IconPlus size={16} />}
                >
                  Create Organization
                </Button>
              )}
            </Group>
          </Stack>

          {/* Quick Actions */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Card withBorder shadow="sm" radius="md" p="lg" h="100%">
                <Stack justify="space-between" h="100%">
                  <Stack gap="md">
                    <Group>
                      <IconBuilding
                        size={32}
                        color="var(--mantine-color-blue-6)"
                      />
                      <Stack gap={0}>
                        <Text fw={500} size="lg">
                          Organizations
                        </Text>
                        <Text size="sm" c="dimmed">
                          {organizationList?.length || 0} organizations
                        </Text>
                      </Stack>
                    </Group>
                    <Text size="sm" c="dimmed">
                      Manage your organizations, invite members, and switch
                      between workspaces.
                    </Text>
                  </Stack>
                  <Button
                    component={Link}
                    href="/organizations"
                    variant="light"
                    fullWidth
                    rightSection={<IconChevronRight size={16} />}
                  >
                    View All
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Card withBorder shadow="sm" radius="md" p="lg" h="100%">
                <Stack justify="space-between" h="100%">
                  <Stack gap="md">
                    <Group>
                      <IconUsers
                        size={32}
                        color="var(--mantine-color-green-6)"
                      />
                      <Stack gap={0}>
                        <Text fw={500} size="lg">
                          Team
                        </Text>
                        <Text size="sm" c="dimmed">
                          {activeOrganization?.membersCount || 0} members
                        </Text>
                      </Stack>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {activeOrganization
                        ? "Manage team members, roles, and permissions."
                        : "Join an organization to collaborate with team members."}
                    </Text>
                  </Stack>
                  <Button
                    component={Link}
                    href={
                      activeOrganization
                        ? "/organizations/profile"
                        : "/organizations"
                    }
                    variant="light"
                    fullWidth
                    rightSection={<IconChevronRight size={16} />}
                  >
                    {activeOrganization ? "Manage Team" : "Join Organization"}
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Card withBorder shadow="sm" radius="md" p="lg" h="100%">
                <Stack justify="space-between" h="100%">
                  <Stack gap="md">
                    <Group>
                      <IconSettings
                        size={32}
                        color="var(--mantine-color-orange-6)"
                      />
                      <Stack gap={0}>
                        <Text fw={500} size="lg">
                          Settings
                        </Text>
                        <Text size="sm" c="dimmed">
                          Account & preferences
                        </Text>
                      </Stack>
                    </Group>
                    <Text size="sm" c="dimmed">
                      Manage your account settings, profile information, and
                      preferences.
                    </Text>
                  </Stack>
                  <Button
                    component={Link}
                    href="/settings"
                    variant="light"
                    fullWidth
                    rightSection={<IconChevronRight size={16} />}
                  >
                    View Settings
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Organization Status */}
          {activeOrganization && (
            <Card withBorder shadow="sm" radius="md" p="lg">
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={3}>Current Organization</Title>
                  <Badge color="blue" variant="light">
                    {user?.activeOrganization?.role || "Member"}
                  </Badge>
                </Group>

                <Group gap="lg">
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">
                      Organization
                    </Text>
                    <Text fw={500}>{activeOrganization.name}</Text>
                  </Stack>

                  {activeOrganization.slug && (
                    <Stack gap="xs">
                      <Text size="sm" c="dimmed">
                        Slug
                      </Text>
                      <Text fw={500}>{activeOrganization.slug}</Text>
                    </Stack>
                  )}

                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">
                      Members
                    </Text>
                    <Text fw={500}>{activeOrganization.membersCount}</Text>
                  </Stack>
                </Group>

                <Group>
                  <Button
                    component={Link}
                    href="/organizations/profile"
                    variant="light"
                    leftSection={<IconSettings size={16} />}
                  >
                    Organization Settings
                  </Button>
                  <Button
                    component={Link}
                    href="/organizations"
                    variant="outline"
                  >
                    Switch Organization
                  </Button>
                </Group>
              </Stack>
            </Card>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
