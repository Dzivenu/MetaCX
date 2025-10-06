import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

/**
 * GET /api/auth/use-active-organization
 *
 * This endpoint fetches the user's organizations from Convex/Clerk
 */
export async function GET(request: NextRequest) {
  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Get user's organizations from Convex/Clerk
    const organizations = await convex.action(
      api.actions.organizations.getUserOrganizationsFromClerk
    );

    if (!organizations || organizations.length === 0) {
      return NextResponse.json({ activeOrganization: null });
    }

    // For now, return the first organization as active
    // TODO: Implement proper active organization selection
    const activeOrg = organizations[0];

    return NextResponse.json({
      activeOrganization: {
        id: activeOrg.id,
        slug: activeOrg.slug,
        name: activeOrg.name,
      },
    });
  } catch (error) {
    console.error("Error fetching active organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/use-active-organization
 *
 * This endpoint sets the active organization using Convex/Clerk
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, organizationSlug } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Verify the organization exists and user has access
    const organizations = await convex.action(
      api.actions.organizations.getUserOrganizationsFromClerk
    );

    // Find the organization by ID or slug
    const targetOrg = organizations.find(
      (org) => org.id === organizationId || org.slug === organizationSlug
    );

    if (!targetOrg) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 404 }
      );
    }

    // TODO: Implement session management for active organization
    // For now, just return success
    return NextResponse.json({
      success: true,
      activeOrganization: {
        id: targetOrg.id,
        slug: targetOrg.slug,
        name: targetOrg.name,
      },
    });
  } catch (error) {
    console.error("Error setting active organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
