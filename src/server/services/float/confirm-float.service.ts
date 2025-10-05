import { db } from "@/server/db";
import { cxSession, floatStack, repositoryAccessLog } from "@/server/db/schema";
import { eq, and, isNull } from "drizzle-orm";

interface ConfirmFloatServiceParams {
  sessionId: string;
  userId: string;
  action: "OPEN" | "CLOSE";
}

export class ConfirmFloatService {
  private sessionId: string;
  private userId: string;
  private action: string;

  constructor({ sessionId, userId, action }: ConfirmFloatServiceParams) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.action = action;
  }

  async call(): Promise<{ data?: any; error?: string }> {
    try {
      // Validate that all required float stacks are confirmed
      const unconfirmedStacks = await this.getUnconfirmedStacks();

      if (unconfirmedStacks.length > 0) {
        const unconfirmedRepos = [
          ...new Set(unconfirmedStacks.map((stack) => stack.repositoryId)),
        ];
        return {
          error: "Not all float stacks are confirmed",
          unconfirmedRepos,
        };
      }

      if (this.action === "OPEN") {
        // Update session status to FLOAT_OPEN_COMPLETE
        await db
          .update(cxSession)
          .set({
            status: "FLOAT_OPEN_COMPLETE",
            openConfirmDt: new Date(),
            openConfirmUserId: this.userId,
            updatedAt: new Date(),
          })
          .where(eq(cxSession.id, this.sessionId));

        // Update repository access logs
        await db
          .update(repositoryAccessLog)
          .set({
            openConfirmDt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(repositoryAccessLog.sessionId, this.sessionId),
              isNull(repositoryAccessLog.openConfirmDt)
            )
          );
      } else if (this.action === "CLOSE") {
        // This is handled by CloseFloatService
        return { error: "Use CloseFloatService for closing operations" };
      }

      return { data: { success: true } };
    } catch (error) {
      console.error("Error in ConfirmFloatService:", error);
      return { error: "Failed to confirm float operation" };
    }
  }

  private async getUnconfirmedStacks() {
    const field =
      this.action === "OPEN" ? "openConfirmedDt" : "closeConfirmedDt";

    return await db
      .select()
      .from(floatStack)
      .where(
        and(eq(floatStack.sessionId, this.sessionId), isNull(floatStack[field]))
      );
  }
}
