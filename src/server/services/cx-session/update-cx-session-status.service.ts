import { db } from "@/server/db";
import { cxSession } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { CreateActivityService } from "@/server/services/activity/create-activity.service";
import { CreateSessionFloatStacksService } from "@/server/services/float-stack/create-session-float-stacks.service";

type SessionStatus = 
  | "DORMANT"
  | "FLOAT_OPEN_START"
  | "FLOAT_OPEN_CONFIRM"
  | "FLOAT_OPEN_COMPLETE"
  | "FLOAT_CLOSE_START"
  | "FLOAT_CLOSE_CONFIRM"
  | "FLOAT_CLOSE_COMPLETE"
  | "CLOSED";

export interface UpdateCxSessionStatusParams {
  sessionId: string;
  userId: string;
  newStatus: SessionStatus;
  organizationId: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateCxSessionStatusResult {
  session: typeof cxSession.$inferSelect | null;
  error: string | null;
}

export class UpdateCxSessionStatusService {
  private session: typeof cxSession.$inferSelect | null = null;
  private error: string | null = null;
  private params: UpdateCxSessionStatusParams;

  constructor(params: UpdateCxSessionStatusParams) {
    this.params = params;
  }

  async call(): Promise<UpdateCxSessionStatusResult> {
    try {
      await this.updateSessionStatus();
      return { session: this.session, error: this.error };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Unknown error occurred";
      return { session: this.session, error: this.error };
    }
  }

  private async updateSessionStatus(): Promise<void> {
    const { sessionId, userId, newStatus, organizationId, metadata } = this.params;

    // Update session status
    const updatedSessions = await db
      .update(cxSession)
      .set({ 
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(cxSession.id, sessionId))
      .returning();

    if (updatedSessions.length === 0) {
      throw new Error("Failed to update session status");
    }

    this.session = updatedSessions[0];

    // Create float stacks when session is opened/confirmed (like Ruby backend)
    if (newStatus === "FLOAT_OPEN_CONFIRM") {
      const floatStackService = new CreateSessionFloatStacksService({
        sessionId,
        organizationId,
      });
      
      const result = await floatStackService.call();
      if (result.error) {
        console.error(`Failed to create float stacks for session ${sessionId}:`, result.error);
        // Don't throw error here to avoid breaking session status update
      } else {
        console.log(`✅ Created ${result.floatStacks.length} float stacks for session ${sessionId}`);
      }
    }

    // Log activity
    const activityService = new CreateActivityService({
      event: `SESSION_${newStatus}`,
      userId,
      organizationId,
      sessionId,
      referenceId: sessionId,
      comment: `User ${userId} updated CX session ${sessionId} status to ${newStatus}`,
      meta: {
        previousStatus: this.session.status,
        newStatus,
        ...metadata,
      },
    });

    await activityService.call();

    console.log(`✅ CX Session ${sessionId} status updated to ${newStatus}`);
  }
}
