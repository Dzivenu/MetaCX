import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { GetDenominationService } from "@/server/services/denomination/get-denomination.service";
import { UpdateDenominationService } from "@/server/services/denomination/update-denomination.service";
import { DeleteDenominationService } from "@/server/services/denomination/delete-denomination.service";

// GET /api/denominations/[id] - Get a specific denomination by ID
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

    const service = new GetDenominationService({ id });
    const { denomination, error } = await service.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!denomination) {
      return NextResponse.json(
        { error: "Denomination not found" },
        { status: 404 }
      );
    }

    // TODO: Check if the denomination belongs to a currency in the active organization

    return NextResponse.json({ data: denomination }, { status: 200 });
  } catch (error) {
    console.error("Error fetching denomination:", error);
    return NextResponse.json(
      { error: "Failed to fetch denomination" },
      { status: 500 }
    );
  }
}

// PUT /api/denominations/[id] - Update a specific denomination
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

    const body = await request.json();
    const { value, currencyId, accepted } = body;

    // Get the denomination first
    const getService = new GetDenominationService({ id });
    const { denomination: existingDenom, error: getError } =
      await getService.call();

    if (getError) {
      return NextResponse.json({ error: getError }, { status: 500 });
    }

    if (!existingDenom) {
      return NextResponse.json(
        { error: "Denomination not found" },
        { status: 404 }
      );
    }

    // TODO: Check if the denomination belongs to a currency in the active organization

    // Update the denomination
    const updateService = new UpdateDenominationService({
      id,
      value,
      currencyId,
      accepted,
    });

    const { denomination, error } = await updateService.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!denomination) {
      return NextResponse.json(
        { error: "Failed to update denomination" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: denomination }, { status: 200 });
  } catch (error) {
    console.error("Error updating denomination:", error);
    return NextResponse.json(
      { error: "Failed to update denomination" },
      { status: 500 }
    );
  }
}

// DELETE /api/denominations/[id] - Delete a specific denomination
export async function DELETE(
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

    // Get the denomination first
    const getService = new GetDenominationService({ id });
    const { denomination: existingDenom, error: getError } =
      await getService.call();

    if (getError) {
      return NextResponse.json({ error: getError }, { status: 500 });
    }

    if (!existingDenom) {
      return NextResponse.json(
        { error: "Denomination not found" },
        { status: 404 }
      );
    }

    // TODO: Check if the denomination belongs to a currency in the active organization

    // Delete the denomination
    const deleteService = new DeleteDenominationService({ id });
    const { success, error } = await deleteService.call();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete denomination" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Denomination deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting denomination:", error);
    return NextResponse.json(
      { error: "Failed to delete denomination" },
      { status: 500 }
    );
  }
}
