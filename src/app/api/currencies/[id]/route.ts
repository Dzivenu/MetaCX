import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { CurrencyModel } from "@/server/models/CurrencyModel";

// GET /api/currencies/[id] - Get a specific currency by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const currency = await CurrencyModel.getById(id);

    // Check if currency belongs to the active organization
    if (!currency || currency.organizationId !== activeOrganizationId) {
      return NextResponse.json(
        { error: "Currency not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: currency }, { status: 200 });
  } catch (error) {
    console.error("Error fetching currency:", error);
    return NextResponse.json(
      { error: "Failed to fetch currency" },
      { status: 500 }
    );
  }
}

// PUT /api/currencies/[id] - Update a specific currency
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const currency = await CurrencyModel.getById(id);

    // Check if currency belongs to the active organization
    if (!currency || currency.organizationId !== activeOrganizationId) {
      return NextResponse.json(
        { error: "Currency not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Disallow setting isBaseCurrency via API after creation
    if (Object.prototype.hasOwnProperty.call(body, "isBaseCurrency")) {
      delete body.isBaseCurrency;
    }

    // Update the currency (excluding organizationId and timestamps which should be managed by the model)
    const updatedCurrency = await CurrencyModel.update(id, {
      ...body,
      updatedAt: new Date(),
    });

    return NextResponse.json({ data: updatedCurrency }, { status: 200 });
  } catch (error) {
    console.error("Error updating currency:", error);
    return NextResponse.json(
      { error: "Failed to update currency" },
      { status: 500 }
    );
  }
}

// DELETE /api/currencies/[id] - Delete a specific currency
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params to fix Next.js dynamic route issue
    const { id } = await params;

    const currency = await CurrencyModel.getById(id);

    // Check if currency belongs to the active organization
    if (!currency || currency.organizationId !== activeOrganizationId) {
      return NextResponse.json(
        { error: "Currency not found" },
        { status: 404 }
      );
    }

    // Use find and destroy instead of non-existent delete method
    const currencyInstance = await CurrencyModel.find(id);
    if (currencyInstance) {
      await currencyInstance.destroy();
    }

    return NextResponse.json(
      { message: "Currency deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting currency:", error);
    return NextResponse.json(
      { error: "Failed to delete currency" },
      { status: 500 }
    );
  }
}
