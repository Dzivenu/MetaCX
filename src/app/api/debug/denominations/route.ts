import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { db } from "@/server/db";
import { currency, denomination } from "@/server/db/schema";
import { eq } from "drizzle-orm";

// GET /api/debug/denominations - Check what denominations exist
export async function GET(request: NextRequest) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

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

    // Get all currencies for this organization
    const currencies = await db
      .select()
      .from(currency)
      .where(eq(currency.organizationId, activeOrganizationId));

    // Get denominations for each currency
    const currenciesWithDenominations = await Promise.all(
      currencies.map(async (curr) => {
        const denominations = await db
          .select()
          .from(denomination)
          .where(eq(denomination.currencyId, curr.id));

        return {
          currency: curr,
          denominations,
        };
      })
    );

    return NextResponse.json({
      message: "Denominations debug info",
      data: currenciesWithDenominations,
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching denominations debug info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/debug/denominations - Create default denominations for currencies that don't have any
export async function POST(request: NextRequest) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

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

    // Get all currencies for this organization
    const currencies = await db
      .select()
      .from(currency)
      .where(eq(currency.organizationId, activeOrganizationId));

    const createdDenominations = [];

    // For each currency, check if it has denominations, if not create default ones
    for (const curr of currencies) {
      const existingDenominations = await db
        .select()
        .from(denomination)
        .where(eq(denomination.currencyId, curr.id));

      if (existingDenominations.length === 0) {
        console.log(`Creating default denominations for ${curr.ticker}`);
        
        // Create default denominations based on currency type
        let defaultDenominations = [];
        
        if (curr.typeOf === 'fiat') {
          // Default fiat denominations
          defaultDenominations = [
            { name: '1', value: 1 },
            { name: '5', value: 5 },
            { name: '10', value: 10 },
            { name: '20', value: 20 },
            { name: '50', value: 50 },
            { name: '100', value: 100 },
          ];
        } else {
          // Default crypto denominations
          defaultDenominations = [
            { name: '0.001', value: 0.001 },
            { name: '0.01', value: 0.01 },
            { name: '0.1', value: 0.1 },
            { name: '1', value: 1 },
          ];
        }

        // Insert denominations
        const denominationData = defaultDenominations.map(denom => ({
          id: crypto.randomUUID(),
          name: denom.name,
          value: denom.value,
          currencyId: curr.id,
          accepted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        const result = await db.insert(denomination).values(denominationData).returning();
        createdDenominations.push({
          currency: curr.ticker,
          denominations: result,
        });
      }
    }

    return NextResponse.json({
      message: "Default denominations created",
      created: createdDenominations,
    }, { status: 200 });

  } catch (error) {
    console.error("Error creating default denominations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
