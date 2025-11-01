import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export type { Repository } from "@/client/api/repositories";

interface UseRepositoriesResult {
  repositories: Repository[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refetch: () => Promise<void>;
  updateRepository: (id: string, data: Partial<Repository>) => Promise<boolean>;
}

export const useRepositories = (): UseRepositoriesResult => {
  const [error, setError] = useState<string | null>(null);

  // Use Convex query directly for authentication
  const repositoriesQuery = useQuery(api.functions.repositories.getRepositories);
  const loading = repositoriesQuery === undefined;
  const repositories = repositoriesQuery || [];

  // Handle any errors from the query
  useEffect(() => {
    if (repositoriesQuery === null) {
      setError("Failed to fetch repositories");
    } else {
      setError(null);
    }
  }, [repositoriesQuery]);

  const updateRepository = async (
    id: string,
    data: Partial<Repository>
  ): Promise<boolean> => {
    // This would need a mutation - for now just return false
    console.warn("Repository updates not implemented yet");
    return false;
  };

  const refresh = async () => {
    // Convex handles caching automatically
    console.log("Refresh called - Convex handles this automatically");
  };

  const refetch = refresh;

  return {
    repositories,
    loading,
    error,
    refresh,
    refetch,
    updateRepository,
  };
};
