"use client";

import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/client/store";
import { type ReactNode } from "react";

// Redux Provider
interface ReduxStoreProviderProps {
  children: ReactNode;
}

export function ReduxStoreProvider({ children }: ReduxStoreProviderProps) {
  return <ReduxProvider store={store}>{children}</ReduxProvider>;
}

export default ReduxStoreProvider;
