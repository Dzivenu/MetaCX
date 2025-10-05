import { Container, Title, Text, Card, SimpleGrid, Stack } from '@mantine/core';

export default function AdminDashboard() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>Admin Dashboard</Title>
          <Text c="dimmed">Manage your application settings and users</Text>
        </div>
        
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          <Card withBorder shadow="sm" radius="md" p="lg">
            <Stack gap="md">
              <Text fw={500}>Total Users</Text>
              <Text size="2rem" fw={700} c="blue">1,234</Text>
              <Text size="sm" c="dimmed">Active users in the system</Text>
            </Stack>
          </Card>
          
          <Card withBorder shadow="sm" radius="md" p="lg">
            <Stack gap="md">
              <Text fw={500}>System Health</Text>
              <Text size="2rem" fw={700} c="green">98.5%</Text>
              <Text size="sm" c="dimmed">Overall system uptime</Text>
            </Stack>
          </Card>
          
          <Card withBorder shadow="sm" radius="md" p="lg">
            <Stack gap="md">
              <Text fw={500}>Security Alerts</Text>
              <Text size="2rem" fw={700} c="orange">3</Text>
              <Text size="sm" c="dimmed">Pending security reviews</Text>
            </Stack>
          </Card>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
