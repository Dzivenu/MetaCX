"use client";

import React, { useEffect } from "react";
import { LoadingOverlay, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useCurrencies, Currency } from "@/client/hooks/useCurrenciesConvex";
import { CurrencyDataTable } from "./CurrencyDataTable";

export default function ManageCurrenciesTab({
  active,
  refreshSignal,
}: {
  active?: boolean;
  refreshSignal?: number;
}) {
  const {
    currencies,
    loading,
    error,
    refresh,
    updateCurrency,
    deleteCurrency,
  } = useCurrencies();

  // Refresh when tab becomes active
  useEffect(() => {
    if (active) void refresh();
  }, [active]);

  // Refresh when an external signal changes
  useEffect(() => {
    if (typeof refreshSignal === "number") void refresh();
  }, [refreshSignal]);

  const handleUpdateCurrency = async (
    id: string,
    data: Partial<Currency>
  ): Promise<boolean> => {
    const result = await updateCurrency(id, data);
    return result !== null;
  };

  const handleDeleteCurrency = async (id: string): Promise<boolean> => {
    return await deleteCurrency(id);
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

  if (currencies.length === 0) {
    return (
      <Alert>No currencies found. Create a new currency to get started.</Alert>
    );
  }

  return (
    <CurrencyDataTable
      currencies={currencies}
      onUpdateCurrency={handleUpdateCurrency}
      onDeleteCurrency={handleDeleteCurrency}
      onRefresh={refresh}
    />
  );
}
