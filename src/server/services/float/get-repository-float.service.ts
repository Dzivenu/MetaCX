import { db } from "@/server/db";
import {
  repository,
  floatStack,
  denomination,
  currency,
  repositoryAccessLog,
} from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

interface GetRepositoryFloatServiceParams {
  repositoryId: string;
  sessionId: string;
}

export class GetRepositoryFloatService {
  private repositoryId: string;
  private sessionId: string;

  constructor({ repositoryId, sessionId }: GetRepositoryFloatServiceParams) {
    this.repositoryId = repositoryId;
    this.sessionId = sessionId;
  }

  async call(): Promise<{ data?: any; error?: string }> {
    try {
      // Get repository details
      const repositoryResult = await db
        .select()
        .from(repository)
        .where(eq(repository.id, this.repositoryId))
        .limit(1);

      if (repositoryResult.length === 0) {
        return { error: "Repository not found" };
      }

      const repo = repositoryResult[0];

      // Get repository access log for this session
      const accessLogResult = await db
        .select()
        .from(repositoryAccessLog)
        .where(
          and(
            eq(repositoryAccessLog.repositoryId, this.repositoryId),
            eq(repositoryAccessLog.sessionId, this.sessionId)
          )
        )
        .limit(1);

      const accessLog = accessLogResult.length > 0 ? accessLogResult[0] : null;

      // Get float stacks for this repository and session
      const floatStacks = await db
        .select({
          floatStack,
          denomination,
          currency,
        })
        .from(floatStack)
        .leftJoin(denomination, eq(floatStack.denominationId, denomination.id))
        .leftJoin(currency, eq(denomination.currencyId, currency.id))
        .where(
          and(
            eq(floatStack.repositoryId, this.repositoryId),
            eq(floatStack.sessionId, this.sessionId)
          )
        );

      // Group float stacks by currency
      const currencyFloatMap = new Map<string, any>();

      for (const item of floatStacks) {
        const { floatStack: fs, denomination: denom, currency: curr } = item;

        if (!fs || !denom || !curr) continue;

        if (!currencyFloatMap.has(curr.ticker)) {
          currencyFloatMap.set(curr.ticker, {
            id: curr.id,
            ticker: curr.ticker,
            name: curr.name,
            typeof: curr.typeof,
            floatStacks: [],
          });
        }

        const floatStackWithDetails = {
          id: fs.id,
          openCount: fs.openCount || 0,
          closeCount: fs.closeCount || 0,
          middayCount: fs.middayCount || 0,
          lastSessionCount: fs.lastSessionCount || 0,
          spentDuringSession: fs.spentDuringSession || "0.0",
          transferredDuringSession: fs.transferredDuringSession || 0,
          denominatedValue: fs.denominatedValue || 0,
          ticker: fs.ticker,
          openSpot: fs.openSpot || 0,
          closeSpot: fs.closeSpot || 0,
          averageSpot: fs.averageSpot || 0,
          openConfirmedDt: fs.openConfirmedDt,
          closeConfirmedDt: fs.closeConfirmedDt,
          value: denom.value || 0, // For compatibility with frontend
          denomination: {
            id: denom.id,
            value: denom.value || 0,
            name: denom.name || "",
          },
        };

        currencyFloatMap
          .get(curr.ticker)!
          .floatStacks.push(floatStackWithDetails);
      }

      // Convert to array and sort float stacks by value (descending)
      const float = Array.from(currencyFloatMap.values()).map((currency) => ({
        ...currency,
        floatStacks: currency.floatStacks.sort(
          (a: any, b: any) => b.denominatedValue - a.denominatedValue
        ),
      }));

      // Determine repository state
      let state = "DORMANT";
      if (accessLog) {
        if (accessLog.closeConfirmDt) {
          state = "DORMANT";
        } else if (accessLog.closeStartDt) {
          state = "CLOSE_START";
        } else if (accessLog.openConfirmDt) {
          state = "OPEN_CONFIRMED";
        } else if (accessLog.openStartDt) {
          state = "OPEN_START";
        }
      }

      return {
        data: {
          id: repo.id,
          name: repo.name,
          floatCountRequired: repo.floatCountRequired || false,
          active: repo.active || true,
          state,
          accessLogs: accessLog ? [accessLog] : [],
          float,
        },
      };
    } catch (error) {
      console.error("Error in GetRepositoryFloatService:", error);
      return { error: "Failed to get repository float data" };
    }
  }
}
