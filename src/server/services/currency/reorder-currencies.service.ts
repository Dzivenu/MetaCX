import { db } from "@/server/db";
import { currency } from "@/server/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";

export interface ReorderCurrenciesParams {
  organizationId: string;
  orderedCurrencyIds: string[]; // desired order top->bottom
}

export interface ReorderCurrenciesResult {
  success: boolean;
  error?: string;
}

export class ReorderCurrenciesService {
  private params: ReorderCurrenciesParams;

  constructor(params: ReorderCurrenciesParams) {
    this.params = params;
  }

  async call(): Promise<ReorderCurrenciesResult> {
    try {
      const { organizationId, orderedCurrencyIds } = this.params;

      if (!organizationId)
        return { success: false, error: "organizationId required" };
      if (!Array.isArray(orderedCurrencyIds) || orderedCurrencyIds.length === 0)
        return {
          success: false,
          error: "orderedCurrencyIds must be a non-empty array",
        };

      // Fetch current currencies for org
      const rows = await db
        .select({ id: currency.id })
        .from(currency)
        .where(eq(currency.organizationId, organizationId))
        .orderBy(asc(currency.floatDisplayOrder));

      const existingIds = rows.map((r) => r.id);

      // Validate that provided IDs match exactly the existing set
      if (existingIds.length !== orderedCurrencyIds.length) {
        return {
          success: false,
          error: "Provided ordering does not match organization currency count",
        };
      }

      const providedSet = new Set(orderedCurrencyIds);
      for (const id of existingIds) {
        if (!providedSet.has(id)) {
          return {
            success: false,
            error:
              "Provided ordering is missing or contains unknown currency IDs",
          };
        }
      }

      // Persist new order: assign 1..N based on array order
      for (let i = 0; i < orderedCurrencyIds.length; i += 1) {
        const id = orderedCurrencyIds[i];
        const position = i + 1;
        await db
          .update(currency)
          .set({ floatDisplayOrder: position, updatedAt: new Date() })
          .where(
            and(
              eq(currency.id, id),
              eq(currency.organizationId, organizationId)
            )
          );
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: "Failed to reorder currencies" };
    }
  }
}
