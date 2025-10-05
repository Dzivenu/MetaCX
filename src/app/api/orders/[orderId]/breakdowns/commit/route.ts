import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { order as orderTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { FloatStacksChangeService } from "@/server/services/float/float-stacks-change.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const rows = await db
      .select()
      .from(orderTable)
      .where(eq(orderTable.id, orderId))
      .limit(1);
    if (rows.length === 0)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const svc = new FloatStacksChangeService({
      breakable: { id: orderId },
      intention: "COMMIT",
      breakdowns: [],
    });
    const r = await svc.call();
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


