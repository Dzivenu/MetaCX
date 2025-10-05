import { db } from "@/server/db";
import { floatStack, repositoryAccessLog } from "@/server/db/schema";
import { eq, and, isNull } from "drizzle-orm";

interface ValidateRepositoryFloatServiceParams {
  repositoryId: string;
  sessionId: string;
  action?: string;
  userId: string;
}

export class ValidateRepositoryFloatService {
  private repositoryId: string;
  private sessionId: string;
  private action: string;
  private userId: string;

  constructor({
    repositoryId,
    sessionId,
    action = "VALIDATE",
    userId,
  }: ValidateRepositoryFloatServiceParams) {
    this.repositoryId = repositoryId;
    this.sessionId = sessionId;
    this.action = action;
    this.userId = userId;
  }

  async call(): Promise<{ data?: any; error?: string }> {
    try {
      // Get all float stacks for this repository and session
      const floatStacks = await db
        .select()
        .from(floatStack)
        .where(
          and(
            eq(floatStack.repositoryId, this.repositoryId),
            eq(floatStack.sessionId, this.sessionId)
          )
        );

      if (floatStacks.length === 0) {
        return { error: "No float stacks found for this repository" };
      }

      // Check if all required float stacks are confirmed
      const unconfirmedStacks = floatStacks.filter((stack) => {
        // For open validation, check openConfirmedDt
        // For close validation, check closeConfirmedDt
        if (this.action.includes("OPEN")) {
          return !stack.openConfirmedDt;
        } else if (this.action.includes("CLOSE")) {
          return !stack.closeConfirmedDt;
        }
        return false;
      });

      if (unconfirmedStacks.length > 0) {
        return {
          error: "Not all float stacks are confirmed",
          unconfirmedStacks: unconfirmedStacks.map((stack) => stack.id),
        };
      }

      // Update repository access log based on action
      if (this.action === "VALIDATE_OPEN") {
        await db
          .update(repositoryAccessLog)
          .set({
            openConfirmDt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(repositoryAccessLog.repositoryId, this.repositoryId),
              eq(repositoryAccessLog.sessionId, this.sessionId),
              isNull(repositoryAccessLog.openConfirmDt)
            )
          );
      } else if (this.action === "VALIDATE_CLOSE") {
        await db
          .update(repositoryAccessLog)
          .set({
            closeConfirmDt: new Date(),
            releaseDt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(repositoryAccessLog.repositoryId, this.repositoryId),
              eq(repositoryAccessLog.sessionId, this.sessionId),
              isNull(repositoryAccessLog.closeConfirmDt)
            )
          );
      }

      return {
        data: {
          success: true,
          validatedStacks: floatStacks.length,
        },
      };
    } catch (error) {
      console.error("Error in ValidateRepositoryFloatService:", error);
      return { error: "Failed to validate repository float" };
    }
  }
}
