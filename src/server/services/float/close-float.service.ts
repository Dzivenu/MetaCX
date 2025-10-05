import { db } from "@/server/db";
import { cxSession, repositoryAccessLog } from "@/server/db/schema";
import { eq } from "drizzle-orm";

interface CloseFloatServiceParams {
  sessionId: string;
  userId: string;
}

export class CloseFloatService {
  private sessionId: string;
  private userId: string;

  constructor({ sessionId, userId }: CloseFloatServiceParams) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  async call(): Promise<{ data?: any; error?: string }> {
    try {
      // Update session status to FLOAT_CLOSE_COMPLETE
      await db
        .update(cxSession)
        .set({
          status: "FLOAT_CLOSE_COMPLETE",
          closeConfirmDt: new Date(),
          closeConfirmUserId: this.userId,
          updatedAt: new Date(),
        })
        .where(eq(cxSession.id, this.sessionId));

      // Update repository access logs
      await db
        .update(repositoryAccessLog)
        .set({
          closeConfirmDt: new Date(),
          releaseDt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(repositoryAccessLog.sessionId, this.sessionId));

      return { data: { success: true } };
    } catch (error) {
      console.error("Error in CloseFloatService:", error);
      return { error: "Failed to close float" };
    }
  }
}
