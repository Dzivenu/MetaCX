"use client";

import { useMemo } from "react";
import {
  Stack,
  Select,
  NumberInput,
} from "@mantine/core";
import { useCurrencies } from "@/client/hooks/useCurrenciesConvex";

export default function TransferStepOne({
  transferData,
  setTransferData,
  repositories,
}: any) {

  // Get organization's currencies
  const { currencies: orgCurrencies } = useCurrencies();

  const currencyTypeOptions = useMemo(() => {
    const types = [
      ...new Set(repositories.map((r: any) => r.type_of_currencies).filter(Boolean)),
    ] as string[];
    return types.map((type: string) => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
    }));
  }, [repositories]);

  const availableCurrencies = useMemo(() => {
    if (!transferData.currencyType || !orgCurrencies) return [];

    // Get currencies from organization that match the selected currency type
    const currencies = orgCurrencies
      .filter((currency: any) => {
        // Map currency type to the expected format
        const currencyType = currency.typeOf || currency.type_of || "fiat";
        return currencyType.toUpperCase() === transferData.currencyType.toUpperCase();
      })
      .map((currency: any) => ({
        value: currency.ticker,
        label: currency.ticker,
      }));

    return currencies;
  }, [orgCurrencies, transferData.currencyType]);

  const filteredRepos = useMemo(() => {
    if (!transferData.currencyType) return [];
    return repositories.filter(
      (repo: any) => repo.type_of_currencies === transferData.currencyType
    );
  }, [repositories, transferData.currencyType]);

  const repoOptions = filteredRepos
    .filter((r: any) => r.id) // Ensure repository has an ID
    .map((r: any) => ({
      value: r.id,
      label: r.name,
    }));

  const handleCurrencyTypeChange = (value: string | null) => {
    setTransferData({
      ...transferData,
      currencyType: value || "",
      ticker: "",
      sum: "", // Clear sum when currency type changes
      breakdowns: [],
    });
  };

  const handleTickerChange = (value: string | null) => {
    setTransferData({
      ...transferData,
      ticker: value || "",
      sum: "", // Clear sum when currency changes
      breakdowns: [],
    });
  };

  const handleSourceRepoChange = (value: string | null) => {
    setTransferData({
      ...transferData,
      sourceRepoId: value || "",
      // Keep sum when changing repositories
      breakdowns: [],
    });
  };

  const handleTargetRepoChange = (value: string | null) => {
    setTransferData({
      ...transferData,
      targetRepoId: value || "",
      // Keep sum when changing repositories
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
        label="Currency"
        placeholder="Select currency"
        data={availableCurrencies}
        value={transferData.ticker}
        onChange={handleTickerChange}
        disabled={!transferData.currencyType}
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

      <NumberInput
        label={`Transfer Amount (${transferData.ticker || 'Currency'})`}
        placeholder="Enter transfer amount"
        value={parseFloat(transferData.sum) || ""}
        onChange={(value) => {
          const numValue = typeof value === "number" ? value : parseFloat(value?.toString() || "0") || 0;
          setTransferData({
            ...transferData,
            sum: numValue.toString(),
            breakdowns: [], // Clear breakdowns when amount changes
          });
        }}
        min={0}
        decimalScale={2}
        disabled={!transferData.ticker}
        required
      />
    </Stack>
  );
}
