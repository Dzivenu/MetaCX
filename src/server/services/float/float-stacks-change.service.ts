import { db } from "@/server/db";
import { breakdown, floatStack } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

type Intention = "CREATE" | "COMMIT" | "UNCOMMIT" | "DELETE";

export interface FloatStacksChangeInput {
  breakable: { id: string };
  intention: Intention;
  breakdowns: Array<{
    float_stack_id: string;
    repository_id: string;
    count: number;
    direction: "INBOUND" | "OUTBOUND";
    denomination: { value: number };
  }>;
}

export class FloatStacksChangeService {
  private payload: FloatStacksChangeInput;
  constructor(payload: FloatStacksChangeInput) {
    this.payload = payload;
  }

  async call(): Promise<{ success: boolean; error?: string }> {
    try {
      const { intention } = this.payload;
      if (intention === "CREATE") return this.create();
      if (intention === "COMMIT") return this.commit();
      if (intention === "UNCOMMIT") return this.uncommit();
      if (intention === "DELETE") return this.delete();
      return { success: false, error: "Invalid intention" };
    } catch (e) {
      console.error("FloatStacksChangeService error", e);
      return { success: false, error: "Float stack change failed" };
    }
  }

  private async create(): Promise<{ success: boolean; error?: string }> {
    // Delete existing (idempotent behavior)
    await db
      .delete(breakdown)
      .where(eq(breakdown.breakableId, this.payload.breakable.id));

    for (const b of this.payload.breakdowns) {
      await db.insert(breakdown).values({
        id: nanoid(),
        breakableType: "Order",
        breakableId: this.payload.breakable.id,
        floatStackId: b.float_stack_id,
        denominationId: (
          await db
            .select({ id: floatStack.denominationId })
            .from(floatStack)
            .where(eq(floatStack.id, b.float_stack_id))
            .limit(1)
        )[0]?.id,
        count: String(b.count),
        direction: b.direction,
        status: "PENDING",
      });
    }
    return { success: true };
  }

  private async commit(): Promise<{ success: boolean; error?: string }> {
    // Apply breakdowns to float stacks (increase/decrease spentDuringSession)
    const bds = await db
      .select()
      .from(breakdown)
      .where(
        and(
          eq(breakdown.breakableType, "Order"),
          eq(breakdown.breakableId, this.payload.breakable.id)
        )
      );

    for (const b of bds) {
      const rows = await db
        .select()
        .from(floatStack)
        .where(eq(floatStack.id, b.floatStackId!))
        .limit(1);
      if (rows.length === 0) continue;
      const fs = rows[0];
      const current = Number(fs.spentDuringSession ?? 0);
      const delta = Number(b.count ?? 0);
      const next =
        b.direction === "INBOUND" ? current - delta : current + delta;
      await db
        .update(floatStack)
        .set({ spentDuringSession: String(next) })
        .where(eq(floatStack.id, fs.id));
    }

    await db
      .update(breakdown)
      .set({ status: "COMMITTED" })
      .where(
        and(
          eq(breakdown.breakableType, "Order"),
          eq(breakdown.breakableId, this.payload.breakable.id)
        )
      );
    return { success: true };
  }

  private async uncommit(): Promise<{ success: boolean; error?: string }> {
    // Reverse previously committed breakdowns
    const bds = await db
      .select()
      .from(breakdown)
      .where(
        and(
          eq(breakdown.breakableType, "Order"),
          eq(breakdown.breakableId, this.payload.breakable.id)
        )
      );

    for (const b of bds) {
      const rows = await db
        .select()
        .from(floatStack)
        .where(eq(floatStack.id, b.floatStackId!))
        .limit(1);
      if (rows.length === 0) continue;
      const fs = rows[0];
      const current = Number(fs.spentDuringSession ?? 0);
      const delta = Number(b.count ?? 0);
      const next =
        b.direction === "INBOUND" ? current + delta : current - delta;
      await db
        .update(floatStack)
        .set({ spentDuringSession: String(next) })
        .where(eq(floatStack.id, fs.id));
    }

    await db
      .update(breakdown)
      .set({ status: "CANCELLED" })
      .where(
        and(
          eq(breakdown.breakableType, "Order"),
          eq(breakdown.breakableId, this.payload.breakable.id)
        )
      );
    return { success: true };
  }

  private async delete(): Promise<{ success: boolean; error?: string }> {
    await db
      .delete(breakdown)
      .where(
        and(
          eq(breakdown.breakableType, "Order"),
          eq(breakdown.breakableId, this.payload.breakable.id)
        )
      );
    return { success: true };
  }
}
