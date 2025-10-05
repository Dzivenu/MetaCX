import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { db } from "@/server/db";
import { cxSession, user } from "@/server/db/schema";
import { eq } from "drizzle-orm";

// POST /api/cx-sessions/[sessionId]/leave - Leave a CX session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    // Get the session
    const session = await db.query.cxSession.findFirst({
      where: eq(cxSession.id, sessionId),
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if user is authorized to leave the session
    const authorizedUsers = session.authorizedUserIds || [];
    if (!authorizedUsers.includes(sessionData.user.id)) {
      return NextResponse.json(
        { error: "User is not authorized for this session" },
        { status: 403 }
      );
    }

    // Remove user from authorized users
    const updatedAuthorizedUsers = authorizedUsers.filter(
      (id: string) => id !== sessionData.user.id
    );

    // Update the session
    await db
      .update(cxSession)
      .set({
        authorizedUserIds: updatedAuthorizedUsers,
        updatedAt: new Date(),
      })
      .where(eq(cxSession.id, sessionId));

    // If this was the user's active session, clear it
    const userData = await db
      .select({ activeCxSessionId: user.activeCxSessionId })
      .from(user)
      .where(eq(user.id, sessionData.user.id))
      .limit(1);

    if (userData.length > 0 && userData[0].activeCxSessionId === sessionId) {
      await db
        .update(user)
        .set({ activeCxSessionId: null })
        .where(eq(user.id, sessionData.user.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving CX session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
