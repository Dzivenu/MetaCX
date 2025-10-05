"use client";

import { useAuth } from "@/client/hooks/useAuth";
import { AppLayout } from "./AppLayout";
import { GuestLayout } from "./GuestLayout";
import { ProtectedRouteLogin } from "@/client/components/auth/ProtectedRouteLogin";
import { usePathname } from "@/client/providers/router-provider";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/signup", "/reset-password"];

  // Auth form routes that should have minimal layout
  const authFormRoutes = ["/login", "/signup", "/reset-password"];

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthFormRoute = authFormRoutes.includes(pathname);

  // Loading is gated globally by AppStateProvider; no local spinner here

  // Use AppLayout for authenticated users
  if (isAuthenticated) {
    return <AppLayout>{children}</AppLayout>;
  }

  // For non-authenticated users
  if (isAuthFormRoute) {
    // Use minimal layout for auth forms
    return <>{children}</>;
  } else if (isPublicRoute) {
    // Use GuestLayout for public pages
    return <GuestLayout>{children}</GuestLayout>;
  } else {
    // For any other route, show inline sign-in instead of redirect
    return <ProtectedRouteLogin message="Please log in to access this page" />;
  }
}
