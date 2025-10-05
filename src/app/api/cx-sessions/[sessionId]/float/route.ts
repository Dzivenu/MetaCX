import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { GetSessionFloatService } from "@/server/services/float/get-session-float.service";
import { StartFloatService } from "@/server/services/float/start-float.service";
import { ConfirmFloatService } from "@/server/services/float/confirm-float.service";
import { CloseFloatService } from "@/server/services/float/close-float.service";

// GET /api/cx-sessions/[sessionId]/float - Get float data for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const service = new GetSessionFloatService({ sessionId });
    const result = await service.call();

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching session float:", error);
    return NextResponse.json(
      { error: "Failed to fetch session float" },
      { status: 500 }
    );
  }
}

// POST /api/cx-sessions/[sessionId]/float - Manage float operations
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { action } = body;

    let service;
    let result;

    switch (action) {
      case "START_OPEN":
        service = new StartFloatService({
          sessionId,
          userId: sessionData.user.id,
          action: "OPEN",
        });
        result = await service.call();
        break;

      case "CONFIRM_OPEN":
        service = new ConfirmFloatService({
          sessionId,
          userId: sessionData.user.id,
          action: "OPEN",
        });
        result = await service.call();
        break;

      case "START_CLOSE":
        service = new StartFloatService({
          sessionId,
          userId: sessionData.user.id,
          action: "CLOSE",
        });
        result = await service.call();
        break;

      case "CONFIRM_CLOSE":
        service = new CloseFloatService({
          sessionId,
          userId: sessionData.user.id,
        });
        result = await service.call();
        break;

      case "CANCEL_CLOSE":
        service = new StartFloatService({
          sessionId,
          userId: sessionData.user.id,
          action: "CANCEL_CLOSE",
        });
        result = await service.call();
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data }, { status: 200 });
  } catch (error) {
    console.error("Error managing float:", error);
    return NextResponse.json(
      { error: "Failed to manage float" },
      { status: 500 }
    );
  }
}
