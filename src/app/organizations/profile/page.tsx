"use client";

import { OrganizationProfile } from "@clerk/nextjs";
import { Container, Stack, Title, Text } from "@mantine/core";
import { useAuth } from "@/client/hooks/useAuth";
import { useMantineColorScheme } from "@mantine/core";
import { dark } from "@clerk/themes";

export default function OrganizationProfilePage() {
  const { user, activeOrganization } = useAuth();
  const { colorScheme } = useMantineColorScheme();

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Stack gap="sm">
          <Title order={1}>Organization Settings</Title>
          {activeOrganization && (
            <Text c="dimmed">
              Manage settings for <strong>{activeOrganization.name}</strong>
            </Text>
          )}
        </Stack>

        <OrganizationProfile
          appearance={{
            baseTheme: colorScheme === "dark" ? dark : undefined,
            elements: {
              rootBox: "w-full",
              card: "bg-white shadow-lg rounded-lg border",
              headerTitle: "text-xl font-semibold text-gray-900",
              headerSubtitle: "text-sm text-gray-600",
              navbarMobileMenuButton: "md:hidden",
              navbar: "border-r border-gray-200",
              navbarMobileMenuRow: "border-b border-gray-200",
              pageScrollBox: "flex-1",
              formButtonPrimary:
                "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors",
              formFieldInput:
                "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              formFieldLabel: "block text-sm font-medium text-gray-700 mb-2",
              membershipListContainer: "space-y-2",
              invitationListContainer: "space-y-2",
              badge:
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            },
          }}
          routing="path"
          path="/organizations/profile"
        >
          {/* Custom pages can be added here */}
          <OrganizationProfile.Page
            label="Billing"
            labelIcon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm0 3a1 1 0 100-2 1 1 0 000 2zm12-3a1 1 0 100-2 1 1 0 000 2zm0 3a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
            }
            url="billing"
          >
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Billing & Subscription
              </h2>
              <Text c="dimmed">
                Manage your organization's billing and subscription settings.
              </Text>
              {/* Add your billing management UI here */}
            </div>
          </OrganizationProfile.Page>

          <OrganizationProfile.Page
            label="Integrations"
            labelIcon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M13.5 3a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 3a3 3 0 11-6 0 3 3 0 016 0zM6 11.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM7.5 11.5a3 3 0 11-6 0 3 3 0 016 0zM13.5 19a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 19a3 3 0 11-6 0 3 3 0 016 0zM6.75 5.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zM6 10a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 016 10zM6.75 13.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" />
              </svg>
            }
            url="integrations"
          >
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Integrations</h2>
              <Text c="dimmed">
                Connect your organization with third-party services and tools.
              </Text>
              {/* Add your integrations management UI here */}
            </div>
          </OrganizationProfile.Page>
        </OrganizationProfile>
      </Stack>
    </Container>
  );
}
