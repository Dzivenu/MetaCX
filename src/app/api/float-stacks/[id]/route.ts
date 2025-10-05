import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { GetFloatStackService } from "@/server/services/float-stack/get-float-stack.service";
import { UpdateFloatStackService } from "@/server/services/float-stack/update-float-stack.service";
import { DeleteFloatStackService } from "@/server/services/float-stack/delete-float-stack.service";

// GET /api/float-stacks/[id] - Get a specific float stack by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const service = new GetFloatStackService({ id });
    const { floatStack, error } = await service.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!floatStack) {
      return NextResponse.json(
        { error: "Float stack not found" },
        { status: 404 }
      );
    }

    // TODO: Check if the float stack belongs to a repository in the active organization

    return NextResponse.json({ data: floatStack }, { status: 200 });
  } catch (error) {
    console.error("Error fetching float stack:", error);
    return NextResponse.json(
      { error: "Failed to fetch float stack" },
      { status: 500 }
    );
  }
}

// PUT /api/float-stacks/[id] - Update a specific float stack
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      cxSessionId,
      repositoryId,
      denominationId,
      spentDuringCxSession,
      closeCount,
      lastCxSessionCount,
      previousCxSessionFloatStackId,
      denominatedValue,
      ticker,
      openSpot,
      closeSpot,
      transferredDuringCxSession,
    } = body;

    // Get the float stack first
    const getService = new GetFloatStackService({ id });
    const { floatStack: existingStack, error: getError } =
      await getService.call();

    if (getError) {
      return NextResponse.json({ error: getError }, { status: 500 });
    }

    if (!existingStack) {
      return NextResponse.json(
        { error: "Float stack not found" },
        { status: 404 }
      );
    }

    // TODO: Check if the float stack belongs to a repository in the active organization

    // Update the float stack
    const updateService = new UpdateFloatStackService({
      id,
      openCount,
      cxSessionId,
      repositoryId,
      denominationId,
      spentDuringCxSession,
      closeCount,
      lastCxSessionCount,
      previousCxSessionFloatStackId,
      denominatedValue,
      ticker,
      openSpot,
      closeSpot,
      transferredDuringCxSession,
    });

    const { floatStack, error } = await updateService.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!floatStack) {
      return NextResponse.json(
        { error: "Failed to update float stack" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: floatStack }, { status: 200 });
  } catch (error) {
    console.error("Error updating float stack:", error);
    return NextResponse.json(
      { error: "Failed to update float stack" },
      { status: 500 }
    );
  }
}

// DELETE /api/float-stacks/[id] - Delete a specific float stack
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Get the float stack first
    const getService = new GetFloatStackService({ id });
    const { floatStack: existingStack, error: getError } =
      await getService.call();

    if (getError) {
      return NextResponse.json({ error: getError }, { status: 500 });
    }

    if (!existingStack) {
      return NextResponse.json(
        { error: "Float stack not found" },
        { status: 404 }
      );
    }

    // TODO: Check if the float stack belongs to a repository in the active organization

    // Delete the float stack
    const deleteService = new DeleteFloatStackService({ id });
    const { success, error } = await deleteService.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete float stack" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Float stack deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting float stack:", error);
    return NextResponse.json(
      { error: "Failed to delete float stack" },
      { status: 500 }
    );
  }
}
