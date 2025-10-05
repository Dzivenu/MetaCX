"use client";

import { Container } from "@mantine/core";
import { useAuth } from "@/client/hooks/useAuth";
import WelcomePage from "@/client/views/welcome";
import { useRouter } from "@/client/providers/router-provider";
import { useEffect } from "react";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard only if not loading and on root path
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Add a small delay to prevent conflicts with Clerk redirects
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while auth is loading
  if (isLoading) {
    return <Container>Loading...</Container>;
  }

  // Show welcome page for non-authenticated users
  if (!isAuthenticated) {
    return <WelcomePage />;
  }

  // This will show briefly during redirect
  return <Container>Redirecting...</Container>;
}
