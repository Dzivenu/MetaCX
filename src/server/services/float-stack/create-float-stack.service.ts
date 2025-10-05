import { db } from "@/server/db";
import { floatStack } from "@/server/db/schema";
import { nanoid } from "nanoid";

export interface CreateFloatStackParams {
  openCount?: number;
  closeCount?: number;
  middayCount?: number;
  sessionId?: string;
  repositoryId?: string;
  denominationId?: string;
  spentDuringSession?: string;
  lastSessionCount?: number;
  previousSessionFloatStackId?: string;
  denominatedValue?: number;
  ticker?: string;
  openSpot?: number;
  closeSpot?: number;
  transferredDuringSession?: number;
  openConfirmedDt?: Date;
  closeConfirmedDt?: Date;
}

export interface CreateFloatStackResult {
  floatStack: any | null;
  error: string | null;
}

export class CreateFloatStackService {
  private floatStack: any | null = null;
  private error: string | null = null;
  private params: CreateFloatStackParams;

  constructor(params: CreateFloatStackParams) {
    this.params = params;
  }

  async call(): Promise<CreateFloatStackResult> {
    try {
      const id = nanoid();

      const newFloatStack = await db
        .insert(floatStack)
        .values({
          id,
          sessionId: this.params.sessionId || "",
          repositoryId: this.params.repositoryId || "",
          denominationId: this.params.denominationId || "",
          openCount: this.params.openCount || 0,
          closeCount: this.params.closeCount || 0,
          middayCount: this.params.middayCount || 0,
          lastSessionCount: this.params.lastSessionCount || 0,
          spentDuringSession: this.params.spentDuringSession || "0.0",
          transferredDuringSession: this.params.transferredDuringSession || 0,
          denominatedValue: this.params.denominatedValue || 0,
          ticker: this.params.ticker || "",
          openSpot: this.params.openSpot || 0,
          closeSpot: this.params.closeSpot || 0,
          averageSpot: 0,
          previousSessionFloatStackId: this.params.previousSessionFloatStackId,
          openConfirmedDt: this.params.openConfirmedDt,
          closeConfirmedDt: this.params.closeConfirmedDt,
        })
        .returning();

      if (!newFloatStack || newFloatStack.length === 0) {
        this.error = "Failed to create float stack";
        return { floatStack: null, error: this.error };
      }

      this.floatStack = newFloatStack[0];
      return { floatStack: this.floatStack, error: null };
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : "Failed to create float stack";
      return { floatStack: null, error: this.error };
    }
  }
}

// Export for convenience
export default CreateFloatStackService;
