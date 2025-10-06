import { auth } from "@/server/db/better-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  user as userTable,
  member as memberTable,
  organization as organizationTable,
} from "@/server/db/schema/better-auth-schema";
import { and, eq, sql } from "drizzle-orm";

/**
 * GET /api/auth/use-active-organization
 *
 * This endpoint is called by better-auth's useActiveOrganization hook
 * to fetch the current active organization for the user session.
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session from better-auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the active organization from the session
    // TODO: Implement proper organization selection in session
    const activeOrganizationId = session.user.id || null;

    if (!activeOrganizationId) {
      // No active organization set in session; try to restore from persisted user record
      const dbUser = await db.query.user.findFirst({
        where: eq(userTable.id, session.user.id),
      });

      const persistedOrgId = (dbUser?.lastActiveOrganizationId ?? null) as
        | string
        | null;

      if (!persistedOrgId) {
        return NextResponse.json({ activeOrganization: null });
      }

      // Verify user is still a member of the persisted organization
      const membership = await db
        .select({ id: memberTable.id })
        .from(memberTable)
        .where(
          and(
            eq(memberTable.userId, session.user.id),
            eq(memberTable.organizationId, persistedOrgId)
          )
        );

      if (!membership.length) {
        return NextResponse.json({ activeOrganization: null });
      }

      // TODO: Implement proper organization listing when organizations table is created
      // For now, return a mock organization if one is persisted
      const organizations = persistedOrgId
        ? [
            {
              id: persistedOrgId,
              slug: persistedOrgId,
              name: "Default Organization",
            },
          ]
        : [];

      const activeOrg = organizations.find((org) => org.id === persistedOrgId);

      if (!activeOrg) {
        return NextResponse.json({ activeOrganization: null });
      }

      // Inform the client that it should update the session to this org
      return NextResponse.json({
        activeOrganization: activeOrg,
        shouldSetSession: true,
      });
    }

    // Fetch the organization details from database
    const userMemberships = await db
      .select({
        organizationId: memberTable.organizationId,
        role: memberTable.role,
      })
      .from(memberTable)
      .where(eq(memberTable.userId, session.user.id));

    const organizationIds = userMemberships.map((m) => m.organizationId);

    const organizations =
      organizationIds.length > 0
        ? await db
            .select({
              id: organizationTable.id,
              slug: organizationTable.slug,
              name: organizationTable.name,
            })
            .from(organizationTable)
            .where(sql`${organizationTable.id} IN ${organizationIds}`)
        : [];

    // Find the active organization
    const activeOrg = organizations.find(
      (org) => org.id === activeOrganizationId
    );

    if (!activeOrg) {
      // Active organization not found, clear it
      return NextResponse.json({ activeOrganization: null });
    }

    return NextResponse.json({ activeOrganization: activeOrg });
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
 * This endpoint is called by better-auth's organization.setActive method
 * to set the active organization for the user session.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, organizationSlug } = body;

    // Get the session from better-auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If organizationId is null, clear the active organization
    if (organizationId === null) {
      // Better Auth will handle the session update automatically
      // Also clear persisted last active organization on the user record
      await db
        .update(userTable)
        .set({ lastActiveOrganizationId: null, updatedAt: new Date() })
        .where(eq(userTable.id, session.user.id));

      return NextResponse.json({ success: true, activeOrganization: null });
    }

    // Verify the organization exists and user has access
    const userMemberships = await db
      .select({
        organizationId: memberTable.organizationId,
        role: memberTable.role,
      })
      .from(memberTable)
      .where(eq(memberTable.userId, session.user.id));

    const organizationIds = userMemberships.map((m) => m.organizationId);

    const organizations =
      organizationIds.length > 0
        ? await db
            .select({
              id: organizationTable.id,
              slug: organizationTable.slug,
              name: organizationTable.name,
            })
            .from(organizationTable)
            .where(sql`${organizationTable.id} IN ${organizationIds}`)
        : [];

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

    // Better Auth will handle the session update automatically
    // Persist the active organization on the user record for future sessions
    await db
      .update(userTable)
      .set({ lastActiveOrganizationId: targetOrg.id, updatedAt: new Date() })
      .where(eq(userTable.id, session.user.id));

    return NextResponse.json({
      success: true,
      activeOrganization: targetOrg,
    });
  } catch (error) {
    console.error("Error setting active organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
