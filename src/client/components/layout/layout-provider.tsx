"use client";

import React from "react";
import { Header } from "./header";
import { AppFooter } from "./footer";

interface LayoutProviderProps {
  children: React.ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <AppFooter />
    </div>
  );
}
