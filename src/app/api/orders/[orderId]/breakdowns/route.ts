import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { order as orderTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { OrderBreakdownService } from "@/server/services/order/order-breakdown.service";
import { FloatStacksChangeService } from "@/server/services/float/float-stacks-change.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json();
    const intention: "CREATE" | "COMMIT" | "UNCOMMIT" | "DELETE" =
      body.intention || "CREATE";
    const usagePercentage: number | undefined = body.usagePercentage;

    // Load order
    const rows = await db
      .select()
      .from(orderTable)
      .where(eq(orderTable.id, orderId))
      .limit(1);
    if (rows.length === 0)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const ord = rows[0];

    if (intention === "CREATE") {
      // Auto compute inbound/outbound breakdowns
      const svc = new OrderBreakdownService(ord as any);
      const inbound = await svc.auto("INBOUND", usagePercentage ?? 100);
      const outbound = await svc.auto("OUTBOUND", usagePercentage ?? 100);
      const combined = [...inbound, ...outbound];

      const change = new FloatStacksChangeService({
        breakable: { id: ord.id },
        intention: "CREATE",
        breakdowns: combined,
      });
      const r = await change.call();
      if (!r.success)
        return NextResponse.json({ error: r.error }, { status: 422 });
      return NextResponse.json({ data: { breakdowns: combined } });
    }

    // Non-CREATE intentions operate on existing breakdowns
    const change = new FloatStacksChangeService({
      breakable: { id: ord.id },
      intention,
      breakdowns: [],
    });
    const r = await change.call();
    if (!r.success)
      return NextResponse.json({ error: r.error }, { status: 422 });
    return NextResponse.json({ data: { success: true } });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}


