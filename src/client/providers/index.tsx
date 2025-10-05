"use client";

import { type ReactNode } from "react";
import { Notifications } from "@mantine/notifications";
import { MantineProvider } from "./mantine-provider";
import { ThemeProvider } from "./theme-provider";
import { ReactQueryProvider } from "./query-provider";
import { ConvexClientProvider } from "./convex-provider";
import { ReduxStoreProvider } from "./redux-provider";
import { ToastProvider } from "./toast-provider";
import RouterProvider from "./router-provider";
import { MainLayout } from "@/client/components/layout/MainLayout";

import { ActiveOrganizationProvider } from "./ActiveOrganizationProvider";
import { ActiveSessionProvider } from "./ActiveSessionProvider";
import { AppStateProvider } from "./AppStateProvider";

// Main Providers Wrapper
interface ProvidersProps {
  children: ReactNode;
  theme?: string;
}

export function Providers({
  children,
  theme: themeMode = "light",
}: ProvidersProps) {
  return (
    <MantineProvider themeMode={themeMode}>
      <Notifications />
      <ThemeProvider defaultTheme={themeMode}>
        <ConvexClientProvider>
          <RouterProvider>
            <ReduxStoreProvider>
              <ReactQueryProvider>
                <ToastProvider>
                  <ActiveOrganizationProvider>
                    <ActiveSessionProvider>
                      <AppStateProvider>
                        <MainLayout>{children}</MainLayout>
                      </AppStateProvider>
                    </ActiveSessionProvider>
                  </ActiveOrganizationProvider>
                </ToastProvider>
              </ReactQueryProvider>
            </ReduxStoreProvider>
          </RouterProvider>
        </ConvexClientProvider>
      </ThemeProvider>
    </MantineProvider>
  );
}

// Export individual providers for flexibility
export {
  ThemeProvider,
  ReactQueryProvider,
  ConvexClientProvider,
  ReduxStoreProvider,
  ToastProvider,
};

// Export ActiveOrganizationProvider
export {
  ActiveOrganizationProvider,
  useActiveOrganizationContext,
  ActiveOrganizationContext,
} from "./ActiveOrganizationProvider";

// Export ActiveSessionProvider
export {
  ActiveSessionProvider,
  useActiveSessionContext,
  ActiveSessionContext,
} from "./ActiveSessionProvider";

// Export AppStateProvider and hook
export { AppStateProvider } from "./AppStateProvider";
export { useAppState } from "./AppStateProvider";

// Export provider components directly

// Default export is the main Providers component
export default Providers;
