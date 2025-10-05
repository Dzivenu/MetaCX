"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import {
  usePathname as useNextPathname,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
  useRouter as useNextRouter,
  redirect as nextRedirect,
  permanentRedirect as nextPermanentRedirect,
  notFound as nextNotFound,
} from "next/navigation";
import { NavigationProgress, nprogress } from "@mantine/nprogress";

interface RouterContextType {
  isRouteChanging: boolean;
  loadingKey: number;
  navigateTo: (path: string) => void;
  doNavigateBack: () => void;
  doReplace: (path: string) => void;
  doRefresh: () => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

interface RouterProviderProps {
  children: ReactNode;
}

export default function RouterProvider({ children }: RouterProviderProps) {
  const pathname = useNextPathname();
  const searchParams = useNextSearchParams();
  const nextRouter = useNextRouter();

  const [loadingKey, setLoadingKey] = useState(0);
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any existing timers when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Use useRef to track previous values to avoid infinite loops
  const prevPathnameRef = useRef(pathname);
  const prevSearchParamsRef = useRef(searchParams);

  useEffect(() => {
    const hasPathnameChanged = prevPathnameRef.current !== pathname;
    const hasSearchParamsChanged = prevSearchParamsRef.current !== searchParams;

    if (hasPathnameChanged || hasSearchParamsChanged) {
      setLoadingKey((prev) => prev + 1);
      // Update refs
      prevPathnameRef.current = pathname;
      prevSearchParamsRef.current = searchParams;
    }
  }, [pathname, searchParams]);

  // Complete progress when navigation finishes
  useEffect(() => {
    setIsRouteChanging(false);
    // Add a small delay to ensure the progress bar is visible
    const timer = setTimeout(() => {
      nprogress.complete();
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  const navigateTo = (path: string) => {
    setIsRouteChanging(true);
    nprogress.start();
    nextRouter.push(path);
  };

  const doNavigateBack = () => {
    setIsRouteChanging(true);
    nprogress.start();
    nextRouter.back();
  };

  const doReplace = (path: string) => {
    setIsRouteChanging(true);
    nprogress.start();
    nextRouter.replace(path);
  };

  const doRefresh = () => {
    setIsRouteChanging(true);
    nprogress.start();
    nextRouter.refresh();
  };

  const contextValue: RouterContextType = {
    isRouteChanging,
    loadingKey,
    navigateTo,
    doNavigateBack,
    doReplace,
    doRefresh,
  };

  return (
    <RouterContext.Provider value={contextValue}>
      <NavigationProgress />
      {children}
    </RouterContext.Provider>
  );
}

export function useAppRouter(): RouterContextType {
  const context = useContext(RouterContext);
  if (context === undefined) {
    throw new Error("useAppRouter must be used within a RouterProvider");
  }
  return context;
}

// Re-export all next/navigation items that don't need modification
export {
  useNextPathname as usePathname,
  useNextSearchParams as useSearchParams,
  useNextParams as useParams,
  nextRedirect as redirect,
  nextPermanentRedirect as permanentRedirect,
  nextNotFound as notFound,
};

// Re-export types
export type { ReadonlyURLSearchParams } from "next/navigation";

// Enhanced router hook that shows progress and integrates with context
export function useRouter() {
  const appRouter = useAppRouter();
  const nextRouter = useNextRouter();

  return {
    push: (href: string, options?: { scroll?: boolean }) => {
      appRouter.navigateTo(href);
    },
    replace: (href: string, options?: { scroll?: boolean }) => {
      appRouter.doReplace(href);
    },
    refresh: () => {
      appRouter.doRefresh();
    },
    back: () => {
      appRouter.doNavigateBack();
    },
    forward: () => {
      nprogress.start();
      nextRouter.forward();
    },
    prefetch: nextRouter.prefetch.bind(nextRouter),
  };
}
