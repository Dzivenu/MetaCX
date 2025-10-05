import { db } from "@/server/db";
import { activity } from "@/server/db/schema";

export interface CreateActivityParams {
  event: string;
  userId: string;
  organizationId: string;
  sessionId?: string;
  referenceId?: string;
  comment?: string;
  meta?: Record<string, unknown>;
}

export interface CreateActivityResult {
  activity: typeof activity.$inferSelect | null;
  error: string | null;
}

export class CreateActivityService {
  private activity: typeof activity.$inferSelect | null = null;
  private error: string | null = null;
  private params: CreateActivityParams;

  constructor(params: CreateActivityParams) {
    this.params = params;
  }

  async call(): Promise<CreateActivityResult> {
    try {
      await this.createActivity();
      return { activity: this.activity, error: this.error };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Unknown error occurred";
      return { activity: this.activity, error: this.error };
    }
  }

  private async createActivity(): Promise<void> {
    const newActivities = await db
      .insert(activity)
      .values({
        id: crypto.randomUUID(),
        event: this.params.event,
        userId: this.params.userId,
        organizationId: this.params.organizationId,
        sessionId: this.params.sessionId,
        referenceId: this.params.referenceId,
        comment: this.params.comment,
        meta: this.params.meta,
        createdAt: new Date(),
      })
      .returning();

    if (newActivities.length === 0) {
      throw new Error("Failed to create activity log");
    }

    this.activity = newActivities[0];
    console.log(`✅ Activity logged: ${this.params.event}`);
  }
}

export type { Activity } from "@/server/db/schema/activities";
