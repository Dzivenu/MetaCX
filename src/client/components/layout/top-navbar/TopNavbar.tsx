"use client";

import { Group } from "@mantine/core";
import { TopNavbarLeft } from "./TopNavbarLeft";
import { TopNavbarRight } from "./TopNavbarRight";
import { SearchButton } from "@/client/components/search/SearchButton";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";

export function TopNavbar() {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { isLoaded: userLoaded } = useUser();
  const isAuthenticated = isSignedIn && isLoaded && userLoaded;

  return (
    <Group h="100%" px="md" justify="space-between">
      <TopNavbarLeft />

      {/* Search Bar */}
      {isAuthenticated && (
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <SearchButton />
        </div>
      )}

      <TopNavbarRight />
    </Group>
  );
}
