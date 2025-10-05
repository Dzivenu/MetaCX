import { db } from "@/server/db";
import { cxSession, cxSessionAccessLog, user } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { CreateActivityService } from "@/server/services/activity/create-activity.service";
import { CreateSessionFloatStacksService } from "@/server/services/float-stack/create-session-float-stacks.service";

export interface CreateCxSessionParams {
  userId: string;
  organizationId: string;
}

export interface CreateCxSessionResult {
  session: typeof cxSession.$inferSelect | null;
  error: string | null;
}

export class CreateCxSessionService {
  private session: typeof cxSession.$inferSelect | null = null;
  private error: string | null = null;
  private currentUser: typeof user.$inferSelect | null = null;
  private userId: string;
  private organizationId: string;

  constructor(params: CreateCxSessionParams) {
    this.userId = params.userId;
    this.organizationId = params.organizationId;
  }

  async call(): Promise<CreateCxSessionResult> {
    try {
      await this.validateUser();
      await this.validateLastSessions();
      await this.createSession();
      await this.createFloatStacks();
      await this.createUserAccessLog();

      return { session: this.session, error: this.error };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Unknown error occurred";
      return { session: this.session, error: this.error };
    }
  }

  private async validateUser(): Promise<void> {
    const users = await db
      .select()
      .from(user)
      .where(eq(user.id, this.userId))
      .limit(1);

    if (users.length === 0) {
      throw new Error("User not found");
    }

    this.currentUser = users[0];
  }

  private async validateLastSessions(): Promise<void> {
    // Get the last 5 sessions for this organization
    const lastSessions = await db
      .select()
      .from(cxSession)
      .where(eq(cxSession.organizationId, this.organizationId))
      .orderBy(cxSession.createdAt)
      .limit(5);

    // Check if all last sessions are properly closed
    const hasOpenSessions = lastSessions.some(
      (session) => session.status !== "FLOAT_CLOSE_COMPLETE" && session.status !== "CLOSED"
    );

    if (hasOpenSessions) {
      throw new Error("Some of the last 5 sessions are not properly closed");
    }
  }

  private async createSession(): Promise<void> {
    if (!this.currentUser) {
      throw new Error("User validation failed");
    }

    const sessionId = crypto.randomUUID();
    const now = new Date();

    const newSessions = await db
      .insert(cxSession)
      .values({
        id: sessionId,
        userId: this.userId,
        organizationId: this.organizationId,
        openStartDt: now,
        status: "DORMANT",
        activeUserId: this.userId,
        authorizedUserIds: [this.userId],
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (newSessions.length === 0) {
      throw new Error("Failed to create session");
    }

    this.session = newSessions[0];
  }

  private async createUserAccessLog(): Promise<void> {
    if (!this.session || !this.currentUser) {
      throw new Error("Session or user not available for access log creation");
    }

    const now = new Date();

    // Create session access log
    await db.insert(cxSessionAccessLog).values({
      id: crypto.randomUUID(),
      sessionId: this.session.id,
      organizationId: this.organizationId,
      startDt: now,
      startOwnerId: this.userId,
      // Auto-join the creator to the session
      userJoinDt: now,
      userJoinId: this.userId,
      authorizedUsers: [this.userId],
      createdAt: now,
      updatedAt: now,
    });

    // Update user's active CX session ID
    await db
      .update(user)
      .set({ 
        activeCxSessionId: this.session.id,
        updatedAt: now,
      })
      .where(eq(user.id, this.userId));

    // Log activity
    const activityService = new CreateActivityService({
      event: "SESSION_CREATED",
      userId: this.userId,
      organizationId: this.organizationId,
      sessionId: this.session.id,
      referenceId: this.session.id,
      comment: `User ${this.userId} created CX session ${this.session.id}`,
      meta: {
        sessionStatus: this.session.status,
        createdAt: this.session.createdAt,
      },
    });

    await activityService.call();

    console.log(`✅ CX Session created and user ${this.userId} set as active`);
  }

  private async createFloatStacks(): Promise<void> {
    if (!this.session) {
      throw new Error("Session not available for float stack creation");
    }

    console.log(`🔧 Creating float stacks for session ${this.session.id}`);
    
    // Create float stacks for all repositories in the organization
    const floatStackService = new CreateSessionFloatStacksService({
      sessionId: this.session.id,
      organizationId: this.organizationId,
    });

    const result = await floatStackService.call();

    if (result.error) {
      throw new Error(`Failed to create float stacks: ${result.error}`);
    }

    console.log(`✅ Created ${result.floatStacks.length} float stacks for session ${this.session.id}`);
  }
}
