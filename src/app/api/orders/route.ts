import { NextRequest, NextResponse } from "next/server";
import { CreateOrderService } from "@/server/services/order/create-order.service";
import { EnhancedCreateOrderService } from "@/server/services/order/enhanced-create-order.service";
import { db } from "@/server/db";
import { order as orderTable } from "@/server/db/schema";
import { desc } from "drizzle-orm";
import { auth } from "@/server/db/better-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Derive user/session from auth, not from client
    const sessionData = await auth.api.getSession({ headers: req.headers });
    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const enhancedPayload = {
      ...body,
      sessionId: sessionData.session.id,
      userId: sessionData.user.id,
    };

    const service = new EnhancedCreateOrderService(enhancedPayload);
    const result = await service.call();
    if (result.error)
      return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ data: result.data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const rows = await db
      .select()
      .from(orderTable)
      .orderBy(desc(orderTable.createdAt))
      .limit(isNaN(limit) ? 50 : limit);
    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}
