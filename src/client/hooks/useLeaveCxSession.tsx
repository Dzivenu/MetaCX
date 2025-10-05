import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "../utils/api-client";
import { useActiveSession } from "./useActiveSession";

interface LeaveCxSessionData {
  sessionId: string;
}

export function useLeaveCxSession() {
  const queryClient = useQueryClient();
  const { refreshActiveSession } = useActiveSession();

  const mutation = useMutation({
    mutationFn: async ({ sessionId }: LeaveCxSessionData) => {
      const response = await apiPost(`/api/cx-sessions/${sessionId}/leave`, {});
      if (!response.ok) {
        throw new Error("Failed to leave session");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch sessions
      queryClient.invalidateQueries({ queryKey: ["cx-sessions"] });
      // Refresh the active session context
      refreshActiveSession();
    },
  });

  return {
    leaveSession: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
