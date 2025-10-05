"use client";

import { type ReactNode } from "react";
import {
  MantineProvider as MantineUIProvider,
  createTheme,
} from "@mantine/core";

// Import Mantine styles
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/spotlight/styles.css";
import "@mantine/nprogress/styles.css";
import "mantine-datatable/styles.css";

// Create Mantine theme
const theme = createTheme({
  /** Put your mantine theme override here */
  primaryColor: "blue",
  defaultRadius: "lg",
});

// Main Providers Wrapper
interface MantineProviderProps {
  children: ReactNode;
  themeMode?: string;
}

export function MantineProvider({
  children,
  themeMode = "light",
}: MantineProviderProps) {
  return (
    <MantineUIProvider
      theme={theme}
      defaultColorScheme={themeMode as "light" | "dark"}
    >
      {children}
    </MantineUIProvider>
  );
}
