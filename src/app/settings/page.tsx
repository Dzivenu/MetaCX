"use client";

import { Container, Title, Text, Card, Stack, Switch, Button, Group } from "@mantine/core";
import { useMantineColorScheme } from "@mantine/core";

export default function SettingsPage() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Title order={1}>Settings</Title>
        
        <Card withBorder shadow="sm" radius="md" p="lg">
          <Stack gap="md">
            <Text fw={500}>Appearance</Text>
            
            <Group justify="space-between">
              <Stack gap="xs">
                <Text size="sm">Dark Mode</Text>
                <Text size="xs" c="dimmed">
                  Toggle between light and dark themes
                </Text>
              </Stack>
              <Switch
                checked={colorScheme === 'dark'}
                onChange={() => toggleColorScheme()}
              />
            </Group>
          </Stack>
        </Card>

        <Card withBorder shadow="sm" radius="md" p="lg">
          <Stack gap="md">
            <Text fw={500}>Account</Text>
            
            <Button variant="light" color="red" w="fit-content">
              Delete Account
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}