import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { JoinCxSessionService } from "@/server/services/cx-session/join-cx-session.service";

// POST /api/cx-sessions/[sessionId]/join - Join an existing CX session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
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

    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Join the CX session using the service
    const joinService = new JoinCxSessionService({
      sessionId,
      userId: sessionData.user.id,
    });

    const result = await joinService.call();

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      session: result.session,
      message: "Successfully joined CX session",
    });
  } catch (error) {
    console.error("Error joining CX session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
