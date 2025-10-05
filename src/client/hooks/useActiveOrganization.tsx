"use client";

import { useActiveOrganizationContext } from '@/client/providers';

/**
 * Hook to manage active organization using the ActiveOrganizationProvider context.
 * This provides a centralized way to manage active organization state.
 */
export function useActiveOrganization() {
  return useActiveOrganizationContext();
}
