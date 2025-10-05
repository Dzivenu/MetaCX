"use client";

import { 
  AppShell, 
  Group, 
  Text,
  Button,
  useMantineColorScheme,
  ActionIcon
} from '@mantine/core';
import { 
  IconSun,
  IconMoon
} from '@tabler/icons-react';
import { useRouter } from '@/client/providers/router-provider';

interface GuestLayoutProps {
  children: React.ReactNode;
}

export function GuestLayout({ children }: GuestLayoutProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const router = useRouter();

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text size="lg" fw={700}>
            Your App
          </Text>
          
          <Group gap="sm">
            <ActionIcon
              variant="subtle"
              onClick={() => toggleColorScheme()}
              size="lg"
            >
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
            
            <Button 
              variant="subtle"
              onClick={() => router.push('/login')}
            >
              Login
            </Button>
            
            <Button 
              onClick={() => router.push('/signup')}
            >
              Sign Up
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}