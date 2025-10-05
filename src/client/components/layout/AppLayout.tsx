"use client";

import { AppShell } from "@mantine/core";
import {
  useUser,
  useOrganization,
  useAuth as useClerkAuth,
} from "@clerk/nextjs";
import { NavbarSegmented } from "@/client/components/navigation/NavbarSegmented";
import { SearchSpotlight } from "@/client/components/search/SearchSpotlight";
import { useActiveOrganization } from "@/client/hooks/useActiveOrganization";
import { useAuth } from "@/client/hooks/useAuth";
import { TopNavbar } from "@/client/components/layout/top-navbar/TopNavbar";

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const { logout } = useAuth(); // Keep for backward compatibility
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { activeOrganization } = useActiveOrganization(); // Fallback

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Use Clerk authentication state
  const isAuthenticated = isSignedIn && isLoaded && userLoaded;

  // Always show sidebar for authenticated users, but disable it when no organization is selected
  const shouldShowSidebar = isAuthenticated;
  const isSidebarDisabled = !organization && !activeOrganization;

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={
        shouldShowSidebar
          ? {
              width: 300,
              breakpoint: "sm",
            }
          : undefined
      }
      padding="md"
    >
      <AppShell.Header>
        <TopNavbar />
      </AppShell.Header>

      {shouldShowSidebar && (
        <AppShell.Navbar p={0}>
          <NavbarSegmented disabled={isSidebarDisabled} />
        </AppShell.Navbar>
      )}

      <AppShell.Main>{children}</AppShell.Main>

      {/* Search Spotlight */}
      {isAuthenticated && <SearchSpotlight />}
    </AppShell>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return <AppLayoutContent>{children}</AppLayoutContent>;
}
