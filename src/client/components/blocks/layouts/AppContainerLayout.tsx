"use client";

import { Container, ContainerProps } from '@mantine/core';
import { AppViewTransition } from './AppViewTransition';

interface AppContainerLayoutProps extends ContainerProps {
  children: React.ReactNode;
}

export function AppContainerLayout({ children, ...props }: AppContainerLayoutProps) {
  return (
    <Container {...props}>
      <AppViewTransition>
        {children}
      </AppViewTransition>
    </Container>
  );
}