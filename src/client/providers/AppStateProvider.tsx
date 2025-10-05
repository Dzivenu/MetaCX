"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/client/hooks/useClerkAuth";
import { useActiveOrganizationContext } from "./ActiveOrganizationProvider";
import { useActiveSessionContext } from "./ActiveSessionProvider";
import { Center, Loader } from "@mantine/core";

export interface AppStateContextType {
  // bootstrap
  isBootstrapping: boolean;
  bootError: string | null;

  // auth
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  user: ReturnType<typeof useAuth>["user"];
  refreshSession: ReturnType<typeof useAuth>["refreshSession"];
  refreshUserInfo: ReturnType<typeof useAuth>["refreshUserInfo"];

  // organization
  activeOrganization: ReturnType<
    typeof useActiveOrganizationContext
  >["activeOrganization"];
  orgLoading: ReturnType<typeof useActiveOrganizationContext>["loading"];
  orgError: ReturnType<typeof useActiveOrganizationContext>["error"];
  setActiveOrganization: ReturnType<
    typeof useActiveOrganizationContext
  >["setActiveOrganization"];
  clearActiveOrganization: ReturnType<
    typeof useActiveOrganizationContext
  >["clearActiveOrganization"];

  // cx session
  activeSession: ReturnType<typeof useActiveSessionContext>["activeSession"];
  sessionLoading: ReturnType<typeof useActiveSessionContext>["loading"];
  sessionError: ReturnType<typeof useActiveSessionContext>["error"];
  refreshActiveSession: ReturnType<
    typeof useActiveSessionContext
  >["refreshActiveSession"];
  clearActiveSession: ReturnType<
    typeof useActiveSessionContext
  >["clearActiveSession"];
}

const AppStateContext = createContext<AppStateContextType | undefined>(
  undefined
);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const {
    user,
    isLoading: isAuthLoading,
    isAuthenticated,
    refreshSession,
    refreshUserInfo,
  } = useAuth();

  const {
    activeOrganization,
    loading: orgLoading,
    error: orgError,
    setActiveOrganization,
    clearActiveOrganization,
  } = useActiveOrganizationContext();

  const {
    activeSession,
    loading: sessionLoading,
    error: sessionError,
    refreshActiveSession,
    clearActiveSession,
  } = useActiveSessionContext();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        setIsBootstrapping(true);
        setBootError(null);

        // 1) Ensure session (async)
        const sessionPromise = refreshSession();

        // If user is not authenticated yet, don't wait for full bootstrap
        if (!isAuthenticated && !isAuthLoading) {
          if (!cancelled) setIsBootstrapping(false);
          return;
        }

        // Wait for session
        const session = await sessionPromise;

        // If not authenticated, stop bootstrapping and show app (likely login routes)
        if (!session || !session.user) {
          if (!cancelled) setIsBootstrapping(false);
          return;
        }

        // 2) Concurrently fetch user info and active session
        const [userInfoResult, activeSessionResult] = await Promise.allSettled([
          refreshUserInfo(),
          refreshActiveSession(),
        ]);

        // Log errors but don't fail the entire bootstrap
        if (userInfoResult.status === "rejected") {
          console.warn("Failed to refresh user info:", userInfoResult.reason);
        }
        if (activeSessionResult.status === "rejected") {
          console.warn(
            "Failed to refresh active session:",
            activeSessionResult.reason
          );
        }
      } catch (e: unknown) {
        const msg =
          e instanceof Error
            ? e.message
            : typeof e === "string"
              ? e
              : "Failed to initialize app";
        if (!cancelled) setBootError(String(msg));
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
    // We intentionally run once on mount; internal calls handle state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAuthLoading]);

  const value: AppStateContextType = useMemo(
    () => ({
      isBootstrapping,
      bootError,
      isAuthenticated,
      isAuthLoading,
      user,
      refreshSession,
      refreshUserInfo,
      activeOrganization,
      orgLoading,
      orgError,
      setActiveOrganization,
      clearActiveOrganization,
      activeSession,
      sessionLoading,
      sessionError,
      refreshActiveSession,
      clearActiveSession,
    }),
    [
      isBootstrapping,
      bootError,
      isAuthenticated,
      isAuthLoading,
      user,
      refreshSession,
      refreshUserInfo,
      activeOrganization,
      orgLoading,
      orgError,
      setActiveOrganization,
      clearActiveOrganization,
      activeSession,
      sessionLoading,
      sessionError,
      refreshActiveSession,
      clearActiveSession,
    ]
  );

  // Gate rendering until we finish initial bootstrap for authenticated users
  if (isBootstrapping && (isAuthenticated || isAuthLoading)) {
    return (
      <Center style={{ width: "100%", height: "100vh" }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextType {
  const ctx = useContext(AppStateContext);
  if (!ctx)
    throw new Error("useAppState must be used within an AppStateProvider");
  return ctx;
}
