"use client";

import { Container, Center, Text } from "@mantine/core";
import { useRouter } from "@/client/providers/router-provider";
import { useEffect } from "react";
import { useAuth } from "@/client/hooks/useAuth";
import { SignInCard } from "@/client/components/auth/SignInCard";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <Container size="xs" style={{ minHeight: "100vh" }}>
        <Center style={{ minHeight: "100vh" }}>
          <Text>Loading...</Text>
        </Center>
      </Container>
    );
  }

  // Don't render login form if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <Container size="xs" style={{ minHeight: "100vh" }}>
      <Center style={{ minHeight: "100vh" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <SignInCard />
        </div>
      </Center>
    </Container>
  );
}
