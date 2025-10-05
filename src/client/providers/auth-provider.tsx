"use client";

import { type ReactNode } from "react";

// Better Auth Provider - better-auth handles session management internally
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // better-auth client handles session management automatically
  // No need for additional session provider wrapper
  return <>{children}</>;
}

export default AuthProvider;
