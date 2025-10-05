import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { GetRepositoryService } from "@/server/services/repository/get-repository.service";
import { UpdateRepositoryService } from "@/server/services/repository/update-repository.service";
import { DeleteRepositoryService } from "@/server/services/repository/delete-repository.service";

// GET /api/repositories/[id] - Get a specific repository by ID
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
    const service = new GetRepositoryService({ id });
    const { repository, error } = await service.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    // Check if the repository belongs to the active organization
    if (repository.organizationId !== activeOrganizationId) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: repository }, { status: 200 });
  } catch (error) {
    console.error("Error fetching repository:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository" },
      { status: 500 }
    );
  }
}

// PUT /api/repositories/[id] - Update a specific repository
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
      name,
      typeOf,
      currencyType,
      form,
      key,
      floatThresholdBottom,
      floatThresholdTop,
      floatCountRequired,
      active,
      currencyTickers,
    } = body;

    // Get the repository first to check if it belongs to the active organization
    const getService = new GetRepositoryService({ id });
    const { repository: existingRepository, error: getError } =
      await getService.call();

    if (getError) {
      return NextResponse.json({ error: getError }, { status: 500 });
    }

    if (!existingRepository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    // Check if the repository belongs to the active organization
    if (existingRepository.organizationId !== activeOrganizationId) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    // Update the repository
    const updateService = new UpdateRepositoryService({
      id,
      name,
      typeOf,
      currencyType,
      form,
      key,
      floatThresholdBottom,
      floatThresholdTop,
      floatCountRequired,
      active,
      currencyTickers,
    });

    const { repository, error } = await updateService.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!repository) {
      return NextResponse.json(
        { error: "Failed to update repository" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: repository }, { status: 200 });
  } catch (error) {
    console.error("Error updating repository:", error);
    return NextResponse.json(
      { error: "Failed to update repository" },
      { status: 500 }
    );
  }
}

// DELETE /api/repositories/[id] - Delete a specific repository
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

    // Get the repository first to check if it belongs to the active organization
    const getService = new GetRepositoryService({ id });
    const { repository: existingRepository, error: getError } =
      await getService.call();

    if (getError) {
      return NextResponse.json({ error: getError }, { status: 500 });
    }

    if (!existingRepository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    // Check if the repository belongs to the active organization
    if (existingRepository.organizationId !== activeOrganizationId) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    // Delete the repository
    const deleteService = new DeleteRepositoryService({ id });
    const { success, error } = await deleteService.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete repository" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Repository deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting repository:", error);
    return NextResponse.json(
      { error: "Failed to delete repository" },
      { status: 500 }
    );
  }
}
