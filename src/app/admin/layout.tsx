"use client";

import { useEffect } from "react";
import { useRouter } from "@/client/providers/router-provider";
import { Container, Alert, Loader, Group } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useAuth } from "@/client/hooks/useAuth";
import { useActiveUserOfActiveOrg } from "@/client/hooks/useActiveUserOfActiveOrg";



export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoading } = useAuth();
  const { 
    activeUser: user, 
    activeUserIsActiveOrgAdminOrOwner: hasAdminAccess 
  } = useActiveUserOfActiveOrg();



  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!isLoading && !user) {
      router.push("/");
      return;
    }
  }, [user, isLoading, router]);

  // Global loading is handled by AppStateProvider; no local spinner here

  // Show access denied if user doesn't have admin privileges
  if (user && !hasAdminAccess) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Access Denied"
          color="red"
        >
          You don&apos;t have permission to access the admin area. You need to be an
          owner or admin of an organization to access this section.
          {user.activeOrganization && (
            <div style={{ marginTop: "10px" }}>
              <strong>Current Organization:</strong>{" "}
              {user.activeOrganization.name} ({user.activeOrganization.role})
            </div>
          )}
        </Alert>
      </Container>
    );
  }

  // Show loading if no user yet (will redirect)
  if (!user) {
    return (
      <Container size="lg" py="xl">
        <Group justify="center">
          <Loader size="md" />
        </Group>
      </Container>
    );
  }

  // User has admin access, render the admin content
  return (
    <div>
      {/* Admin-specific layout wrapper */}
      <div style={{ minHeight: "100vh" }}>{children}</div>
    </div>
  );
}
