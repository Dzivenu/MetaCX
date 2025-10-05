import { Hono } from "hono";
import { db } from "@/server/db";
import { cxSession } from "@/server/db/schema";
import { eq, and, gte, lte, desc, asc, count } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const cxSessionRouter = new Hono();

// Validation schemas
const createCxSessionSchema = z.object({
  openStartDt: z.string().datetime().optional(),
  openConfirmDt: z.string().datetime().optional(),
  closeStartDt: z.string().datetime().optional(),
  closeConfirmDt: z.string().datetime().optional(),
  userId: z.string().optional(),
  organizationId: z.string(),
  status: z.string().optional(),
  verifiedByUserId: z.string().optional(),
  verifiedDt: z.string().datetime().optional(),
  openStartUserId: z.string().optional(),
  openConfirmUserId: z.string().optional(),
  closeStartUserId: z.string().optional(),
  closeConfirmUserId: z.string().optional(),
});

const updateCxSessionSchema = createCxSessionSchema.partial();

const querySchema = z.object({
  page: z.string().transform(Number).default("1"),
  limit: z.string().transform(Number).default("10"),
  organizationId: z.string().optional(),
  userId: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "openStartDt", "closeStartDt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// GET /cx-sessions - List with pagination and filtering
cxSessionRouter.get("/", zValidator("query", querySchema), async (c) => {
  try {
    const {
      page,
      limit,
      organizationId,
      userId,
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = c.req.valid("query");

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (organizationId) {
      conditions.push(eq(cxSession.organizationId, organizationId));
    }

    if (userId) {
      conditions.push(eq(cxSession.userId, userId));
    }

    if (status) {
      conditions.push(eq(cxSession.status, status));
    }

    if (startDate) {
      conditions.push(gte(cxSession.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(cxSession.createdAt, new Date(endDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(cxSession)
      .where(whereClause);

    const total = totalResult.count;

    // Get paginated results
    const orderBy =
      sortOrder === "desc" ? desc(cxSession[sortBy]) : asc(cxSession[sortBy]);

    const sessions = await db
      .select()
      .from(cxSession)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return c.json({
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching cx sessions:", error);
    return c.json({ error: "Failed to fetch sessions" }, 500);
  }
});

// GET /cx-sessions/:id - Get single session
cxSessionRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const [session] = await db
      .select()
      .from(cxSession)
      .where(eq(cxSession.id, id));

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    return c.json({ data: session });
  } catch (error) {
    console.error("Error fetching cx session:", error);
    return c.json({ error: "Failed to fetch session" }, 500);
  }
});

// POST /cx-sessions - Create new session
cxSessionRouter.post(
  "/",
  zValidator("json", createCxSessionSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      // Convert date strings to Date objects
      const sessionData = {
        ...data,
        id: crypto.randomUUID(),
        openStartDt: data.openStartDt ? new Date(data.openStartDt) : null,
        openConfirmDt: data.openConfirmDt ? new Date(data.openConfirmDt) : null,
        closeStartDt: data.closeStartDt ? new Date(data.closeStartDt) : null,
        closeConfirmDt: data.closeConfirmDt
          ? new Date(data.closeConfirmDt)
          : null,
        verifiedDt: data.verifiedDt ? new Date(data.verifiedDt) : null,
      };

      const [newSession] = await db
        .insert(cxSession)
        .values(sessionData)
        .returning();

      return c.json({ data: newSession }, 201);
    } catch (error) {
      console.error("Error creating cx session:", error);
      return c.json({ error: "Failed to create session" }, 500);
    }
  }
);

// PUT /cx-sessions/:id - Update session
cxSessionRouter.put(
  "/:id",
  zValidator("json", updateCxSessionSchema),
  async (c) => {
    try {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      // Convert date strings to Date objects
      const updateData = {
        ...data,
        openStartDt: data.openStartDt ? new Date(data.openStartDt) : undefined,
        openConfirmDt: data.openConfirmDt
          ? new Date(data.openConfirmDt)
          : undefined,
        closeStartDt: data.closeStartDt
          ? new Date(data.closeStartDt)
          : undefined,
        closeConfirmDt: data.closeConfirmDt
          ? new Date(data.closeConfirmDt)
          : undefined,
        verifiedDt: data.verifiedDt ? new Date(data.verifiedDt) : undefined,
        updatedAt: new Date(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      const [updatedSession] = await db
        .update(cxSession)
        .set(updateData)
        .where(eq(cxSession.id, id))
        .returning();

      if (!updatedSession) {
        return c.json({ error: "Session not found" }, 404);
      }

      return c.json({ data: updatedSession });
    } catch (error) {
      console.error("Error updating cx session:", error);
      return c.json({ error: "Failed to update session" }, 500);
    }
  }
);

// DELETE /cx-sessions/:id - Delete session
cxSessionRouter.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const [deletedSession] = await db
      .delete(cxSession)
      .where(eq(cxSession.id, id))
      .returning();

    if (!deletedSession) {
      return c.json({ error: "Session not found" }, 404);
    }

    return c.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting cx session:", error);
    return c.json({ error: "Failed to delete session" }, 500);
  }
});

export { cxSessionRouter };
