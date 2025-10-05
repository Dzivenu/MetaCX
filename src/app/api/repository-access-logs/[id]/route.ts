import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { GetRepositoryAccessLogService } from "@/server/services/repository-access-log/get-repository-access-log.service";
import { UpdateRepositoryAccessLogService } from "@/server/services/repository-access-log/update-repository-access-log.service";
import { DeleteRepositoryAccessLogService } from "@/server/services/repository-access-log/delete-repository-access-log.service";

// GET /api/repository-access-logs/[id] - Get a specific repository access log by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const service = new GetRepositoryAccessLogService({ id });
    const { repositoryAccessLog, error } = await service.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!repositoryAccessLog) {
      return NextResponse.json(
        { error: "Repository access log not found" },
        { status: 404 }
      );
    }

    // TODO: Check if the repository access log belongs to a repository in the active organization
    // This would require fetching the repository and checking its organizationId

    return NextResponse.json({ data: repositoryAccessLog }, { status: 200 });
  } catch (error) {
    console.error("Error fetching repository access log:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository access log" },
      { status: 500 }
    );
  }
}

// PUT /api/repository-access-logs/[id] - Update a specific repository access log
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
      repositoryId,
      sessionId,
      possessionAt,
      releaseAt,
      openStartAt,
      openConfirmAt,
      closeStartAt,
      closeConfirmAt,
      openStartUserId,
      openConfirmUserId,
      closeStartUserId,
      closeConfirmUserId,
    } = body;

    // Get the repository access log first
    const getService = new GetRepositoryAccessLogService({ id });
    const { repositoryAccessLog: existingLog, error: getError } =
      await getService.call();

    if (getError) {
      return NextResponse.json({ error: getError }, { status: 500 });
    }

    if (!existingLog) {
      return NextResponse.json(
        { error: "Repository access log not found" },
        { status: 404 }
      );
    }

    // TODO: Check if the repository access log belongs to a repository in the active organization

    // Update the repository access log
    const updateService = new UpdateRepositoryAccessLogService({
      id,
      repositoryId,
      sessionId,
      possessionAt,
      releaseAt,
      openStartAt,
      openConfirmAt,
      closeStartAt,
      closeConfirmAt,
      openStartUserId,
      openConfirmUserId,
      closeStartUserId,
      closeConfirmUserId,
    });

    const { repositoryAccessLog, error } = await updateService.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!repositoryAccessLog) {
      return NextResponse.json(
        { error: "Failed to update repository access log" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: repositoryAccessLog }, { status: 200 });
  } catch (error) {
    console.error("Error updating repository access log:", error);
    return NextResponse.json(
      { error: "Failed to update repository access log" },
      { status: 500 }
    );
  }
}

// DELETE /api/repository-access-logs/[id] - Delete a specific repository access log
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Get the repository access log first
    const getService = new GetRepositoryAccessLogService({ id });
    const { repositoryAccessLog: existingLog, error: getError } =
      await getService.call();

    if (getError) {
      return NextResponse.json({ error: getError }, { status: 500 });
    }

    if (!existingLog) {
      return NextResponse.json(
        { error: "Repository access log not found" },
        { status: 404 }
      );
    }

    // TODO: Check if the repository access log belongs to a repository in the active organization

    // Delete the repository access log
    const deleteService = new DeleteRepositoryAccessLogService({
      id,
    });
    const { success, error } = await deleteService.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete repository access log" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Repository access log deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting repository access log:", error);
    return NextResponse.json(
      { error: "Failed to delete repository access log" },
      { status: 500 }
    );
  }
}
