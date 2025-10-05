"use client";

import { Group, Title, Box } from '@mantine/core';
import { AppContainerLayout } from './AppContainerLayout';

interface AppPageSubHeaderLayoutProps {
  headerTitle?: React.ReactNode;
  headerAside?: React.ReactNode;
  headerActions?: React.ReactNode;
  children?: React.ReactNode;
}

export function AppPageSubHeaderLayout({
  headerTitle,
  headerAside,
  headerActions,
  children
}: AppPageSubHeaderLayoutProps) {
  return (
    <AppContainerLayout>
      <Group justify="space-between" align="center" mb="sm">
        <Group align="center">
          {headerTitle && (
            <Title order={3}>
              {headerTitle}
            </Title>
          )}
          {headerAside && (
            <Box>
              {headerAside}
            </Box>
          )}
        </Group>
        {headerActions && (
          <Group>
            {headerActions}
          </Group>
        )}
      </Group>
      {children}
    </AppContainerLayout>
  );
}