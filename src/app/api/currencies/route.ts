import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { currency } from "@/server/db/schema";
import { auth } from "@/server/db/better-auth";
import { CurrencyCreationService } from "@/server/services/currency/create-currency.service";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Scope to active organization and include id so clients can reorder
    const sessionData = await auth.api.getSession({ headers: req.headers });
    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const activeOrganizationId = sessionData.session.activeOrganizationId;
    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active organization selected" },
        { status: 400 }
      );
    }

    const currencies = await db
      .select({
        id: currency.id,
        ticker: currency.ticker,
        name: currency.name,
        typeOf: currency.typeOf,
        floatDisplayOrder: currency.floatDisplayOrder,
      })
      .from(currency)
      .where(eq(currency.organizationId, activeOrganizationId))
      .orderBy(currency.floatDisplayOrder || currency.ticker);

    return NextResponse.json({ data: currencies }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to fetch currencies" },
      { status: 500 }
    );
  }
}

// POST /api/currencies - create currency; support isBaseCurrency logic
export async function POST(request: NextRequest) {
  try {
    const sessionData = await auth.api.getSession({ headers: request.headers });
    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeOrganizationId = sessionData.session.activeOrganizationId;
    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active organization selected" },
        { status: 400 }
      );
    }

    const body = await request.json();
    // Support both flat and nested payloads: { currency: {...}, denominations, repositories }
    const payload =
      body?.currency && typeof body.currency === "object"
        ? { ...body.currency }
        : { ...body };

    // Ignore any isBaseCurrency in the request to prevent external setting
    if (Object.prototype.hasOwnProperty.call(payload, "isBaseCurrency")) {
      delete payload.isBaseCurrency;
    }

    const {
      ticker,
      name,
      rate,
      rateApi,
      rateApiIdentifier,
      typeOf,
      api,
      icon,
      network,
      chainId,
      symbol,
      contract,
      // tolerate common extra fields without using them
      sign: _sign,
      decimals: _decimals,
      description: _description,
    } = payload || {};

    const denominations = Array.isArray(body?.denominations)
      ? body.denominitions ?? body.denomination ?? body.denominations
      : Array.isArray(payload?.denominations)
      ? payload.denominitions ?? payload.denomination ?? payload.denominations
      : [];

    const repositories = Array.isArray(body?.repositories)
      ? body.repositories
      : Array.isArray(payload?.repositories)
      ? payload.repositories
      : [];

    if (!ticker || !rateApiIdentifier) {
      return NextResponse.json(
        { error: "ticker and rateApiIdentifier are required" },
        { status: 400 }
      );
    }

    const { currency: created, error } = await CurrencyCreationService.call({
      currency: {
        ticker,
        name,
        rate,
        rateApi,
        rateApiIdentifier,
        typeOf,
        api,
        icon,
        network,
        chainId,
        symbol,
        contract,
        organizationId: activeOrganizationId,
      },
      denominations: Array.isArray(denominations) ? denominations : [],
      repositories: Array.isArray(repositories) ? repositories : [],
    });

    if (error) return NextResponse.json({ error }, { status: 500 });
    if (!created)
      return NextResponse.json(
        { error: "Failed to create currency" },
        { status: 500 }
      );

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to create currency" },
      { status: 500 }
    );
  }
}
