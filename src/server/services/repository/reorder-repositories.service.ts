import { db } from "@/server/db";
import { repository } from "@/server/db/schema";
import { and, asc, eq } from "drizzle-orm";

export interface ReorderRepositoriesParams {
  organizationId: string;
  orderedRepositoryIds: string[];
}

export interface ReorderRepositoriesResult {
  success: boolean;
  error?: string;
}

export class ReorderRepositoriesService {
  private params: ReorderRepositoriesParams;

  constructor(params: ReorderRepositoriesParams) {
    this.params = params;
  }

  async call(): Promise<ReorderRepositoriesResult> {
    try {
      const { organizationId, orderedRepositoryIds } = this.params;

      if (!organizationId)
        return { success: false, error: "organizationId required" };
      if (
        !Array.isArray(orderedRepositoryIds) ||
        orderedRepositoryIds.length === 0
      )
        return {
          success: false,
          error: "orderedRepositoryIds must be a non-empty array",
        };

      // Fetch current repositories for org
      const rows = await db
        .select({ id: repository.id })
        .from(repository)
        .where(eq(repository.organizationId, organizationId))
        .orderBy(asc(repository.displayOrderId));

      const existingIds = rows.map((r) => r.id);

      // Validate that provided IDs match exactly the existing set
      if (existingIds.length !== orderedRepositoryIds.length) {
        return {
          success: false,
          error:
            "Provided ordering does not match organization repository count",
        };
      }

      const providedSet = new Set(orderedRepositoryIds);
      for (const id of existingIds) {
        if (!providedSet.has(id)) {
          return {
            success: false,
            error:
              "Provided ordering is missing or contains unknown repository IDs",
          };
        }
      }

      // Persist new order: assign 1..N based on array order
      for (let i = 0; i < orderedRepositoryIds.length; i += 1) {
        const id = orderedRepositoryIds[i];
        const position = i + 1;
        await db
          .update(repository)
          .set({ displayOrderId: position, updatedAt: new Date() })
          .where(
            and(
              eq(repository.id, id),
              eq(repository.organizationId, organizationId)
            )
          );
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: "Failed to reorder repositories" };
    }
  }
}
