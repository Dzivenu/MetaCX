"use client";

import { Box } from '@mantine/core';
import { AppContainerLayout } from './AppContainerLayout';

interface AppSectionLayoutProps {
  children: React.ReactNode;
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function AppSectionLayout({ children, spacing = 'md' }: AppSectionLayoutProps) {
  return (
    <AppContainerLayout>
      <Box py={spacing}>
        {children}
      </Box>
    </AppContainerLayout>
  );
}