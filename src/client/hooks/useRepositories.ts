import { useState, useEffect } from "react";
import { repositories, Repository } from "@/client/api/repositories";

export { Repository } from "@/client/api/repositories";

interface UseRepositoriesResult {
  repositories: Repository[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refetch: () => Promise<void>;
  updateRepository: (id: string, data: Partial<Repository>) => Promise<boolean>;
}

export const useRepositories = (): UseRepositoriesResult => {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const response = await repositories.list();
      setRepos(response.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to fetch repositories");
      console.error("Error fetching repositories:", err);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  const updateRepository = async (
    id: string,
    data: Partial<Repository>
  ): Promise<boolean> => {
    try {
      await repositories.update(id, data);
      return true;
    } catch (err) {
      console.error("Error updating repository:", err);
      return false;
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  return {
    repositories: repos,
    loading,
    error,
    refresh: fetchRepositories,
    refetch: fetchRepositories,
    updateRepository,
  };
};
