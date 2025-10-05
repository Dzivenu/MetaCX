import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  user,
  member,
  organization,
} from "@/server/db/schema/better-auth-schema";
import { eq, and, ilike, or, desc } from "drizzle-orm";
import { auth } from "@/server/db/better-auth";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";

// GET /api/users - List all users with filtering
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const userType = searchParams.get("userType");
    const activeOnly = searchParams.get("activeOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Build query conditions
    let conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(user.firstName, `%${search}%`),
          ilike(user.lastName, `%${search}%`),
          ilike(user.email, `%${search}%`)
        )
      );
    }

    if (userType && userType !== "ALL") {
      conditions.push(eq(user.typeof, userType));
    }

    if (activeOnly) {
      conditions.push(eq(user.active, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get users with their organization memberships
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        typeof: user.typeof,
        active: user.active,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
        emailVerified: user.emailVerified,
      })
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    // Get organization memberships for each user
    const usersWithOrgs = await Promise.all(
      users.map(async (u) => {
        const memberships = await db
          .select({
            organizationId: member.organizationId,
            role: member.role,
            organizationName: organization.name,
          })
          .from(member)
          .leftJoin(organization, eq(member.organizationId, organization.id))
          .where(eq(member.userId, u.id));

        return {
          ...u,
          authorized_role_names: memberships.map((m) => m.role),
          authorized_repo_ids: memberships.map((m) => m.organizationId),
          organizations: memberships,
          auth_exists: true, // Better Auth users always have auth
        };
      })
    );

    // Get total count for pagination
    const totalCount = await db
      .select({ count: user.id })
      .from(user)
      .where(whereClause);

    return NextResponse.json({
      users: usersWithOrgs,
      total: totalCount.length,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      password,
      typeof: userType,
      active = true,
    } = body.user || body;

    if (!first_name || !last_name || !email || !password || !userType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user using Better Auth
    const newUser = await auth.api.signUpEmail({
      body: {
        name: `${first_name} ${last_name}`,
        email,
        password,
      },
    });

    if (!newUser || !newUser.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Update user with additional fields
    const updatedUser = await db
      .update(user)
      .set({
        firstName: first_name,
        lastName: last_name,
        typeof: userType,
        active,
        updatedAt: new Date(),
      })
      .where(eq(user.id, newUser.user.id))
      .returning();

    return NextResponse.json({
      id: updatedUser[0].id,
      first_name: updatedUser[0].firstName,
      last_name: updatedUser[0].lastName,
      email: updatedUser[0].email,
      typeof: updatedUser[0].typeof,
      active: updatedUser[0].active,
      created_at: updatedUser[0].createdAt,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
