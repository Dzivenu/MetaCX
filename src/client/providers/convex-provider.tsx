"use client";

import { ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  // Only create the client on the client side
  const convex = useMemo(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      // Return a dummy client for SSR
      return null as any;
    }
    
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      console.error("NEXT_PUBLIC_CONVEX_URL is not set");
      return null;
    }
    
    try {
      return new ConvexReactClient(convexUrl);
    } catch (error) {
      console.error("Failed to create Convex client:", error);
      return null;
    }
  }, []);

  // If convex client is not available, render children without Convex context
  if (!convex) {
    return <>{children}</>;
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

export default ConvexClientProvider;
