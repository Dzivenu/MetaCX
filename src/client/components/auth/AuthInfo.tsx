"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/client/hooks/useAuth";
import { Paper, Stack, Text, Badge, Group, Code, Divider } from "@mantine/core";

export function AuthInfo() {
  const { user: clerkUser, isLoaded } = useUser();
  const { user, isAuthenticated, isLoading } = useAuth();
  const convexUser = useQuery(api.functions.auth.getCurrentUser);
  const authenticatedMessage = useQuery(
    api.functions.auth.getAuthenticatedMessage
  );

  if (!isLoaded || isLoading) {
    return (
      <Paper p="md" withBorder>
        <Text>Loading authentication info...</Text>
      </Paper>
    );
  }

  if (!isAuthenticated) {
    return (
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Group>
            <Text fw={600}>Authentication Status</Text>
            <Badge color="red" variant="light">
              Not Authenticated
            </Badge>
          </Group>
          <Text size="sm" c="dimmed">
            Please sign in to view authentication details.
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Group>
          <Text fw={600} size="lg">
            Authentication Status
          </Text>
          <Badge color="green" variant="light">
            Authenticated
          </Badge>
        </Group>

        <Divider label="Clerk Integration" />
        <Stack gap="xs">
          <Group>
            <Text fw={500}>Clerk User ID:</Text>
            <Code>{clerkUser?.id || "N/A"}</Code>
          </Group>
          <Group>
            <Text fw={500}>Email:</Text>
            <Text size="sm">
              {clerkUser?.emailAddresses[0]?.emailAddress || "N/A"}
            </Text>
          </Group>
          <Group>
            <Text fw={500}>Full Name:</Text>
            <Text size="sm">{clerkUser?.fullName || "N/A"}</Text>
          </Group>
          <Group>
            <Text fw={500}>Email Verified:</Text>
            <Badge
              color={
                clerkUser?.emailAddresses[0]?.verification?.status ===
                "verified"
                  ? "green"
                  : "yellow"
              }
              variant="light"
              size="sm"
            >
              {clerkUser?.emailAddresses[0]?.verification?.status || "Unknown"}
            </Badge>
          </Group>
        </Stack>

        <Divider label="Convex Integration" />
        <Stack gap="xs">
          {convexUser ? (
            <>
              <Group>
                <Text fw={500}>Convex User ID:</Text>
                <Code>{convexUser.id}</Code>
              </Group>
              <Group>
                <Text fw={500}>Synced Name:</Text>
                <Text size="sm">{convexUser.name || "N/A"}</Text>
              </Group>
              <Group>
                <Text fw={500}>Synced Email:</Text>
                <Text size="sm">{convexUser.email || "N/A"}</Text>
              </Group>
              {authenticatedMessage && (
                <Group>
                  <Text fw={500}>Auth Message:</Text>
                  <Text size="sm" c="green">
                    {authenticatedMessage}
                  </Text>
                </Group>
              )}
            </>
          ) : (
            <Group>
              <Text fw={500}>Convex Status:</Text>
              <Badge color="yellow" variant="light">
                Syncing...
              </Badge>
            </Group>
          )}
        </Stack>

        <Divider label="Unified Auth Hook" />
        <Stack gap="xs">
          {user ? (
            <>
              <Group>
                <Text fw={500}>Unified User ID:</Text>
                <Code>{user.id}</Code>
              </Group>
              <Group>
                <Text fw={500}>Name:</Text>
                <Text size="sm">{user.name}</Text>
              </Group>
              <Group>
                <Text fw={500}>Email:</Text>
                <Text size="sm">{user.email}</Text>
              </Group>
              <Group>
                <Text fw={500}>Status:</Text>
                <Badge color="green" variant="light">
                  Ready
                </Badge>
              </Group>
            </>
          ) : (
            <Group>
              <Text fw={500}>Unified Status:</Text>
              <Badge color="yellow" variant="light">
                Setting up...
              </Badge>
            </Group>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
