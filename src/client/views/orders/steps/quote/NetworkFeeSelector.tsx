"use client";

import React, { useState } from "react";
import { Group, Button, Text, Box } from "@mantine/core";

type NetworkFeeType = "Custom" | "Slow" | "Regular" | "Fast" | "Batched";

export function NetworkFeeSelector() {
  const [selectedFeeType, setSelectedFeeType] =
    useState<NetworkFeeType>("Regular");

  const feeOptions: {
    type: NetworkFeeType;
    label: string;
    description: string;
  }[] = [
    { type: "Custom", label: "Custom", description: "Set your own fee" },
    { type: "Slow", label: "Slow: 1 Sats/Byte", description: "Lower priority" },
    {
      type: "Regular",
      label: "Regular: 1 Sats/B...",
      description: "Standard processing",
    },
    {
      type: "Fast",
      label: "Fast: 1 Sats/Byte",
      description: "Higher priority",
    },
    { type: "Batched", label: "Batched", description: "Batch processing" },
  ];

  const getButtonVariant = (feeType: NetworkFeeType) => {
    return selectedFeeType === feeType ? "filled" : "outline";
  };

  const getButtonColor = (feeType: NetworkFeeType) => {
    if (selectedFeeType === feeType) {
      return feeType === "Regular" ? "orange" : "gray";
    }
    return "gray";
  };

  return (
    <Box>
      <Group gap="xs" align="center" className="mb-4">
        <Text size="sm" className="text-gray-400">
          Network fee type:
        </Text>
      </Group>

      <Group gap="xs" wrap="nowrap">
        {feeOptions.map((option) => (
          <Button
            key={option.type}
            variant={getButtonVariant(option.type)}
            color={getButtonColor(option.type)}
            size="sm"
            onClick={() => setSelectedFeeType(option.type)}
            className={`
              flex-1 min-w-0 h-auto py-3
              ${
                selectedFeeType === option.type
                  ? option.type === "Regular"
                    ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                    : "bg-gray-600 hover:bg-gray-700 text-white border-gray-600"
                  : "bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
              }
            `}
            styles={{
              root: {
                borderRadius: "6px",
                transition: "all 0.2s ease",
              },
              inner: {
                flexDirection: "column" as const,
                gap: "2px",
              },
            }}
          >
            <Text size="xs" className="font-medium truncate max-w-full">
              {option.label}
            </Text>
          </Button>
        ))}
      </Group>
    </Box>
  );
}

