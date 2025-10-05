import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { GetAllDenominationsService } from "@/server/services/denomination/get-all-denominations.service";
import { CreateDenominationService } from "@/server/services/denomination/create-denomination.service";

// GET /api/denominations - Get all denominations for a currency
export async function GET(request: NextRequest) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the active organization from the session
    const activeOrganizationId = sessionData.session.activeOrganizationId;

    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active organization selected" },
        { status: 400 }
      );
    }

    // Get currencyId from query parameters
    const { searchParams } = new URL(request.url);
    const currencyId = searchParams.get('currencyId');

    if (!currencyId) {
      return NextResponse.json(
        { error: "Currency ID is required" },
        { status: 400 }
      );
    }

    // Get all denominations for the currency
    const service = new GetAllDenominationsService({ currencyId });
    const { denominations, error } = await service.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data: denominations }, { status: 200 });
  } catch (error) {
    console.error("Error fetching denominations:", error);
    return NextResponse.json(
      { error: "Failed to fetch denominations" },
      { status: 500 }
    );
  }
}

// POST /api/denominations - Create a new denomination
export async function POST(request: NextRequest) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the active organization from the session
    const activeOrganizationId = sessionData.session.activeOrganizationId;

    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active organization selected" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { value, currencyId, accepted } = body;

    // Validate required fields
    if (!currencyId) {
      return NextResponse.json(
        { error: "Currency ID is required" },
        { status: 400 }
      );
    }

    // Create the denomination
    const service = new CreateDenominationService({
      value,
      currencyId,
      accepted,
    });

    const { denomination, error } = await service.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!denomination) {
      return NextResponse.json(
        { error: "Failed to create denomination" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: denomination }, { status: 201 });
  } catch (error) {
    console.error("Error creating denomination:", error);
    return NextResponse.json(
      { error: "Failed to create denomination" },
      { status: 500 }
    );
  }
}
