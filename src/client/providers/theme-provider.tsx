"use client";

import { type ReactNode } from "react";
import { MantineColorSchemeManager, localStorageColorSchemeManager } from "@mantine/core";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
}

const colorSchemeManager: MantineColorSchemeManager = localStorageColorSchemeManager({
  key: 'mantine-color-scheme',
});

export function ThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {
  return (
    <>
      {children}
    </>
  );
}

export default ThemeProvider;
