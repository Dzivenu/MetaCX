import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { db } from "@/server/db";
import { cxSession } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { CreateCxSessionService } from "@/server/services/cx-session/create-cx-session.service";

// GET /api/cx-sessions - Get CX sessions for the current user's active organization
export async function GET(request: NextRequest) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the active organization from the session
    const activeOrganizationId = sessionData.session.activeOrganizationId;

    // Debug logging
    console.log("🔍 GET /api/cx-sessions - Session data:", {
      sessionId: sessionData.session.id,
      userId: sessionData.user.id,
      activeOrganizationId,
      sessionCreatedAt: sessionData.session.createdAt,
      sessionUpdatedAt: sessionData.session.updatedAt,
    });

    if (!activeOrganizationId) {
      console.log("❌ No active organization ID found in CX sessions API");
      return NextResponse.json(
        { error: "No active organization selected" },
        { status: 400 }
      );
    }

    // Parse query parameters for pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: cxSession.id })
      .from(cxSession)
      .where(eq(cxSession.organizationId, activeOrganizationId));

    const total = totalCountResult.length;
    const totalPages = Math.ceil(total / limit);

    // Get CX sessions for the active organization with pagination
    const sessions = await db
      .select({
        id: cxSession.id,
        status: cxSession.status,
        openStartDt: cxSession.openStartDt,
        openConfirmDt: cxSession.openConfirmDt,
        closeStartDt: cxSession.closeStartDt,
        closeConfirmDt: cxSession.closeConfirmDt,
        activeUserId: cxSession.activeUserId,
        authorizedUserIds: cxSession.authorizedUserIds,
        createdAt: cxSession.createdAt,
        updatedAt: cxSession.updatedAt,
      })
      .from(cxSession)
      .where(eq(cxSession.organizationId, activeOrganizationId))
      .orderBy(desc(cxSession.createdAt))
      .limit(limit)
      .offset(offset);

    // Return data with pagination structure that matches client expectations
    return NextResponse.json({
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error getting CX sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/cx-sessions - Create a new CX session
export async function POST(request: NextRequest) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the active organization from the session
    const activeOrganizationId = sessionData.session.activeOrganizationId;

    // Debug logging
    console.log("🔍 POST /api/cx-sessions - Session data:", {
      sessionId: sessionData.session.id,
      userId: sessionData.user.id,
      activeOrganizationId,
      sessionCreatedAt: sessionData.session.createdAt,
      sessionUpdatedAt: sessionData.session.updatedAt,
    });

    if (!activeOrganizationId) {
      console.log("❌ No active organization ID found in CX sessions POST API");
      return NextResponse.json(
        { error: "No active organization selected" },
        { status: 400 }
      );
    }

    // Create the CX session using the service
    const createService = new CreateCxSessionService({
      userId: sessionData.user.id,
      organizationId: activeOrganizationId,
    });

    const result = await createService.call();

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      data: result.session,
      message: "CX session created successfully",
    });
  } catch (error) {
    console.error("Error creating CX session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
