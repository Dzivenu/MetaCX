import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { user } from "@/server/db/schema/better-auth-schema";
import { eq } from "drizzle-orm";
import { auth } from "@/server/db/better-auth";
import { headers } from "next/headers";

// PATCH /api/users/archive/[id] - Archive a user (disable login)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;

    // Don't allow archiving own account
    if (currentUser.id === id) {
      return NextResponse.json({ error: "Cannot archive your own account" }, { status: 400 });
    }

    // Archive user by setting active to false and banned to true
    const archivedUser = await db
      .update(user)
      .set({
        active: false,
        banned: true,
        banReason: "User archived by admin",
        updatedAt: new Date(),
      })
      .where(eq(user.id, id))
      .returning();

    if (archivedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      status: "OK", 
      message: `User #${id} archived successfully` 
    });
  } catch (error) {
    console.error("Error archiving user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}