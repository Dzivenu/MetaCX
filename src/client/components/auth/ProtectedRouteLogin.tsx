"use client";

import { 
  Container, 
  Center
} from '@mantine/core';
import { SignInCard } from '@/client/components/auth/SignInCard';

interface ProtectedRouteLoginProps {
  message?: string;
}

export function ProtectedRouteLogin({ 
  message = "Please log in to access this page" 
}: ProtectedRouteLoginProps) {
  return (
    <Container size="sm" py="xl">
      <Center>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <SignInCard title="Authentication Required" subtitle={message} />
        </div>
      </Center>
    </Container>
  );
}