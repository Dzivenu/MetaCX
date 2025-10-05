import { db } from "@/server/db";
import { floatStack } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

interface FloatStackUpdate {
  id: string;
  openCount?: number;
  closeCount?: number;
  middayCount?: number;
  openConfirmedDt?: Date | string | null;
  closeConfirmedDt?: Date | string | null;
  transferredDuringSession?: number;
}

interface UpdateRepositoryFloatServiceParams {
  repositoryId: string;
  sessionId: string;
  floatStacks: FloatStackUpdate[];
  userId: string;
}

export class UpdateRepositoryFloatService {
  private repositoryId: string;
  private sessionId: string;
  private floatStacks: FloatStackUpdate[];
  private userId: string;

  constructor({
    repositoryId,
    sessionId,
    floatStacks,
    userId,
  }: UpdateRepositoryFloatServiceParams) {
    this.repositoryId = repositoryId;
    this.sessionId = sessionId;
    this.floatStacks = floatStacks;
    this.userId = userId;
  }

  async call(): Promise<{ data?: any; error?: string }> {
    try {
      const updatedStacks = [];

      for (const stackUpdate of this.floatStacks) {
        // Validate that the float stack exists and belongs to the correct repository/session
        const existingStack = await db
          .select()
          .from(floatStack)
          .where(
            and(
              eq(floatStack.id, stackUpdate.id),
              eq(floatStack.repositoryId, this.repositoryId),
              eq(floatStack.sessionId, this.sessionId)
            )
          )
          .limit(1);

        if (existingStack.length === 0) {
          return {
            error: `Float stack ${stackUpdate.id} not found or access denied`,
          };
        }

        // Prepare update data, only including defined fields
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (stackUpdate.openCount !== undefined) {
          updateData.openCount = stackUpdate.openCount;
        }
        if (stackUpdate.closeCount !== undefined) {
          updateData.closeCount = stackUpdate.closeCount;
        }
        if (stackUpdate.middayCount !== undefined) {
          updateData.middayCount = stackUpdate.middayCount;
        }
        if (stackUpdate.openConfirmedDt !== undefined) {
          updateData.openConfirmedDt =
            stackUpdate.openConfirmedDt === null
              ? null
              : this.parseDateInput(stackUpdate.openConfirmedDt);
        }
        if (stackUpdate.closeConfirmedDt !== undefined) {
          updateData.closeConfirmedDt =
            stackUpdate.closeConfirmedDt === null
              ? null
              : this.parseDateInput(stackUpdate.closeConfirmedDt);
        }
        if (stackUpdate.transferredDuringSession !== undefined) {
          updateData.transferredDuringSession =
            stackUpdate.transferredDuringSession;
        }

        // Update the float stack
        await db
          .update(floatStack)
          .set(updateData)
          .where(eq(floatStack.id, stackUpdate.id));

        // Get the updated stack
        const updatedStack = await db
          .select()
          .from(floatStack)
          .where(eq(floatStack.id, stackUpdate.id))
          .limit(1);

        if (updatedStack.length > 0) {
          updatedStacks.push(updatedStack[0]);
        }
      }

      return { data: { floatStacks: updatedStacks } };
    } catch (error) {
      console.error("Error in UpdateRepositoryFloatService:", error);
      return { error: "Failed to update repository float" };
    }
  }

  private parseDateInput(value: Date | string): Date {
    if (value instanceof Date) return value;
    // Assume ISO string. Fallback to Date parsing and validate.
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      throw new TypeError("Invalid date value for timestamp field");
    }
    return d;
  }
}
