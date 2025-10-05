import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { GetAllCustomersService } from "@/server/services/customer/get-all-customers.service";
import { CreateCustomerService } from "@/server/services/customer/create-customer.service";

// GET /api/customers - list customers for active organization
export async function GET(request: NextRequest) {
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

    const service = new GetAllCustomersService({ organizationId: activeOrganizationId });
    const { customers, error } = await service.call();
    if (error) return NextResponse.json({ error }, { status: 500 });

    return NextResponse.json({ data: customers }, { status: 200 });
  } catch (err) {
    console.error("Error fetching customers:", err);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

// POST /api/customers - create a new customer in active organization
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
    const { firstName, lastName, title, middleName, dob, occupation, employer, telephone, email } = body || {};

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "firstName and lastName are required" }, { status: 400 });
    }

    const service = new CreateCustomerService({
      organizationId: activeOrganizationId,
      firstName,
      lastName,
      title,
      middleName,
      dob,
      occupation,
      employer,
      telephone,
      email,
    });

    const { customer, error } = await service.call();
    if (error) return NextResponse.json({ error }, { status: 500 });
    if (!customer) return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });

    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (err) {
    console.error("Error creating customer:", err);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
