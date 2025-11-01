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
      // Return a dummy client for SSR - this won't be used but prevents errors
      return null as any;
    }
    
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      console.warn("NEXT_PUBLIC_CONVEX_URL not set, Convex functionality will be disabled");
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
    console.warn("Convex client not available, rendering without Convex context");
    return <>{children}</>;
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

export default ConvexClientProvider;
