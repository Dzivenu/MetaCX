"use client";

import React from "react";
import { Select } from "@mantine/core";

export interface CustomerOption {
  value: string;
  label: string;
}

export function CustomerSelect({
  customers,
  value,
  onChange,
  loading,
}: {
  customers: CustomerOption[];
  value?: string;
  onChange: (value?: string) => void;
  loading?: boolean;
}) {
  return (
    <Select
      label="Customer"
      placeholder="Select a customer"
      data={customers}
      value={value || ""}
      onChange={(v) => onChange(v || undefined)}
      searchable
      nothingFoundMessage={loading ? "Loading..." : "No customers"}
    />
  );
}
