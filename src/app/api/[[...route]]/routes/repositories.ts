import { Hono } from "hono";
import { db } from "@/server/db";
import { repository } from "@/server/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { auth } from "@/server/db/better-auth";
import { GetAllRepositoriesService } from "@/server/services/repository/get-all-repositories.service";
import { CreateRepositoryService } from "@/server/services/repository/create-repository.service";

const repositoriesRouter = new Hono();

// Validation schemas
const createRepositorySchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  typeOf: z.string().optional(),
  currencyType: z.string().optional(),
  form: z.string().optional(),
  floatThresholdBottom: z.number().optional(),
  floatThresholdTop: z.number().optional(),
  floatCountRequired: z.boolean().optional(),
  active: z.boolean().optional(),
});

// GET /repositories - List repositories for organization
repositoriesRouter.get("/", async (c) => {
  try {
    // Require auth and active organization to scope repositories
    const sessionData = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (!sessionData?.session || !sessionData?.user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const activeOrganizationId = sessionData.session.activeOrganizationId;
    if (!activeOrganizationId) {
      return c.json({ error: "No active organization selected" }, 400);
    }

    // Use service to return full repository objects
    const service = new GetAllRepositoriesService({
      organizationId: activeOrganizationId,
    });
    const { repositories, error } = await service.call();
    if (error) {
      return c.json({ error }, 500);
    }

    return c.json({ data: repositories });
  } catch (e: any) {
    return c.json({ error: e?.message || "Failed to fetch repositories" }, 500);
  }
});

// POST /repositories - Create repository
repositoriesRouter.post(
  "/",
  zValidator("json", createRepositorySchema),
  async (c) => {
    try {
      const sessionData = await auth.api.getSession({
        headers: c.req.raw.headers,
      });
      if (!sessionData?.session || !sessionData?.user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const activeOrganizationId = sessionData.session.activeOrganizationId;
      if (!activeOrganizationId) {
        return c.json({ error: "No active organization selected" }, 400);
      }

      const body = c.req.valid("json");
      const {
        name,
        typeOf,
        currencyType,
        form,
        key,
        floatThresholdBottom,
        floatThresholdTop,
        floatCountRequired,
        active,
      } = body;

      const service = new CreateRepositoryService({
        name,
        key,
        organizationId: activeOrganizationId,
        typeOf,
        currencyType,
        form,
        floatThresholdBottom,
        floatThresholdTop,
        floatCountRequired,
        active,
      });

      const { repository: created, error } = await service.call();
      if (error) {
        return c.json({ error }, 500);
      }

      if (!created) {
        return c.json({ error: "Failed to create repository" }, 500);
      }

      return c.json({ data: created }, 201);
    } catch (e: any) {
      return c.json(
        { error: e?.message || "Failed to create repository" },
        500
      );
    }
  }
);

export { repositoriesRouter };
