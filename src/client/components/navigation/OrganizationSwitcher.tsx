"use client";

import { useState } from 'react';
import { useAuth } from '@/client/hooks/useAuth';
import { 
  Menu, 
  Button, 
  Group, 
  Text, 
  Avatar,
  Divider,
  ActionIcon
} from '@mantine/core';
import { 
  IconBuilding, 
  IconChevronDown, 
  IconPlus,
  IconSettings
} from '@tabler/icons-react';
import { useRouter } from '@/client/providers/router-provider';

export function OrganizationSwitcher() {
  const { organizations, user } = useAuth();
  const router = useRouter();
  const [opened, setOpened] = useState(false);

  // Find active organization (you might want to track this in state)
  const activeOrg = organizations[0]; // For now, just use the first one

  const handleOrgSelect = (orgSlug: string) => {
    router.push(`/organizations/${orgSlug}`);
    setOpened(false);
  };

  const handleCreateOrg = () => {
    router.push('/organizations');
    setOpened(false);
  };

  if (!user) return null;

  return (
    <Menu opened={opened} onChange={setOpened} width={280}>
      <Menu.Target>
        <Button 
          variant="subtle" 
          rightSection={<IconChevronDown size={16} />}
          leftSection={<IconBuilding size={16} />}
        >
          {activeOrg ? activeOrg.name : 'Select Organization'}
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Organizations</Menu.Label>
        
        {organizations.length === 0 ? (
          <Menu.Item disabled>
            <Text size="sm" c="dimmed">No organizations</Text>
          </Menu.Item>
        ) : (
          organizations.map((org) => (
            <Menu.Item
              key={org.id}
              onClick={() => handleOrgSelect(org.slug)}
              leftSection={
                <Avatar size="sm" radius="sm">
                  {org.name.charAt(0).toUpperCase()}
                </Avatar>
              }
            >
              <div>
                <Text size="sm" fw={500}>{org.name}</Text>
                <Text size="xs" c="dimmed">@{org.slug}</Text>
              </div>
            </Menu.Item>
          ))
        )}
        
        <Divider />
        
        <Menu.Item
          leftSection={<IconPlus size={16} />}
          onClick={handleCreateOrg}
        >
          Create Organization
        </Menu.Item>
        
        <Menu.Item
          leftSection={<IconSettings size={16} />}
          onClick={() => {
            router.push('/organizations');
            setOpened(false);
          }}
        >
          Manage Organizations
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}