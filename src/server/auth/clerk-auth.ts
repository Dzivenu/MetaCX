import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  // TODO: Add organization data when implementing organization management
  activeOrganizationId?: string;
}

export interface AuthSession {
  user: AuthenticatedUser;
  userId: string;
  // TODO: Add organization session data
  activeOrganizationId?: string;
}

/**
 * Server-side authentication utility using Clerk
 * Replaces better-auth.api.getSession()
 */
export async function getClerkSession(): Promise<{ session: AuthSession | null; user: AuthenticatedUser | null }> {
  try {
    const { userId, sessionId } = await auth();
    
    if (!userId || !sessionId) {
      return { session: null, user: null };
    }

    // TODO: Fetch user details from Convex instead of hardcoding
    // For now, create a basic user object with Clerk data
    const user: AuthenticatedUser = {
      id: userId,
      email: "user@example.com", // TODO: Get from Clerk or Convex
      name: "User", // TODO: Get from Clerk or Convex
      // TODO: activeOrganizationId when implementing organization management
    };

    const session: AuthSession = {
      user,
      userId,
      // TODO: activeOrganizationId when implementing organization management
    };

    return { session, user };
  } catch (error) {
    console.error("Error getting Clerk session:", error);
    return { session: null, user: null };
  }
}

/**
 * Authentication middleware for API routes
 * Returns 401 if not authenticated, returns session data if authenticated
 */
export async function requireAuth(): Promise<{ session: AuthSession; user: AuthenticatedUser } | Response> {
  const { session, user } = await getClerkSession();
  
  if (!session || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  return { session, user };
}

/**
 * Authentication middleware that also requires active organization
 * Returns 401 if not authenticated, 400 if no active organization
 */
export async function requireAuthWithOrganization(): Promise<
  { session: AuthSession; user: AuthenticatedUser; organizationId: string } | Response
> {
  const authResult = await requireAuth();
  
  if (authResult instanceof Response) {
    return authResult; // Return 401 response
  }
  
  const { session, user } = authResult;
  
  if (!session.activeOrganizationId) {
    return Response.json(
      { error: "No active organization selected" },
      { status: 400 }
    );
  }
  
  return {
    session,
    user,
    organizationId: session.activeOrganizationId,
  };
}

/**
 * Extract Clerk session from request headers (for Hono routes)
 */
export async function getClerkSessionFromHeaders(headers: Headers): Promise<{ session: AuthSession | null; user: AuthenticatedUser | null }> {
  // This is a simplified approach - in a real implementation, you might need to:
  // 1. Extract the session token from headers
  // 2. Verify it with Clerk
  // 3. Get user data from Convex
  
  // For now, fall back to the standard auth() function
  return getClerkSession();
}
