import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { api } from "../../../../../convex/_generated/api";
import { getConvexClient } from "@/server/convex/server-client";

export const runtime = "nodejs";

// Clerk webhook: handles organization.created and organization.updated
export async function POST(req: NextRequest) {
  try {
    const svix_id = req.headers.get("svix-id");
    const svix_timestamp = req.headers.get("svix-timestamp");
    const svix_signature = req.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: "Missing Svix headers" },
        { status: 400 }
      );
    }

    const payload = await req.text();
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

    let evt: any;
    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const eventType = evt?.type as string | undefined;
    const data = evt?.data as any;

    // Only handle organization events
    if (
      eventType === "organization.created" ||
      eventType === "organization.updated"
    ) {
      const orgId = data?.id as string | undefined;
      const slug = data?.slug as string | undefined;
      const name = data?.name as string | undefined;
      const imageUrl = data?.image_url as string | undefined;

      if (!orgId || !slug || !name) {
        return NextResponse.json(
          { error: "Missing organization fields" },
          { status: 400 }
        );
      }

      const convex = await getConvexClient();
      await convex.mutation(api.functions.organizations.upsertByClerkId, {
        clerkOrganizationId: orgId,
        slug,
        name,
        imageUrl,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
