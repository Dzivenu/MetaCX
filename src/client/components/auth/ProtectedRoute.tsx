"use client";

import { ReactNode } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useAuth } from "@/client/hooks/useAuth";
import { Container, Center, Text, Button, Stack } from "@mantine/core";
import { useRouter } from "@/client/providers/router-provider";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireConvexUser?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  fallback,
  requireConvexUser = true,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Loading state
  if (isLoading) {
    return (
      <Container size="xs" style={{ minHeight: "100vh" }}>
        <Center style={{ minHeight: "100vh" }}>
          <Stack align="center" gap="md">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <Text size="sm" c="dimmed">
              Loading...
            </Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  // Default fallback for unauthenticated users
  const defaultFallback = (
    <Container size="xs" style={{ minHeight: "100vh" }}>
      <Center style={{ minHeight: "100vh" }}>
        <Stack align="center" gap="lg">
          <Stack align="center" gap="sm">
            <Text size="xl" fw={600}>
              Authentication Required
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              You need to sign in to access this page.
            </Text>
          </Stack>
          <Button onClick={() => router.push(redirectTo)}>Go to Sign In</Button>
        </Stack>
      </Center>
    </Container>
  );

  // If we require a Convex user and don't have one yet (but are signed in to Clerk)
  if (requireConvexUser && !user && isAuthenticated) {
    return (
      <Container size="xs" style={{ minHeight: "100vh" }}>
        <Center style={{ minHeight: "100vh" }}>
          <Stack align="center" gap="lg">
            <Stack align="center" gap="sm">
              <Text size="xl" fw={600}>
                Setting up your account...
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                We're syncing your account with our database. This should only
                take a moment.
              </Text>
            </Stack>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <>
      <SignedOut>{fallback || defaultFallback}</SignedOut>
      <SignedIn>
        {requireConvexUser && !user ? (
          <Container size="xs" style={{ minHeight: "100vh" }}>
            <Center style={{ minHeight: "100vh" }}>
              <Stack align="center" gap="lg">
                <Text size="xl" fw={600}>
                  Account Setup Required
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  There was an issue setting up your account. Please try
                  refreshing the page.
                </Text>
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </Stack>
            </Center>
          </Container>
        ) : (
          children
        )}
      </SignedIn>
    </>
  );
}
