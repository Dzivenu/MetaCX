"use client";

import { Stack } from '@mantine/core';
import { AppContainerLayout } from './AppContainerLayout';

interface AppPageLayoutProps {
  children: React.ReactNode;
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function AppPageLayout({ children, spacing = 'md' }: AppPageLayoutProps) {
  return (
    <AppContainerLayout>
      <Stack gap={spacing}>
        {children}
      </Stack>
    </AppContainerLayout>
  );
}