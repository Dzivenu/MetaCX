"use client";

import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/client/hooks/useAuth";

interface AuthStatusProps {
  showConvexData?: boolean;
}

export function AuthStatus({ showConvexData = false }: AuthStatusProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const convexUser = useQuery(api.functions.auth.getCurrentUser);
  const authenticatedMessage = useQuery(
    api.functions.auth.getAuthenticatedMessage
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-full"></div>
        <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <SignedOut>
        <div className="flex items-center gap-2">
          <SignInButton mode="modal">
            <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex items-center gap-4">
          {showConvexData && user && (
            <div className="text-sm text-gray-600">
              <div>Welcome, {user.name || user.email}</div>
              {authenticatedMessage && (
                <div className="text-xs text-green-600 mt-1">
                  Convex: {authenticatedMessage}
                </div>
              )}
            </div>
          )}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonPopoverCard: "shadow-lg border",
                userButtonPopoverActionButton: "hover:bg-gray-50",
              },
            }}
            showName={false}
          />
        </div>
      </SignedIn>
    </div>
  );
}
