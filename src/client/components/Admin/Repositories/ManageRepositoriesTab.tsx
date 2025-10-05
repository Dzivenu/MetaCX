import { useEffect, useState } from "react";
import { LoadingOverlay, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import {
  useRepositories,
  type Repository,
} from "@/client/hooks/useRepositoriesConvex";
import { useCurrencies } from "@/client/hooks/useCurrenciesConvex";
import { RepositoryDataTable } from "./RepositoryDataTable";

export default function ManageRepositoriesTab({
  active,
  refreshSignal,
}: {
  active?: boolean;
  refreshSignal?: number;
}) {
  const { repositories, loading, error, refresh, updateRepository } =
    useRepositories();
  const { currencies } = useCurrencies();

  console.log(
    "🔍 ManageRepositoriesTab - loading:",
    loading,
    "error:",
    error,
    "repositories:",
    repositories,
    "currencies:",
    currencies
  );

  // Refresh when tab becomes active
  useEffect(() => {
    if (active) void refresh();
  }, [active]);

  // Refresh when an external signal changes
  useEffect(() => {
    if (typeof refreshSignal === "number") void refresh();
  }, [refreshSignal]);

  const handleSave = async (id: string, data: Partial<Repository>) => {
    const success = await updateRepository(id, data);
    if (success) {
      await refresh();
    }
    return success;
  };

  if (loading) {
    return (
      <div style={{ position: "relative", minHeight: "200px" }}>
        <LoadingOverlay visible />
      </div>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
        {error}
      </Alert>
    );
  }

  if (repositories.length === 0) {
    return (
      <Alert>
        No repositories found. Create a new repository to get started.
      </Alert>
    );
  }

  return (
    <RepositoryDataTable
      repositories={repositories}
      currencies={currencies}
      onUpdateRepository={handleSave}
      onRefresh={refresh}
    />
  );
}
