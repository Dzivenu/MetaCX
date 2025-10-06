/**
 * Centralized API client utility that ensures all requests include authentication credentials
 * and handles common error scenarios like unauthorized responses.
 */

export interface ApiClientOptions extends RequestInit {
  // Additional timeout option for API calls
  timeout?: number;
}

/**
 * Enhanced fetch wrapper that automatically includes credentials and handles auth errors
 */
export async function apiClient(
  url: string | URL,
  options: ApiClientOptions = {}
): Promise<Response> {
  // Ensure credentials are always included
  const defaultOptions: RequestInit = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    // Handle unauthorized responses
    if (response.status === 401) {
      console.warn(
        "🔒 Unauthorized API response - user may need to re-authenticate"
      );

      // Optionally trigger a re-authentication flow
      // You could dispatch a Redux action here or emit an event
      if (typeof window !== "undefined") {
        // Session cleanup handled by Clerk
        // Redirect to login if needed
      }
    }

    return response;
  } catch (error) {
    console.error("🚨 API client error:", error);
    throw error;
  }
}

/**
 * Convenience method for GET requests
 */
export async function apiGet(
  url: string | URL,
  options: Omit<ApiClientOptions, "method" | "body"> = {}
) {
  return apiClient(url, { ...options, method: "GET" });
}

/**
 * Convenience method for POST requests
 */
export async function apiPost(
  url: string | URL,
  data?: unknown,
  options: Omit<ApiClientOptions, "method" | "body"> = {}
) {
  return apiClient(url, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Convenience method for PUT requests
 */
export async function apiPut(
  url: string | URL,
  data?: unknown,
  options: Omit<ApiClientOptions, "method" | "body"> = {}
) {
  return apiClient(url, {
    ...options,
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Convenience method for DELETE requests
 */
export async function apiDelete(
  url: string | URL,
  options: Omit<ApiClientOptions, "method" | "body"> = {}
) {
  return apiClient(url, { ...options, method: "DELETE" });
}
