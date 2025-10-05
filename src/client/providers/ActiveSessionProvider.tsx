"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "@/client/hooks/useClerkAuth";
import { useAuth as useClerkAuthCore } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface CxSession {
  _id: string;
  _creationTime: number;
  clerkOrganizationId: string;

  // Session lifecycle timestamps
  openStartDt?: number;
  openConfirmDt?: number;
  closeStartDt?: number;
  closeConfirmDt?: number;

  // User tracking - all reference our Convex users table
  userId: string; // Primary user responsible for session
  openStartUserId?: string; // User who initiated opening
  openConfirmUserId?: string; // User who confirmed opening
  closeStartUserId?: string; // User who initiated closing
  closeConfirmUserId?: string; // User who confirmed closing

  // Session status and role
  status?: string; // "DORMANT", "FLOAT_OPEN_START", "FLOAT_OPEN_COMPLETE", "FLOAT_CLOSE_START", etc.
  role?: string; // Session role/type if applicable

  // Verification tracking
  verifiedBy?: string; // Name of verifier
  verifiedByUserId?: string; // User who verified
  verifiedDt?: number; // When verification occurred

  // Report generation tracking
  fintracReportGenerated?: boolean;
  sessionReportGenerated?: boolean;
  sessionCurrencyReportGenerated?: boolean;

  // Cached views (for performance optimization)
  openExchangeCalculation?: number;
  closeExchangeCalculation?: number;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

interface ActiveSessionContextType {
  activeSession: CxSession | null;
  loading: boolean;
  error: string | null;
  setActiveSession: (session: CxSession | null) => void;
  clearActiveSession: () => void;
  refreshActiveSession: () => Promise<void>;
}

const ActiveSessionContext = createContext<
  ActiveSessionContextType | undefined
>(undefined);

interface ActiveSessionProviderProps {
  children: React.ReactNode;
}

export function ActiveSessionProvider({
  children,
}: ActiveSessionProviderProps) {
  const { user, activeOrganization } = useAuth();
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuthCore();
  const [error, setError] = useState<string | null>(null);

  // Get active sessions from Convex - with better caching
  const canQuery = clerkLoaded && isSignedIn && !!activeOrganization?.id;

  // Use state to control when to re-fetch active sessions
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const activeSessions = useQuery(
    api.functions.orgCxSessions.getActiveSessions,
    canQuery && activeOrganization?.id
      ? {
          clerkOrganizationId: activeOrganization.id,
          _refreshTrigger: refreshTrigger, // This will force re-fetch when changed
        }
      : "skip"
  );

  // Reset refresh trigger when organization changes
  useEffect(() => {
    if (activeOrganization?.id) {
      setRefreshTrigger(0);
    }
  }, [activeOrganization?.id]);

  // Mutation to close active session
  // Note: Type error will resolve once Convex regenerates the API types
  const closeSession = useMutation(
    api.functions.orgCxSessions.closeSession as any
  );

  // Get the first active session (most recent)
  const activeSession =
    activeSessions && activeSessions.length > 0 ? activeSessions[0] : null;
  const loading = activeSessions === undefined && canQuery;

  const refreshActiveSession = useCallback(async () => {
    // Force re-fetch of active sessions by changing the refresh trigger
    console.log("🔄 ActiveSessionProvider: Forcing refresh of active sessions");
    setRefreshTrigger((prev) => prev + 1);
    setError(null);
  }, []);

  const setActiveSession = (session: CxSession | null) => {
    // In Convex, we don't manually set sessions - they're managed by mutations
    // This function is kept for backward compatibility
    console.warn(
      "setActiveSession is deprecated - use Convex mutations instead"
    );
  };

  const clearActiveSession = useCallback(async () => {
    if (activeSession) {
      try {
        await closeSession({ sessionId: activeSession._id });
        setError(null);
      } catch (err) {
        console.error("Error closing session:", err);
        setError(
          err instanceof Error ? err.message : "Failed to close session"
        );
      }
    }
  }, [activeSession, closeSession]);

  const value: ActiveSessionContextType = {
    activeSession,
    loading,
    error,
    setActiveSession,
    clearActiveSession,
    refreshActiveSession,
  };

  return (
    <ActiveSessionContext.Provider value={value}>
      {children}
    </ActiveSessionContext.Provider>
  );
}

// Custom hook to use the active session context
export function useActiveSessionContext(): ActiveSessionContextType {
  const context = useContext(ActiveSessionContext);

  if (context === undefined) {
    throw new Error(
      "useActiveSessionContext must be used within an ActiveSessionProvider"
    );
  }

  return context;
}

// Export the context for advanced use cases
export { ActiveSessionContext };
