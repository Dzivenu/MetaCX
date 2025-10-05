import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { GetRepositoryFloatService } from "@/server/services/float/get-repository-float.service";
import { UpdateRepositoryFloatService } from "@/server/services/float/update-repository-float.service";
import { ValidateRepositoryFloatService } from "@/server/services/float/validate-repository-float.service";

// GET /api/repositories/[id]/float - Get float data for a repository
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: repositoryId } = await params;
    
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    };
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const service = new GetRepositoryFloatService({ repositoryId, sessionId });
    const result = await service.call();

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching repository float:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository float" },
      { status: 500 }
    );
  }
}

// PUT /api/repositories/[id]/float - Update float stacks for a repository
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: repositoryId } = await params;
    
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    };
    const body = await request.json();
    const { sessionId, floatStacks } = body;

    if (!sessionId || !floatStacks) {
      return NextResponse.json(
        { error: "Session ID and float stacks are required" },
        { status: 400 }
      );
    }

    const service = new UpdateRepositoryFloatService({
      repositoryId,
      sessionId,
      floatStacks,
      userId: sessionData.user.id,
    });
    const result = await service.call();

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data }, { status: 200 });
  } catch (error) {
    console.error("Error updating repository float:", error);
    return NextResponse.json(
      { error: "Failed to update repository float" },
      { status: 500 }
    );
  }
}

// POST /api/repositories/[id]/float - Validate and complete repository float
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: repositoryId } = await params;
    
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    };
    const body = await request.json();
    const { sessionId, action } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const service = new ValidateRepositoryFloatService({
      repositoryId,
      sessionId,
      action,
      userId: sessionData.user.id,
    });
    const result = await service.call();

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data }, { status: 200 });
  } catch (error) {
    console.error("Error validating repository float:", error);
    return NextResponse.json(
      { error: "Failed to validate repository float" },
      { status: 500 }
    );
  }
}
