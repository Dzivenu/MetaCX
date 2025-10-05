import { Container, Title, Text, Card, SimpleGrid, Stack, Button } from '@mantine/core';
import Link from 'next/link';

export default function PortalHome() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>Portal Home</Title>
          <Text c="dimmed">Welcome to your customer portal</Text>
        </div>
        
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          <Card withBorder shadow="sm" radius="md" p="lg">
            <Stack gap="md">
              <Text fw={500}>Recent Orders</Text>
              <Text size="sm" c="dimmed">View and track your recent orders</Text>
              <Button variant="light" fullWidth>View Orders</Button>
            </Stack>
          </Card>
          
          <Card withBorder shadow="sm" radius="md" p="lg">
            <Stack gap="md">
              <Text fw={500}>Sessions</Text>
              <Text size="sm" c="dimmed">Manage your customer exchange sessions</Text>
              <Link href="/portal/sessions" style={{ textDecoration: 'none' }}>
                <Button variant="light" fullWidth>Manage Sessions</Button>
              </Link>
            </Stack>
          </Card>
          
          <Card withBorder shadow="sm" radius="md" p="lg">
            <Stack gap="md">
              <Text fw={500}>Messages</Text>
              <Text size="sm" c="dimmed">Check your latest messages and notifications</Text>
              <Button variant="light" fullWidth>View Messages</Button>
            </Stack>
          </Card>
          
          <Card withBorder shadow="sm" radius="md" p="lg">
            <Stack gap="md">
              <Text fw={500}>Account Settings</Text>
              <Text size="sm" c="dimmed">Manage your account and preferences</Text>
              <Button variant="light" fullWidth>Manage Account</Button>
            </Stack>
          </Card>
          
          <Card withBorder shadow="sm" radius="md" p="lg">
            <Stack gap="md">
              <Text fw={500}>Support</Text>
              <Text size="sm" c="dimmed">Get help and contact customer support</Text>
              <Button variant="light" fullWidth>Contact Support</Button>
            </Stack>
          </Card>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
