import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { GetAllFloatStacksService } from "@/server/services/float-stack/get-all-float-stacks.service";
import { CreateFloatStackService } from "@/server/services/float-stack/create-float-stack.service";

// GET /api/float-stacks - Get all float stacks for a repository
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

    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active organization selected" },
        { status: 400 }
      );
    }

    // Get repositoryId from query parameters
    const { searchParams } = new URL(request.url);
    const repositoryId = searchParams.get("repositoryId");

    if (!repositoryId) {
      return NextResponse.json(
        { error: "Repository ID is required" },
        { status: 400 }
      );
    }

    // Get all float stacks for the repository
    const service = new GetAllFloatStacksService({
      repositoryId: parseInt(repositoryId),
    });
    const { floatStacks, error } = await service.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data: floatStacks }, { status: 200 });
  } catch (error) {
    console.error("Error fetching float stacks:", error);
    return NextResponse.json(
      { error: "Failed to fetch float stacks" },
      { status: 500 }
    );
  }
}

// POST /api/float-stacks - Create a new float stack
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

    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active organization selected" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      openCount,
      closeCount,
      middayCount,
      sessionId,
      repositoryId,
      denominationId,
      spentDuringSession,
      lastSessionCount,
      previousSessionFloatStackId,
      denominatedValue,
      ticker,
      openSpot,
      closeSpot,
      transferredDuringSession,
      openConfirmedDt,
      closeConfirmedDt,
    } = body;

    // Validate required fields
    if (!repositoryId) {
      return NextResponse.json(
        { error: "Repository ID is required" },
        { status: 400 }
      );
    }

    // Create the float stack
    const service = new CreateFloatStackService({
      openCount,
      closeCount,
      middayCount,
      sessionId,
      repositoryId,
      denominationId,
      spentDuringSession,
      lastSessionCount,
      previousSessionFloatStackId,
      denominatedValue,
      ticker,
      openSpot,
      closeSpot,
      transferredDuringSession,
      openConfirmedDt,
      closeConfirmedDt,
    });

    const { floatStack, error } = await service.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!floatStack) {
      return NextResponse.json(
        { error: "Failed to create float stack" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: floatStack }, { status: 201 });
  } catch (error) {
    console.error("Error creating float stack:", error);
    return NextResponse.json(
      { error: "Failed to create float stack" },
      { status: 500 }
    );
  }
}
