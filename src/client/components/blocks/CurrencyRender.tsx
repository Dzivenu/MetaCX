"use client";

import React from "react";
import { Avatar, Group, Text, MantineSize } from "@mantine/core";

export interface CurrencyRenderProps {
  ticker: string;
  name: string;
  /** Controls avatar and text sizing */
  size?: MantineSize | number;
}

function getTextSizes(size?: MantineSize | number): { title: string; subtitle: string } {
  if (typeof size === "number") return { title: "sm", subtitle: "xs" };
  switch (size) {
    case "xs":
      return { title: "xs", subtitle: "xs" };
    case "sm":
      return { title: "sm", subtitle: "xs" };
    case "lg":
      return { title: "md", subtitle: "sm" };
    case "xl":
      return { title: "lg", subtitle: "sm" };
    case "md":
    default:
      return { title: "sm", subtitle: "xs" };
  }
}

export const CurrencyRender: React.FC<CurrencyRenderProps> = ({ ticker, name, size = "md" }) => {
  const initials = (ticker || name || "?").toUpperCase().slice(0, 3);
  const textSizes = getTextSizes(size);

  return (
    <Group gap="sm" align="center" wrap="nowrap">
      {/* Avatar uses ticker text as placeholder, no actual image */}
      <Avatar
        size={size}
        radius="sm"
        color="initials"
        name={ticker || name}
        src={null}
        alt={name}
        title={name}
      >
        {initials}
      </Avatar>

      <div style={{ minWidth: 0 }}>
        <Text size={textSizes.title} fw={600} style={{ lineHeight: 1.2 }} truncate>
          {name}
        </Text>
        <Text size={textSizes.subtitle} c="dimmed" style={{ lineHeight: 1 }} truncate>
          {ticker?.toUpperCase()}
        </Text>
      </div>
    </Group>
  );
};

export default CurrencyRender;
