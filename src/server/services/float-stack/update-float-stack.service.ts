import { FloatStackModel, FloatStackData } from "@/server/models/FloatStackModel";

export interface UpdateFloatStackParams {
  id: string;
  openCount?: number;
  cxSessionId?: string;
  repositoryId?: number;
  denominationId?: string;
  spentDuringCxSession?: number;
  closeCount?: number;
  lastCxSessionCount?: number;
  previousCxSessionFloatStackId?: number;
  denominatedValue?: number;
  ticker?: string;
  openSpot?: number;
  closeSpot?: number;
  transferredDuringCxSession?: number;
}

export interface UpdateFloatStackResult {
  floatStack: FloatStackData | null;
  error: string | null;
}

export class UpdateFloatStackService {
  private floatStack: FloatStackData | null = null;
  private error: string | null = null;
  private id: string;
  private params: UpdateFloatStackParams;

  constructor(params: UpdateFloatStackParams) {
    this.id = params.id;
    this.params = params;
  }

  async call(): Promise<UpdateFloatStackResult> {
    try {
      const stack = await FloatStackModel.find(this.id);
      
      if (!stack) {
        this.error = "Float stack not found";
        return { floatStack: null, error: this.error };
      }

      // Update only the provided fields
      if (this.params.openCount !== undefined) stack.set("openCount", this.params.openCount);
      if (this.params.cxSessionId !== undefined) stack.set("cxSessionId", this.params.cxSessionId);
      if (this.params.repositoryId !== undefined) stack.set("repositoryId", this.params.repositoryId);
      if (this.params.denominationId !== undefined) stack.set("denominationId", this.params.denominationId);
      if (this.params.spentDuringCxSession !== undefined) stack.set("spentDuringCxSession", this.params.spentDuringCxSession);
      if (this.params.closeCount !== undefined) stack.set("closeCount", this.params.closeCount);
      if (this.params.lastCxSessionCount !== undefined) stack.set("lastCxSessionCount", this.params.lastCxSessionCount);
      if (this.params.previousCxSessionFloatStackId !== undefined) stack.set("previousCxSessionFloatStackId", this.params.previousCxSessionFloatStackId);
      if (this.params.denominatedValue !== undefined) stack.set("denominatedValue", this.params.denominatedValue);
      if (this.params.ticker !== undefined) stack.set("ticker", this.params.ticker);
      if (this.params.openSpot !== undefined) stack.set("openSpot", this.params.openSpot);
      if (this.params.closeSpot !== undefined) stack.set("closeSpot", this.params.closeSpot);
      if (this.params.transferredDuringCxSession !== undefined) stack.set("transferredDuringCxSession", this.params.transferredDuringCxSession);

      const saved = await stack.save();
      
      if (!saved) {
        this.error = "Failed to update float stack";
        return { floatStack: null, error: this.error };
      }

      this.floatStack = stack.attributes;
      return { floatStack: this.floatStack, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to update float stack";
      return { floatStack: null, error: this.error };
    }
  }
}

// Export for convenience
export default UpdateFloatStackService;
