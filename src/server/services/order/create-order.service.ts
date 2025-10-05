import { db } from "@/server/db";
import { order } from "@/server/db/schema";
import { nanoid } from "nanoid";

export interface CreateOrderInput {
  sessionId: string;
  userId: string;
  inboundTicker: string;
  inboundSum: number | string;
  outboundTicker: string;
  outboundSum: number | string;
  fxRate?: number;
  rateWoFees?: number;
  finalRate?: number;
  finalRateWithoutFees?: number;
  margin?: number;
  fee?: number;
  networkFee?: number;
  status:
    | "QUOTE"
    | "ACCEPTED"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED"
    | "SCHEDULED"
    | "BLOCKED";
  btcFeeRate?: string;
  quoteSource?: string;
  inboundRepositoryId?: string | null;
  outboundRepositoryId?: string | null;
  batchedStatus?: 0 | 1 | 2;
}

export class CreateOrderService {
  private payload: CreateOrderInput;
  constructor(payload: CreateOrderInput) {
    this.payload = payload;
  }

  async call(): Promise<{ data?: { id: string }; error?: string }> {
    try {
      const id = nanoid();
      const now = new Date();

      await db.insert(order).values({
        id,
        sessionId: this.payload.sessionId,
        userId: this.payload.userId,
        inboundTicker: this.payload.inboundTicker,
        inboundSum: String(this.payload.inboundSum ?? 0),
        outboundTicker: this.payload.outboundTicker,
        outboundSum: String(this.payload.outboundSum ?? 0),
        fxRate: this.payload.fxRate ?? null,
        rateWoFees: this.payload.rateWoFees ?? null,
        finalRate: this.payload.finalRate ?? null,
        finalRateWithoutFees: this.payload.finalRateWithoutFees ?? null,
        margin: this.payload.margin ?? null,
        fee: this.payload.fee ?? null,
        networkFee: this.payload.networkFee ?? 0,
        status: this.payload.status,
        btcFeeRate: this.payload.btcFeeRate ?? null,
        quoteSource: this.payload.quoteSource ?? null,
        inboundRepositoryId: this.payload.inboundRepositoryId ?? null,
        outboundRepositoryId: this.payload.outboundRepositoryId ?? null,
        batchedStatus: this.payload.batchedStatus ?? 0,
        openDt: now,
        createdAt: now,
        updatedAt: now,
      });

      return { data: { id } };
    } catch (error) {
      console.error("CreateOrderService error:", error);
      return { error: "Failed to create order" };
    }
  }
}


