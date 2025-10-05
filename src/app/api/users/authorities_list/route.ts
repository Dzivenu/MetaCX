import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { organization } from "@/server/db/schema/better-auth-schema";
import { repository } from "@/server/db/schema";
import { auth } from "@/server/db/better-auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

// GET /api/users/authorities_list - Get available roles and repositories
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the active organization from the session
    const activeOrganizationId = session.session.activeOrganizationId;

    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active organization selected" },
        { status: 400 }
      );
    }

    // Get all repositories for the active organization
    const repositories = await db
      .select({
        id: repository.id,
        name: repository.name,
        typeOf: repository.typeOf,
        currencyType: repository.currencyType,
        active: repository.active,
      })
      .from(repository)
      .where(eq(repository.organizationId, activeOrganizationId));



    const repoNameIds = repositories.map(repo => ({
      name: repo.name,
      id: repo.id,
      typeOf: repo.typeOf,
      currencyType: repo.currencyType,
      active: repo.active,
    }));

    return NextResponse.json({
      repo_name_ids: repoNameIds,
    });
  } catch (error) {
    console.error("Error fetching authorities:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}