import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { GetCustomerByIdService } from "@/server/services/customer/get-customer-by-id.service";

// GET /api/customers/[id] - get a single customer by id (scoped to active organization)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const service = new GetCustomerByIdService({
      id,
      organizationId: activeOrganizationId,
    });
    const { customer, error } = await service.call();
    if (error) return NextResponse.json({ error }, { status: 404 });

    return NextResponse.json({ data: customer }, { status: 200 });
  } catch (err) {
    console.error("Error fetching customer:", err);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}
