"use client";

import { Group, Text } from "@mantine/core";
import { OrganizationDropdown } from "@/client/components/organization/OrganizationDropdown";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";

export function TopNavbarLeft() {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { isLoaded: userLoaded } = useUser();
  const isAuthenticated = isSignedIn && isLoaded && userLoaded;

  const currencyDate = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return (
    <Group gap="sm">
      <Text size="lg" fw={700}>
        YAP
      </Text>

      {isAuthenticated && <OrganizationDropdown />}

      <Text size="sm" c="dimmed">
        • {currencyDate}
      </Text>
    </Group>
  );
}
