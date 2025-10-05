'use client';

import { Box, Flex } from '@mantine/core';
import { NavbarSegmented } from '@/client/components/navigation/NavbarSegmented';
import { useAuth } from '@/client/hooks/useAuth';
import { usePathname } from '@/client/providers/router-provider';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  
  // Show sidebar only for authenticated users on admin/portal routes
  const shouldShowSidebar = isAuthenticated && (pathname.startsWith('/admin') || pathname.startsWith('/portal'));

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <Flex>
      <NavbarSegmented />
      <Box style={{ flex: 1, minHeight: '100vh' }}>
        {children}
      </Box>
    </Flex>
  );
}
