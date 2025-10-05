"use client";

import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useOrganizationList } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Container,
  Stack,
  Title,
  Text,
  Button,
  Group,
  Card,
  Avatar,
  Badge,
  Loader,
  Center,
  Alert,
  SimpleGrid,
  ActionIcon,
  Menu,
} from "@mantine/core";
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconBuildingBank,
} from "@tabler/icons-react";
import Link from "next/link";

export default function OrganizationsPage() {
  const getUserOrganizationsAction = useAction(
    api.actions.organizations.getUserOrganizationsFromClerk
  );
  const { setActive, isLoaded } = useOrganizationList();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyOrgId, setBusyOrgId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const orgs = await getUserOrganizationsAction({});
        setOrganizations(orgs);
      } catch (err) {
        console.error("Failed to fetch organizations:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch organizations"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, [getUserOrganizationsAction]);

  if (isLoading) {
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
          <Text fw={500}>Error loading organizations</Text>
          <Text size="sm">{error}</Text>
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap="sm">
            <Title order={1}>Organizations</Title>
            <Text c="dimmed">
              Manage your organizations and switch between them.
            </Text>
          </Stack>

          <Button
            component={Link}
            href="/organizations/create"
            leftSection={<IconPlus size={16} />}
          >
            Create Organization
          </Button>
        </Group>

        {organizations.length === 0 ? (
          <Card withBorder p="xl" radius="md">
            <Stack align="center" gap="lg">
              <IconBuildingBank size={64} color="var(--mantine-color-gray-4)" />
              <Stack align="center" gap="sm">
                <Title order={3} c="dimmed">
                  No organizations yet
                </Title>
                <Text c="dimmed" ta="center">
                  Create your first organization to get started with team
                  collaboration
                </Text>
              </Stack>
              <Button
                component={Link}
                href="/organizations/create"
                leftSection={<IconPlus size={16} />}
              >
                Create Your First Organization
              </Button>
            </Stack>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {organizations.map((org) => (
              <Card
                key={org.id}
                withBorder
                radius="md"
                p="md"
                className="hover:shadow-md transition-shadow"
              >
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <Group gap="sm">
                      <Avatar
                        src={org.imageUrl}
                        alt={org.name}
                        size="md"
                        color="blue"
                      >
                        {org.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Stack gap={2}>
                        <Text fw={600} lineClamp={1}>
                          {org.name}
                        </Text>
                        <Text size="sm" c="dimmed">
                          /{org.slug}
                        </Text>
                      </Stack>
                    </Group>
                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEdit size={16} />}
                          component={Link}
                          href={`/organizations/${org.slug}`}
                        >
                          View & Edit
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          leftSection={<IconTrash size={16} />}
                          color="red"
                          onClick={() => {
                            // Handle delete - you may want to implement this
                            console.log("Delete organization", org.id);
                          }}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>

                  <Stack gap="xs">
                    <Group gap="xs">
                      <Badge
                        size="sm"
                        variant="light"
                        color={org.role === "org:admin" ? "red" : "blue"}
                      >
                        {org.role === "org:admin" ? "Admin" : "Member"}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {org.membersCount} members
                      </Text>
                      <Text size="xs" c="dimmed">
                        Created {new Date(org.createdAt).toLocaleDateString()}
                      </Text>
                    </Group>
                  </Stack>

                  <Group grow>
                    <Button
                      component={Link}
                      href={`/organizations/${org.slug}`}
                      variant="light"
                    >
                      Open
                    </Button>
                    <Button
                      variant="filled"
                      loading={busyOrgId === org.id}
                      onClick={async () => {
                        if (!isLoaded) return;
                        try {
                          setBusyOrgId(org.id);
                          await setActive({ organization: org.id });
                          router.refresh();
                        } catch (e) {
                          console.error("Failed to set active org", e);
                        } finally {
                          setBusyOrgId(null);
                        }
                      }}
                    >
                      Set Active
                    </Button>
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
