import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { db } from "@/server/db";
import { repository, user, member } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/repositories/[id]/users - Get authorized users for a repository
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view repository users
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    const currentUserMemberships = await db
      .select({
        organizationId: member.organizationId,
        role: member.role,
      })
      .from(member)
      .where(eq(member.userId, session.user.id));

    const isGlobalAdmin = currentUser?.typeof === "ADMIN";
    const isOrgOwnerOrAdmin = currentUserMemberships.some(m => 
      m.role?.toLowerCase() === "owner" || m.role?.toLowerCase() === "admin"
    );

    if (!isGlobalAdmin && !isOrgOwnerOrAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get repository with authorized users
    const repo = await db.query.repository.findFirst({
      where: eq(repository.id, id),
    });

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Parse authorized user IDs
    const authorizedUserIds = repo.authorizedUserIds 
      ? JSON.parse(repo.authorizedUserIds) 
      : [];

    // Get user details for authorized users
    const authorizedUsers = authorizedUserIds.length > 0 
      ? await db.query.user.findMany({
          where: (user, { inArray }) => inArray(user.id, authorizedUserIds),
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            typeof: true,
            active: true,
          }
        })
      : [];

    return NextResponse.json({
      repository: {
        id: repo.id,
        name: repo.name,
        authorizedUserIds,
      },
      authorizedUsers,
    });
  } catch (error) {
    console.error("Error fetching repository users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/repositories/[id]/users - Add user to repository access
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    const currentUserMemberships = await db
      .select({
        organizationId: member.organizationId,
        role: member.role,
      })
      .from(member)
      .where(eq(member.userId, session.user.id));

    const isGlobalAdmin = currentUser?.typeof === "ADMIN";
    const isOrgOwnerOrAdmin = currentUserMemberships.some(m => 
      m.role?.toLowerCase() === "owner" || m.role?.toLowerCase() === "admin"
    );

    if (!isGlobalAdmin && !isOrgOwnerOrAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get repository
    const repo = await db.query.repository.findFirst({
      where: eq(repository.id, id),
    });

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Verify user exists
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse current authorized users
    const currentAuthorizedIds = repo.authorizedUserIds 
      ? JSON.parse(repo.authorizedUserIds) 
      : [];

    // Add user if not already authorized
    if (!currentAuthorizedIds.includes(userId)) {
      currentAuthorizedIds.push(userId);
      
      // Update repository
      await db
        .update(repository)
        .set({
          authorizedUserIds: JSON.stringify(currentAuthorizedIds),
          updatedAt: new Date(),
        })
        .where(eq(repository.id, id));
    }

    return NextResponse.json({ 
      message: "User added to repository access",
      authorizedUserIds: currentAuthorizedIds,
    });
  } catch (error) {
    console.error("Error adding user to repository:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/repositories/[id]/users - Remove user from repository access
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    const currentUserMemberships = await db
      .select({
        organizationId: member.organizationId,
        role: member.role,
      })
      .from(member)
      .where(eq(member.userId, session.user.id));

    const isGlobalAdmin = currentUser?.typeof === "ADMIN";
    const isOrgOwnerOrAdmin = currentUserMemberships.some(m => 
      m.role?.toLowerCase() === "owner" || m.role?.toLowerCase() === "admin"
    );

    if (!isGlobalAdmin && !isOrgOwnerOrAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get repository
    const repo = await db.query.repository.findFirst({
      where: eq(repository.id, id),
    });

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Parse current authorized users
    const currentAuthorizedIds = repo.authorizedUserIds 
      ? JSON.parse(repo.authorizedUserIds) 
      : [];

    // Remove user from authorized list
    const updatedAuthorizedIds = currentAuthorizedIds.filter((id: string) => id !== userId);
    
    // Update repository
    await db
      .update(repository)
      .set({
        authorizedUserIds: JSON.stringify(updatedAuthorizedIds),
        updatedAt: new Date(),
      })
      .where(eq(repository.id, id));

    return NextResponse.json({ 
      message: "User removed from repository access",
      authorizedUserIds: updatedAuthorizedIds,
    });
  } catch (error) {
    console.error("Error removing user from repository:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}