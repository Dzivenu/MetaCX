import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { user, member, organization } from "@/server/db/schema/better-auth-schema";
import { repository } from "@/server/db/schema/repositories";
import { eq } from "drizzle-orm";
import { auth } from "@/server/db/better-auth";
import { headers } from "next/headers";

// GET /api/users/[id] - Get a specific user
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

    // Check if user is admin or accessing their own profile
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    // Debug logging
    console.log("Current user:", {
      id: currentUser?.id,
      typeof: currentUser?.typeof,
      requestedId: id,
      isOwnProfile: currentUser?.id === id
    });

    // Get current user's organization memberships to check for owner/admin roles
    const currentUserMemberships = await db
      .select({
        organizationId: member.organizationId,
        role: member.role,
      })
      .from(member)
      .where(eq(member.userId, session.user.id));

    console.log("Current user memberships:", currentUserMemberships);

    const isGlobalAdmin = currentUser?.typeof === "ADMIN";
    const isOwnProfile = currentUser?.id === id;
    const isOrgOwnerOrAdmin = currentUserMemberships.some(m => 
      m.role?.toLowerCase() === "owner" || m.role?.toLowerCase() === "admin"
    );

    if (!currentUser || (!isGlobalAdmin && !isOwnProfile && !isOrgOwnerOrAdmin)) {
      console.log("Access denied:", { isGlobalAdmin, isOwnProfile, isOrgOwnerOrAdmin });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user details
    const userData = await db.query.user.findFirst({
      where: eq(user.id, id),
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get organization memberships
    const memberships = await db
      .select({
        organizationId: member.organizationId,
        role: member.role,
        organizationName: organization.name,
        organizationSlug: organization.slug,
      })
      .from(member)
      .leftJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, id));

    // Get repositories where this user is authorized
    const authorizedRepositories = await db.query.repository.findMany({
      where: (repository, { like }) => like(repository.authorizedUserIds, `%"${id}"%`),
      columns: {
        id: true,
        name: true,
      }
    });

    const authorizedRepoIds = authorizedRepositories.map(repo => repo.id);

    // Format response to match legacy API
    const response = {
      id: userData.id,
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      typeof: userData.typeof,
      active: userData.active,
      created_at: userData.createdAt,
      last_sign_in_at: userData.lastSignInAt,
      email_verified: userData.emailVerified,
      auth_exists: true,
      authorized_repo_ids: authorizedRepoIds,
      organizations: memberships,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/users/[id] - Update a user
export async function PATCH(
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

    // Check if user is admin or updating their own profile
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    // Get current user's organization memberships to check for owner/admin roles
    const currentUserMemberships = await db
      .select({
        organizationId: member.organizationId,
        role: member.role,
      })
      .from(member)
      .where(eq(member.userId, session.user.id));

    const isGlobalAdmin = currentUser?.typeof === "ADMIN";
    const isOwnProfile = currentUser?.id === id;
    const isOrgOwnerOrAdmin = currentUserMemberships.some(m => 
      m.role?.toLowerCase() === "owner" || m.role?.toLowerCase() === "admin"
    );

    if (!currentUser || (!isGlobalAdmin && !isOwnProfile && !isOrgOwnerOrAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const userData = body.user || body;

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (userData.first_name !== undefined) {
      updateData.firstName = userData.first_name;
    }
    if (userData.last_name !== undefined) {
      updateData.lastName = userData.last_name;
    }
    if (userData.email !== undefined) {
      updateData.email = userData.email;
    }
    
    // Only global admins can change these fields
    if (isGlobalAdmin) {
      if (userData.typeof !== undefined) {
        updateData.typeof = userData.typeof;
      }
      if (userData.active !== undefined) {
        updateData.active = userData.active;
      }
    }

    // Handle repository access changes (for admins and org owners/admins)
    if ((isGlobalAdmin || isOrgOwnerOrAdmin) && userData.authorized_repo_ids !== undefined) {
      // Get current user's authorized repositories
      const currentAuthorizedRepos = await db.query.repository.findMany({
        where: (repository, { like }) => like(repository.authorizedUserIds, `%"${id}"%`),
        columns: {
          id: true,
          authorizedUserIds: true,
        }
      });

      const currentRepoIds = currentAuthorizedRepos.map(repo => repo.id);
      const newRepoIds = userData.authorized_repo_ids as string[];

      // Find repositories to add user to
      const reposToAdd = newRepoIds.filter(repoId => !currentRepoIds.includes(repoId));
      
      // Find repositories to remove user from
      const reposToRemove = currentRepoIds.filter(repoId => !newRepoIds.includes(repoId));

      // Add user to new repositories
      for (const repoId of reposToAdd) {
        const repo = await db.query.repository.findFirst({
          where: eq(repository.id, repoId),
        });
        
        if (repo) {
          const currentAuthorizedIds = repo.authorizedUserIds 
            ? JSON.parse(repo.authorizedUserIds) 
            : [];
          
          if (!currentAuthorizedIds.includes(id)) {
            currentAuthorizedIds.push(id);
            await db
              .update(repository)
              .set({
                authorizedUserIds: JSON.stringify(currentAuthorizedIds),
                updatedAt: new Date(),
              })
              .where(eq(repository.id, repoId));
          }
        }
      }

      // Remove user from repositories
      for (const repoId of reposToRemove) {
        const repo = await db.query.repository.findFirst({
          where: eq(repository.id, repoId),
        });
        
        if (repo) {
          const currentAuthorizedIds = repo.authorizedUserIds 
            ? JSON.parse(repo.authorizedUserIds) 
            : [];
          
          const updatedAuthorizedIds = currentAuthorizedIds.filter((userId: string) => userId !== id);
          await db
            .update(repository)
            .set({
              authorizedUserIds: JSON.stringify(updatedAuthorizedIds),
              updatedAt: new Date(),
            })
            .where(eq(repository.id, repoId));
        }
      }
    }

    // Update user
    const updatedUser = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, id))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Note: Repository access is now handled via the user fields above
    // Organization memberships are separate from repository access

    // Return updated user data
    const response = {
      id: updatedUser[0].id,
      first_name: updatedUser[0].firstName,
      last_name: updatedUser[0].lastName,
      email: updatedUser[0].email,
      typeof: updatedUser[0].typeof,
      active: updatedUser[0].active,
      created_at: updatedUser[0].createdAt,
      updated_at: updatedUser[0].updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete/Archive a user
export async function DELETE(
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

    // Check if user is admin
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    if (!currentUser || currentUser.typeof !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Don't allow deleting own account
    if (currentUser.id === id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Archive user instead of deleting (soft delete)
    const archivedUser = await db
      .update(user)
      .set({
        active: false,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id))
      .returning();

    if (archivedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "OK", message: "User archived successfully" });
  } catch (error) {
    console.error("Error archiving user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}