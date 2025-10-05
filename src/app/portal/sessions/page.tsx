import { Container, Title, Text, Stack } from '@mantine/core';
import { PortalSessionManager } from '@/client/components/PortalSessionManager';

export default function PortalSessionsPage() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>Sessions</Title>
          <Text c="dimmed">Manage your customer exchange sessions</Text>
        </div>
        
        <PortalSessionManager />
      </Stack>
    </Container>
  );
}
