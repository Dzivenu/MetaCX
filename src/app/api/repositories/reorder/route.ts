import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { ReorderRepositoriesService } from "@/server/services/repository/reorder-repositories.service";

export async function POST(request: NextRequest) {
  try {
    const sessionData = await auth.api.getSession({ headers: request.headers });
    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeOrganizationId = sessionData.session.activeOrganizationId;
    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active organization selected" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const orderedRepositoryIds: string[] = Array.isArray(
      body?.orderedRepositoryIds
    )
      ? body.orderedRepositoryIds
      : [];

    const service = new ReorderRepositoriesService({
      organizationId: activeOrganizationId,
      orderedRepositoryIds,
    });
    const { success, error } = await service.call();
    if (!success) return NextResponse.json({ error }, { status: 400 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to reorder repositories" },
      { status: 500 }
    );
  }
}
