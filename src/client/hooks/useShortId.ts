import { useMemo } from 'react';

/**
 * Hook to generate a short ID from a long ID
 * @param id - The long ID to shorten
 * @param length - The desired length of the short ID (default: 8)
 * @param prefix - Optional prefix to add (default: none)
 * @returns Short ID string or null if no ID provided
 */
export function useShortId(
  id?: string | null, 
  length: number = 8, 
  prefix?: string
): string | null {
  return useMemo(() => {
    if (!id || typeof id !== 'string') {
      return null;
    }

    // For Convex IDs that typically start with a consistent pattern,
    // we'll take characters from different parts to ensure uniqueness
    let shortId: string;

    if (id.length <= length) {
      // If ID is already short enough, return as-is
      shortId = id;
    } else {
      // Take first 4 and last 4 characters for better uniqueness
      const halfLength = Math.floor(length / 2);
      const firstPart = id.substring(0, halfLength);
      const lastPart = id.substring(id.length - halfLength);
      shortId = firstPart + lastPart;
    }

    // Add prefix if provided
    if (prefix) {
      return `${prefix}${shortId}`;
    }

    return shortId;
  }, [id, length, prefix]);
}

/**
 * Convenience hook specifically for order IDs with # prefix
 */
export function useShortOrderId(orderId?: string | null): string | null {
  return useShortId(orderId, 8, '#');
}

/**
 * Convenience hook for customer IDs
 */
export function useShortCustomerId(customerId?: string | null): string | null {
  return useShortId(customerId, 6);
}

/**
 * Convenience hook for session IDs
 */
export function useShortSessionId(sessionId?: string | null): string | null {
  return useShortId(sessionId, 6);
}



