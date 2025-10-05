import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { GetAllRepositoryAccessLogsService } from "@/server/services/repository-access-log/get-all-repository-access-logs.service";
import { CreateRepositoryAccessLogService } from "@/server/services/repository-access-log/create-repository-access-log.service";

// GET /api/repository-access-logs - Get all repository access logs for a repository
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
    const repositoryId = searchParams.get('repositoryId');

    if (!repositoryId) {
      return NextResponse.json(
        { error: "Repository ID is required" },
        { status: 400 }
      );
    }

    // Get all repository access logs for the repository
    const service = new GetAllRepositoryAccessLogsService({ repositoryId: parseInt(repositoryId) });
    const { repositoryAccessLogs, error } = await service.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data: repositoryAccessLogs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching repository access logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository access logs" },
      { status: 500 }
    );
  }
}

// POST /api/repository-access-logs - Create a new repository access log
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
    const { repositoryId, sessionId, possessionAt, releaseAt, openStartAt, openConfirmAt, closeStartAt, closeConfirmAt, openStartUserId, openConfirmUserId, closeStartUserId, closeConfirmUserId } = body;

    // Validate required fields
    if (!repositoryId) {
      return NextResponse.json(
        { error: "Repository ID is required" },
        { status: 400 }
      );
    }

    // Create the repository access log
    const service = new CreateRepositoryAccessLogService({
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

    const { repositoryAccessLog, error } = await service.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!repositoryAccessLog) {
      return NextResponse.json(
        { error: "Failed to create repository access log" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: repositoryAccessLog }, { status: 201 });
  } catch (error) {
    console.error("Error creating repository access log:", error);
    return NextResponse.json(
      { error: "Failed to create repository access log" },
      { status: 500 }
    );
  }
}
