"use client";

import { Group, Title, Box } from '@mantine/core';
import { AppContainerLayout } from './AppContainerLayout';

interface AppPageHeaderLayoutProps {
  headerTitle?: React.ReactNode;
  headerAside?: React.ReactNode;
  headerActions?: React.ReactNode;
  children?: React.ReactNode;
}

export function AppPageHeaderLayout({
  headerTitle,
  headerAside,
  headerActions,
  children
}: AppPageHeaderLayoutProps) {
  return (
    <AppContainerLayout>
      <Group justify="space-between" align="center" mb="md">
        <Group align="center">
          {headerTitle && (
            <Title order={2}>
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