"use client";

import { useMemo } from "react";
import { Stack, Select, TextInput } from "@mantine/core";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function TransferStepOne({
  transferData,
  setTransferData,
  repositories,
}: any) {
  const currencyTypeOptions = useMemo(() => {
    const types = [
      ...new Set(repositories.map((r: any) => r.type_of_currencies).filter(Boolean)),
    ] as string[];
    return types.map((type: string) => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
    }));
  }, [repositories]);

  const filteredRepos = useMemo(() => {
    if (!transferData.currencyType) return [];
    return repositories.filter(
      (r: any) => r.type_of_currencies === transferData.currencyType
    );
  }, [repositories, transferData.currencyType]);

  const repoOptions = filteredRepos
    .filter((r: any) => r._id) // Ensure repository has an ID
    .map((r: any) => ({
      value: r._id,
      label: r.name,
    }));

  const availableTickers = useMemo(() => {
    if (!transferData.sourceRepoId || !transferData.targetRepoId) return [];

    const sourceRepo = repositories.find(
      (r: any) => r._id === transferData.sourceRepoId
    );
    const targetRepo = repositories.find(
      (r: any) => r._id === transferData.targetRepoId
    );

    if (!sourceRepo || !targetRepo) return [];

    const sourceCurrencies = sourceRepo.float || [];
    const targetCurrencies = targetRepo.float || [];

    const sourceTickers = sourceCurrencies.map((c: any) => c.ticker);
    const targetTickers = targetCurrencies.map((c: any) => c.ticker);

    const commonTickers = sourceTickers.filter((ticker: string) =>
      targetTickers.includes(ticker)
    );

    return commonTickers.map((ticker: string) => ({
      value: ticker,
      label: ticker,
    }));
  }, [repositories, transferData.sourceRepoId, transferData.targetRepoId]);

  const handleCurrencyTypeChange = (value: string | null) => {
    setTransferData({
      ...transferData,
      currencyType: value || "",
      sourceRepoId: "",
      targetRepoId: "",
      ticker: "",
      sum: "",
      breakdowns: [],
    });
  };

  const handleSourceRepoChange = (value: string | null) => {
    setTransferData({
      ...transferData,
      sourceRepoId: (value as Id<"org_repositories">) || "",
      ticker: "",
      sum: "",
      breakdowns: [],
    });
  };

  const handleTargetRepoChange = (value: string | null) => {
    setTransferData({
      ...transferData,
      targetRepoId: (value as Id<"org_repositories">) || "",
      ticker: "",
      sum: "",
      breakdowns: [],
    });
  };

  const handleTickerChange = (value: string | null) => {
    setTransferData({
      ...transferData,
      ticker: value || "",
      breakdowns: [],
    });
  };

  return (
    <Stack gap="md" mt="md">
      <Select
        label="Currency Type"
        placeholder="Select currency type"
        data={currencyTypeOptions as any}
        value={transferData.currencyType}
        onChange={handleCurrencyTypeChange}
        required
      />

      <Select
        label="Source Repository"
        placeholder="Select source repository"
        data={repoOptions}
        value={transferData.sourceRepoId}
        onChange={handleSourceRepoChange}
        disabled={!transferData.currencyType}
        required
      />

      <Select
        label="Target Repository"
        placeholder="Select target repository"
        data={repoOptions}
        value={transferData.targetRepoId}
        onChange={handleTargetRepoChange}
        disabled={!transferData.currencyType}
        required
      />

      <Select
        label="Currency"
        placeholder="Select currency"
        data={availableTickers}
        value={transferData.ticker}
        onChange={handleTickerChange}
        disabled={!transferData.sourceRepoId || !transferData.targetRepoId}
        required
      />
    </Stack>
  );
}
