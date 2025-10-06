"use client";

import { type ReactNode } from "react";

// Auth Provider - Clerk handles session management internally
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Clerk handles session management automatically
  // No need for additional session provider wrapper
  return <>{children}</>;
}

export default AuthProvider;
