import { useActiveSessionContext } from '@/client/providers/ActiveSessionProvider';

export function useActiveSession() {
  const context = useActiveSessionContext();
  return {
    activeSession: context.activeSession,
    loading: context.loading,
    error: context.error,
    setActiveSession: context.setActiveSession,
    clearActiveSession: context.clearActiveSession,
    refreshActiveSession: context.refreshActiveSession,
  };
}
