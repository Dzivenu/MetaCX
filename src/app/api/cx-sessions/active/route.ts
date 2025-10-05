import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { db } from "@/server/db";
import { cxSession, user } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/cx-sessions/active - Get the user's active CX session
export async function GET(request: NextRequest) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user's active CX session ID
    const userData = await db
      .select({
        activeCxSessionId: user.activeCxSessionId,
      })
      .from(user)
      .where(eq(user.id, sessionData.user.id))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const activeCxSessionId = userData[0].activeCxSessionId;

    if (!activeCxSessionId) {
      return NextResponse.json({ activeSession: null });
    }

    // Get the active CX session details
    const activeSession = await db
      .select({
        id: cxSession.id,
        status: cxSession.status,
        openStartDt: cxSession.openStartDt,
        openConfirmDt: cxSession.openConfirmDt,
        closeStartDt: cxSession.closeStartDt,
        closeConfirmDt: cxSession.closeConfirmDt,
        userId: cxSession.userId,
        organizationId: cxSession.organizationId,
        activeUserId: cxSession.activeUserId,
        authorizedUserIds: cxSession.authorizedUserIds,
        createdAt: cxSession.createdAt,
        updatedAt: cxSession.updatedAt,
      })
      .from(cxSession)
      .where(eq(cxSession.id, activeCxSessionId))
      .limit(1);

    if (activeSession.length === 0) {
      // Session doesn't exist anymore, clear it from user
      await db
        .update(user)
        .set({ activeCxSessionId: null })
        .where(eq(user.id, sessionData.user.id));

      return NextResponse.json({ activeSession: null });
    }

    // Verify user is authorized to access this session
    const session = activeSession[0];
    const authorizedUserIds = (session.authorizedUserIds as string[]) || [];
    
    if (!authorizedUserIds.includes(sessionData.user.id)) {
      // User is no longer authorized, clear their active session
      await db
        .update(user)
        .set({ activeCxSessionId: null })
        .where(eq(user.id, sessionData.user.id));

      return NextResponse.json({ activeSession: null });
    }

    return NextResponse.json({
      activeSession: session,
    });
  } catch (error) {
    console.error("Error getting active CX session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/cx-sessions/active - Clear the user's active CX session
export async function DELETE(request: NextRequest) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Clear the user's active CX session
    await db
      .update(user)
      .set({ activeCxSessionId: null })
      .where(eq(user.id, sessionData.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing active CX session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
