import { db } from "@/server/db";
import { breakdown, floatStack } from "@/server/db/schema";
import { and, desc, eq } from "drizzle-orm";

export type BreakdownDirection = "INBOUND" | "OUTBOUND";

export interface SimpleBreakdownEntry {
  float_stack_id: string;
  repository_id: string;
  count: number;
  direction: BreakdownDirection;
  denomination: { value: number };
}

export class OrderBreakdownService {
  constructor(
    private order: {
      id: string;
      sessionId: string;
      inboundTicker: string | null;
      outboundTicker: string | null;
      inboundSum: string | null;
      outboundSum: string | null;
    }
  ) {}

  private computeAvailableFloatValue(stacks: any[]) {
    return stacks.reduce((sum, fs) => {
      const open = fs.openCount ?? 0;
      const spent = Number(fs.spentDuringSession ?? 0);
      const transferred = fs.transferredDuringSession ?? 0;
      const denom = fs.denominatedValue ?? 0;
      return sum + (open - spent - transferred) * denom;
    }, 0);
  }

  async auto(
    direction: BreakdownDirection,
    usagePercentage = 100
  ): Promise<SimpleBreakdownEntry[]> {
    const ticker =
      direction === "INBOUND"
        ? this.order.inboundTicker
        : this.order.outboundTicker;
    const sumStr =
      direction === "INBOUND" ? this.order.inboundSum : this.order.outboundSum;
    const target = Number(sumStr ?? 0);

    const stacks = await db
      .select()
      .from(floatStack)
      .where(
        and(
          eq(floatStack.sessionId, this.order.sessionId),
          eq(floatStack.ticker, ticker!)
        )
      )
      .orderBy(desc(floatStack.denominatedValue));

    const available = this.computeAvailableFloatValue(stacks);
    if (target > available) {
      throw new Error("Not enough funds to complete this breakdown");
    }

    const results: SimpleBreakdownEntry[] = [];
    let remaining = target;

    for (let i = 0; i < stacks.length; i++) {
      const fs = stacks[i];
      const isLast = i === stacks.length - 1;
      const currentPct = isLast ? 100 : usagePercentage;
      const open = fs.openCount ?? 0;
      const spent = Number(fs.spentDuringSession ?? 0);
      const transferred = fs.transferredDuringSession ?? 0;
      const denom = fs.denominatedValue ?? 0;
      const availableCount = open - spent - transferred;
      const maxSum = availableCount * denom;
      const allocatable = Math.floor((maxSum * currentPct) / 100);
      if (allocatable <= 0 || remaining <= 0) continue;

      if (allocatable <= remaining) {
        const count = Math.floor(allocatable / denom);
        if (count > 0) {
          results.push({
            float_stack_id: fs.id,
            repository_id: fs.repositoryId,
            count,
            direction,
            denomination: { value: denom },
          });
          remaining -= count * denom;
        }
      } else {
        const count = Math.floor(remaining / denom);
        if (count > 0) {
          results.push({
            float_stack_id: fs.id,
            repository_id: fs.repositoryId,
            count,
            direction,
            denomination: { value: denom },
          });
          remaining -= count * denom;
        }
      }
    }

    return results;
  }
}


