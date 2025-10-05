"use client";

import { 
  Button, 
  Card, 
  Group, 
  Text, 
  Badge, 
  ActionIcon,
  Notification,
  Stack
} from '@mantine/core';
import { IconCheck, IconX, IconBell } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

export function MantineTest() {
  const showNotification = () => {
    notifications.show({
      title: 'Mantine is working!',
      message: 'All components are properly configured 🎉',
      color: 'green',
      icon: <IconCheck size={16} />,
    });
  };

  return (
    <Card withBorder shadow="sm" radius="md" p="lg" maw={400}>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={500}>Mantine Test Component</Text>
          <Badge color="green" variant="light">
            Working
          </Badge>
        </Group>
      </Card.Section>

      <Stack gap="md" mt="md">
        <Text size="sm" c="dimmed">
          This component demonstrates that Mantine is properly configured with:
        </Text>
        
        <Group gap="xs">
          <Button variant="filled" size="sm">
            Filled Button
          </Button>
          <Button variant="outline" size="sm">
            Outline Button
          </Button>
          <ActionIcon variant="light" color="blue">
            <IconBell size={16} />
          </ActionIcon>
        </Group>

        <Button 
          onClick={showNotification}
          variant="gradient"
          gradient={{ from: 'blue', to: 'cyan' }}
          fullWidth
        >
          Test Notifications
        </Button>
      </Stack>
    </Card>
  );
}