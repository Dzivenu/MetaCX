"use client";

import React from "react";
import { Alert, Collapse, Group, ActionIcon, Text, Badge } from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconAlertTriangle,
  IconInfoCircle,
} from "@tabler/icons-react";

interface Warning {
  type: "warning" | "info" | "error";
  currency: string;
  message: string;
}

interface WarningsSectionProps {
  expanded: boolean;
  onToggle: () => void;
  warnings: Warning[];
}

export function WarningsSection({
  expanded,
  onToggle,
  warnings,
}: WarningsSectionProps) {
  if (warnings.length === 0) return null;

  const getWarningIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <IconAlertTriangle size={16} />;
      case "error":
        return <IconAlertTriangle size={16} />;
      case "info":
        return <IconInfoCircle size={16} />;
      default:
        return <IconAlertTriangle size={16} />;
    }
  };

  const getWarningColor = (type: string) => {
    switch (type) {
      case "warning":
        return "yellow";
      case "error":
        return "red";
      case "info":
        return "blue";
      default:
        return "yellow";
    }
  };

  const getCurrencyIcon = (currency: string) => {
    const icons: Record<string, string> = {
      BTC: "₿",
      ETH: "Ξ",
      CAD: "🇨🇦",
      USD: "🇺🇸",
    };
    return icons[currency] || "💰";
  };

  return (
    <Alert color="yellow" className="bg-yellow-900/20 border-yellow-600">
      <Group
        justify="space-between"
        align="center"
        className="cursor-pointer"
        onClick={onToggle}
      >
        <Group gap="sm">
          <IconAlertTriangle size={20} className="text-yellow-400" />
          <Text size="lg" className="text-yellow-100 font-medium">
            Warnings
          </Text>
        </Group>
        <ActionIcon variant="transparent" size="sm">
          {expanded ? (
            <IconChevronUp size={16} className="text-yellow-400" />
          ) : (
            <IconChevronDown size={16} className="text-yellow-400" />
          )}
        </ActionIcon>
      </Group>

      <Collapse in={expanded}>
        <div className="mt-4 space-y-3">
          {warnings.map((warning, index) => (
            <Group key={index} gap="md" align="flex-start">
              <Badge
                leftSection={getCurrencyIcon(warning.currency)}
                color={getWarningColor(warning.type)}
                variant="light"
                size="lg"
              >
                {warning.currency} {warning.currency}
              </Badge>
              <div className="flex-1">
                <Text size="sm" className="text-yellow-100">
                  • {warning.message}
                </Text>
              </div>
            </Group>
          ))}
        </div>
      </Collapse>
    </Alert>
  );
}

