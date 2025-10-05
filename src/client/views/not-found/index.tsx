"use client";

import { 
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Center,
  Paper
} from "@mantine/core";
import { IconHome, IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "@/client/providers/router-provider";
import { useAuth } from "@/client/hooks/useAuth";

export default function NotFoundPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <Container size="sm" py="xl">
      <Center style={{ minHeight: '60vh' }}>
        <Paper shadow="sm" radius="md" p="xl" w="100%">
          <Stack align="center" gap="xl">
            <Stack align="center" gap="md">
              <Title 
                order={1} 
                size="6rem" 
                fw={900} 
                c="dimmed"
                style={{ lineHeight: 1 }}
              >
                404
              </Title>
              
              <Title order={2} ta="center" fw={600}>
                Page Not Found
              </Title>
              
              <Text size="lg" c="dimmed" ta="center" maw={400}>
                The page you're looking for doesn't exist or has been moved.
              </Text>
            </Stack>

            <Group justify="center" gap="md">
              <Button
                leftSection={<IconArrowLeft size={16} />}
                variant="subtle"
                onClick={handleGoBack}
              >
                Go Back
              </Button>
              
              <Button
                leftSection={<IconHome size={16} />}
                onClick={handleGoHome}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Go Home'}
              </Button>
            </Group>

            {!isAuthenticated && (
              <Group justify="center" gap="sm">
                <Text size="sm" c="dimmed">
                  Need an account?
                </Text>
                <Button 
                  variant="subtle" 
                  size="sm"
                  onClick={() => router.push('/signup')}
                >
                  Sign up
                </Button>
                <Text size="sm" c="dimmed">
                  or
                </Text>
                <Button 
                  variant="subtle" 
                  size="sm"
                  onClick={() => router.push('/login')}
                >
                  Log in
                </Button>
              </Group>
            )}
          </Stack>
        </Paper>
      </Center>
    </Container>
  );
}