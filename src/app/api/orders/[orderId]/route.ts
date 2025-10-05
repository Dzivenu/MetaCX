import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { order as orderTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
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
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}


