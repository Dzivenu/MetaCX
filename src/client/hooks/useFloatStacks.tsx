import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/client/utils/api-client";

interface FloatStack {
  id: string;
  openCount: number;
  closeCount: number;
  middayCount: number;
  lastSessionCount: number;
  spentDuringSession: string;
  transferredDuringSession: number;
  denominatedValue: number;
  ticker: string;
  openSpot: number;
  closeSpot: number;
  averageSpot: number;
  openConfirmedDt: Date | null;
  closeConfirmedDt: Date | null;
  value: number;
  denomination: {
    id: string;
    value: number;
    name: string;
  };
}

interface CurrencyFloat {
  id: string;
  ticker: string;
  name: string;
  typeof: string;
  float_display_order: number;
  tradeable: boolean;
  current_stash_value: string;
  rate_decimal_places: number;
  amount_decimal_places: number;
  icon: string | null;
  photo: string | null;
  float_stacks: FloatStack[];
}

interface Repository {
  id: string;
  name: string;
  typeof: string | null;
  branch_id: number;
  type_of_currencies: string;
  type_of_repository: string;
  display_id: string | null;
  currencies: CurrencyFloat[];
}

// API now returns repositories array directly
type FloatStacksData = Repository[];

interface UseFloatStacksReturn {
  floatStacks: FloatStacksData | null;
  repositories: Repository[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch float stacks for the current CX session
 * @param sessionId - The CX session ID to fetch float stacks for
 * @returns Object containing float stacks data, loading state, and error state
 */
export function useFloatStacks(sessionId: string | null): UseFloatStacksReturn {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["floatStacks", sessionId],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error("Session ID is required");
      }

      const response = await apiClient(
        `/api/sessions/${sessionId}/float-stacks`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch float stacks: ${response.statusText}`);
      }

      const result = await response.json();
      return result as FloatStacksData;
    },
    enabled: !!sessionId, // Only run query if sessionId is provided
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false,
  });

  return {
    floatStacks: data || null,
    repositories: data || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
