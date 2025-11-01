"use client";

import {
  AppShell,
  Group,
  Text,
  useMantineColorScheme,
  Avatar,
  UnstyledButton,
  HoverCard,
  Button,
  Stack,
  Badge,
  ActionIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconUser,
  IconSettings,
  IconLogout,
  IconSun,
  IconMoon,
  IconChevronDown,
  IconBuilding,
  IconSwitchHorizontal,
  IconCircleX,
} from "@tabler/icons-react";
import { useRouter } from "@/client/providers/router-provider";
import { useActiveSession } from "@/client/hooks/useActiveSession";
import { useLeaveCxSession } from "@/client/hooks/useLeaveCxSession";
import { useActiveSessionContext } from "@/client/providers/ActiveSessionProvider";
import { useMantineColorScheme as useMantineScheme } from "@mantine/core";
import {
  useAuth as useClerkAuth,
  UserButton,
  OrganizationSwitcher,
} from "@clerk/nextjs";
import { dark } from "@clerk/themes";

function getSessionStatusColor(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "float_open_complete":
    case "open":
    case "opened":
      return "green";
    case "float_open_start":
    case "pending":
    case "pending_open":
    case "opening":
      return "yellow";
    case "float_close_start":
    case "pending_close":
    case "closing":
      return "orange";
    case "float_close_complete":
    case "closed":
      return "gray";
    case "dormant":
      return "blue";
    default:
      return "blue";
  }
}

export function TopNavbarRight() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { activeSession } = useActiveSession();
  const { leaveSession } = useLeaveCxSession();
  const { clearActiveSession } = useActiveSessionContext();

  const isAuthenticated = isSignedIn && isLoaded;

  const handleCloseSession = async () => {
    try {
      await clearActiveSession();
      notifications.show({
        title: "Session Closed",
        message: "The trading session has been successfully closed",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to close session",
        color: "red",
      });
    }
  };

  return (
    <Group gap="sm">
      {isAuthenticated && activeSession && (
        <HoverCard width={280} shadow="md" position="bottom-end">
          <HoverCard.Target>
            <UnstyledButton>
              <Group gap="xs">
                <Avatar size={32} radius="xl" color="blue">
                  <IconSettings size={16} />
                </Avatar>
                <div
                  style={{
                    minWidth: "120px",
                    maxWidth: "120px",
                    position: "relative",
                  }}
                >
                  <Text
                    size="sm"
                    fw={500}
                    truncate
                    style={{ display: "block" }}
                  >
                    Session {activeSession._id.substring(0, 8)}
                  </Text>
                  <Badge
                    size="xs"
                    color={getSessionStatusColor(activeSession.status)}
                    variant="filled"
                    style={{
                      position: "absolute",
                      top: -8,
                      right: -4,
                      fontSize: "9px",
                      height: "16px",
                      minWidth: "40px",
                    }}
                  >
                    {(activeSession.status || "DORMANT")
                      .replace(/_/g, " ")
                      .toUpperCase()}
                  </Badge>
                </div>
                <IconChevronDown size={16} />
              </Group>
            </UnstyledButton>
          </HoverCard.Target>
          <HoverCard.Dropdown>
            <Stack gap="xs">
              <Button
                variant="subtle"
                leftSection={<IconSwitchHorizontal size={16} />}
                justify="start"
                onClick={() => router.push("/portal/sessions")}
              >
                Change Session
              </Button>
              <Button
                variant="subtle"
                leftSection={<IconUser size={16} />}
                justify="start"
                onClick={() => router.push(`/sessions/${activeSession._id}`)}
              >
                View Session
              </Button>
              <Button
                variant="subtle"
                color="red"
                leftSection={<IconCircleX size={16} />}
                justify="start"
                onClick={handleCloseSession}
              >
                Close Session
              </Button>
              <Button
                variant="subtle"
                color="red"
                leftSection={<IconLogout size={16} />}
                justify="start"
                onClick={async () => {
                  if (activeSession) {
                    try {
                      await leaveSession({ sessionId: activeSession._id });
                    } catch (error) {
                      console.error("Failed to leave session:", error);
                    }
                  }
                }}
              >
                Leave Session
              </Button>
            </Stack>
          </HoverCard.Dropdown>
        </HoverCard>
      )}

      {isAuthenticated && (
        <OrganizationSwitcher
          appearance={{
            baseTheme: colorScheme === "dark" ? dark : undefined,
            elements: {
              rootBox: "flex items-center",
              organizationSwitcherTrigger:
                "px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-inherit",
              organizationSwitcherTriggerIcon: "w-4 h-4 text-inherit",
              organizationPreview: "flex items-center gap-2",
              organizationPreviewAvatarBox: "w-6 h-6",
              organizationPreviewMainIdentifier:
                "text-sm font-medium text-inherit",
              organizationPreviewSecondaryIdentifier: "text-inherit",
            },
          }}
          createOrganizationMode="modal"
          organizationProfileMode="modal"
          hidePersonal={false}
        />
      )}

      {isAuthenticated && (
        <UserButton
          appearance={{
            baseTheme: colorScheme === "dark" ? dark : undefined,
            elements: {
              avatarBox: "w-8 h-8",
              userButtonPopoverCard: "shadow-lg border",
              userButtonPopoverActionButton: "hover:bg-gray-50",
            },
          }}
          showName={false}
          afterSignOutUrl="/"
        >
          <UserButton.MenuItems>
            <UserButton.Link
              label="Organizations"
              labelIcon={<IconBuilding size={16} />}
              href="/organizations"
            />
            <UserButton.Link
              label="Dashboard"
              labelIcon={<IconUser size={16} />}
              href="/dashboard"
            />
            <UserButton.Link
              label="Settings"
              labelIcon={<IconSettings size={16} />}
              href="/settings"
            />
            <UserButton.Action
              label="Toggle Theme"
              labelIcon={
                colorScheme === "dark" ? (
                  <IconSun size={16} />
                ) : (
                  <IconMoon size={16} />
                )
              }
              onClick={() => toggleColorScheme()}
            />
          </UserButton.MenuItems>
        </UserButton>
      )}
    </Group>
  );
}
