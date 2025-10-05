import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { OrderQuoteService } from "@/server/services/order/order-quote.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Require authenticated session; server will derive user/session
    const sessionData = await auth.api.getSession({ headers: req.headers });
    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!body.inboundTicker || !body.outboundTicker || !body.inboundSum) {
      return NextResponse.json(
        { error: "inboundTicker, outboundTicker, and inboundSum are required" },
        { status: 400 }
      );
    }

    const service = new OrderQuoteService({
      inboundTicker: body.inboundTicker,
      outboundTicker: body.outboundTicker,
      inboundSum: Number(body.inboundSum),
      outboundSum: Number(body.outboundSum || 0),
    });

    const { quote, error } = await service.call();
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, data: { quote } },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("Quote API error:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to generate quote" },
      { status: 500 }
    );
  }
}
