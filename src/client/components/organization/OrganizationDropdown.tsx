"use client";

import { useMemo } from "react";
import { Menu, Avatar, Group, Text, Loader, Box } from "@mantine/core";
import { useOrganization, useOrganizationList, useAuth } from "@clerk/nextjs";

export function OrganizationDropdown() {
  const { isLoaded: orgLoaded, organization } = useOrganization();
  const {
    isLoaded: listLoaded,
    userMemberships,
    setActive,
  } = useOrganizationList({
    userMemberships: { infinite: true, keepPreviousData: true },
  });
  const { orgId } = useAuth();

  const memberships = userMemberships?.data || [];

  const current = useMemo(() => {
    return organization
      ? {
          id: organization.id,
          name: organization.name,
          imageUrl: organization.imageUrl,
        }
      : null;
  }, [organization]);

  if (!orgLoaded || !listLoaded) {
    return (
      <Group gap="xs">
        <Loader size="sm" />
      </Group>
    );
  }

  if (!current && memberships.length === 0) {
    return (
      <Text size="sm" c="bright">
        No organizations
      </Text>
    );
  }

  return (
    <Menu withArrow>
      <Menu.Target>
        <Group gap="xs" style={{ cursor: "pointer" }}>
          {current?.imageUrl ? (
            <Avatar
              src={current.imageUrl}
              size={20}
              radius="sm"
              alt={current.name}
            />
          ) : (
            <Avatar size={20} radius="sm">
              {current?.name?.[0]?.toUpperCase()}
            </Avatar>
          )}
          <Text size="sm" fw={600} lineClamp={1} c="bright">
            {current?.name || "Select organization"}
          </Text>
        </Group>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Organizations</Menu.Label>
        {memberships.map((mem) => (
          <Menu.Item
            key={mem.id}
            onClick={() => setActive({ organization: mem.organization.id })}
          >
            <Group gap="sm" wrap="nowrap">
              {mem.organization.imageUrl ? (
                <Avatar src={mem.organization.imageUrl} size={22} radius="sm" />
              ) : (
                <Avatar size={22} radius="sm">
                  {mem.organization.name?.[0]?.toUpperCase()}
                </Avatar>
              )}
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text
                  size="sm"
                  fw={500}
                  style={{ display: "block" }}
                  lineClamp={1}
                  c="bright"
                >
                  {mem.organization.name}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {mem.role}
                </Text>
              </Box>
              {orgId === mem.organization.id && (
                <Text size="xs" c="dimmed">
                  Active
                </Text>
              )}
            </Group>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
