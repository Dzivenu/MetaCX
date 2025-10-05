import { db } from "@/server/db";
import { cxSession, cxSessionAccessLog, user } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { CreateActivityService } from "@/server/services/activity/create-activity.service";

export interface JoinCxSessionParams {
  sessionId: string;
  userId: string;
}

export interface JoinCxSessionResult {
  session: typeof cxSession.$inferSelect | null;
  error: string | null;
}

export class JoinCxSessionService {
  private session: typeof cxSession.$inferSelect | null = null;
  private error: string | null = null;
  private currentUser: typeof user.$inferSelect | null = null;
  private sessionId: string;
  private userId: string;

  constructor(params: JoinCxSessionParams) {
    this.sessionId = params.sessionId;
    this.userId = params.userId;
  }

  async call(): Promise<JoinCxSessionResult> {
    try {
      await this.validateUser();
      await this.validateSession();
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

  private async validateSession(): Promise<void> {
    const sessions = await db
      .select()
      .from(cxSession)
      .where(eq(cxSession.id, this.sessionId))
      .limit(1);

    if (sessions.length === 0) {
      throw new Error("Session not found");
    }

    this.session = sessions[0];

    // Check if session is in a joinable state
    if (this.session.status === "CLOSED" || this.session.status === "FLOAT_CLOSE_COMPLETE") {
      throw new Error("Cannot join a closed session");
    }
  }

  private async createUserAccessLog(): Promise<void> {
    if (!this.session || !this.currentUser) {
      throw new Error("Session or user not available for access log creation");
    }

    const now = new Date();

    // Get existing access log for this session
    const existingLogs = await db
      .select()
      .from(cxSessionAccessLog)
      .where(eq(cxSessionAccessLog.sessionId, this.sessionId))
      .limit(1);

    if (existingLogs.length === 0) {
      // Create new access log if none exists (shouldn't happen in normal flow)
      await db.insert(cxSessionAccessLog).values({
        id: crypto.randomUUID(),
        sessionId: this.sessionId,
        organizationId: this.session.organizationId,
        startDt: now,
        startOwnerId: this.session.userId,
        userJoinDt: now,
        userJoinId: this.userId,
        authorizedUsers: [this.session.userId, this.userId],
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Update existing access log with join information
      const existingLog = existingLogs[0];
      const currentAuthorizedUsers = (existingLog.authorizedUsers as string[]) || [];
      
      // Add user to authorized users if not already present
      const updatedAuthorizedUsers = currentAuthorizedUsers.includes(this.userId)
        ? currentAuthorizedUsers
        : [...currentAuthorizedUsers, this.userId];

      await db
        .update(cxSessionAccessLog)
        .set({
          userJoinDt: now,
          userJoinId: this.userId,
          authorizedUsers: updatedAuthorizedUsers,
          updatedAt: now,
        })
        .where(eq(cxSessionAccessLog.sessionId, this.sessionId));
    }

    // Update session's authorized user IDs
    const currentSessionAuthorizedUsers = (this.session.authorizedUserIds as string[]) || [];
    const updatedSessionAuthorizedUsers = currentSessionAuthorizedUsers.includes(this.userId)
      ? currentSessionAuthorizedUsers
      : [...currentSessionAuthorizedUsers, this.userId];

    await db
      .update(cxSession)
      .set({
        authorizedUserIds: updatedSessionAuthorizedUsers,
        updatedAt: now,
      })
      .where(eq(cxSession.id, this.sessionId));

    // Update user's active CX session ID
    await db
      .update(user)
      .set({ 
        activeCxSessionId: this.sessionId,
        updatedAt: now,
      })
      .where(eq(user.id, this.userId));

    // Log activity
    const activityService = new CreateActivityService({
      event: "SESSION_JOINED",
      userId: this.userId,
      organizationId: this.session.organizationId,
      sessionId: this.sessionId,
      referenceId: this.sessionId,
      comment: `User ${this.userId} joined CX session ${this.sessionId}`,
      meta: {
        sessionStatus: this.session.status,
        authorizedUsers: this.session.authorizedUserIds,
      },
    });

    await activityService.call();

    console.log(`✅ User ${this.userId} joined CX session ${this.sessionId}`);

    // Refresh session data after updates
    const updatedSessions = await db
      .select()
      .from(cxSession)
      .where(eq(cxSession.id, this.sessionId))
      .limit(1);

    if (updatedSessions.length > 0) {
      this.session = updatedSessions[0];
    }
  }
}
