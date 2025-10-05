"use client";

interface AppViewTransitionProps {
  children: React.ReactNode;
}

export function AppViewTransition({ children }: AppViewTransitionProps) {
  // For now, this component just renders children without any transition effects
  // Future implementation can include view transition animations
  return <>{children}</>;
}