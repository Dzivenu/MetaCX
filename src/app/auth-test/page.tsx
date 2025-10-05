"use client";

import { Container, Stack, Title, Text } from "@mantine/core";
import { AuthStatus } from "@/client/components/auth/AuthStatus";
import { AuthInfo } from "@/client/components/auth/AuthInfo";
import { ProtectedRoute } from "@/client/components/auth/ProtectedRoute";

export default function AuthTestPage() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Stack gap="sm">
          <Title order={1}>Authentication Test Page</Title>
          <Text c="dimmed">
            Test the integration between Clerk authentication and Convex backend
          </Text>
        </Stack>

        {/* Auth Status Component */}
        <Stack gap="sm">
          <Title order={2} size="h3">
            Auth Status Component
          </Title>
          <Text size="sm" c="dimmed">
            This component shows authentication buttons when signed out, and
            user info when signed in:
          </Text>
          <AuthStatus showConvexData={true} />
        </Stack>

        {/* Auth Info Component */}
        <Stack gap="sm">
          <Title order={2} size="h3">
            Detailed Authentication Info
          </Title>
          <Text size="sm" c="dimmed">
            This component shows detailed information about the Clerk + Convex
            integration:
          </Text>
          <AuthInfo />
        </Stack>

        {/* Protected Content */}
        <Stack gap="sm">
          <Title order={2} size="h3">
            Protected Route Example
          </Title>
          <Text size="sm" c="dimmed">
            The content below is only visible to authenticated users:
          </Text>
          <ProtectedRoute>
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
              <Text fw={600} c="green.8" mb="xs">
                🎉 Protected Content
              </Text>
              <Text size="sm" c="green.7">
                This content is only visible to authenticated users. The
                ProtectedRoute component handles both Clerk authentication and
                Convex user synchronization.
              </Text>
            </div>
          </ProtectedRoute>
        </Stack>

        {/* Integration Notes */}
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <Title order={3} size="h4" c="blue.8" mb="md">
            How the Integration Works
          </Title>
          <Stack gap="xs">
            <Text size="sm">
              <strong>1. Clerk Authentication:</strong> Handles the complete
              authentication UI and flow
            </Text>
            <Text size="sm">
              <strong>2. JWT Integration:</strong> Clerk provides JWT tokens
              that Convex validates
            </Text>
            <Text size="sm">
              <strong>3. Convex Functions:</strong> Access authenticated user
              context via <code>ctx.auth</code>
            </Text>
            <Text size="sm">
              <strong>4. Real-time Sync:</strong> User data is automatically
              synchronized between Clerk and Convex
            </Text>
            <Text size="sm">
              <strong>5. Unified Hook:</strong> The <code>useAuth</code> hook
              provides a consistent interface
            </Text>
          </Stack>
        </div>
      </Stack>
    </Container>
  );
}
