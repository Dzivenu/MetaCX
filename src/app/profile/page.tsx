"use client";

import { Container, Title, Text, Card, Stack, Group, Avatar, Button } from "@mantine/core";
import { useAuth } from "@/client/hooks/useAuth";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Title order={1}>Profile</Title>
        
        <Card withBorder shadow="sm" radius="md" p="lg">
          <Stack gap="md">
            <Group>
              <Avatar size="lg" radius="xl">
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Stack gap="xs">
                <Text fw={500} size="lg">{user?.name}</Text>
                <Text c="dimmed" size="sm">{user?.email}</Text>
              </Stack>
            </Group>
            
            <Button variant="light" w="fit-content">
              Edit Profile
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}