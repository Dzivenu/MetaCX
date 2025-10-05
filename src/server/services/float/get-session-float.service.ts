import { db } from "@/server/db";
import {
  cxSession,
  repository,
  floatStack,
  denomination,
  currency,
  repositoryAccessLog,
} from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

interface GetSessionFloatServiceParams {
  sessionId: string;
}

interface FloatStackWithDetails {
  id: string;
  openCount: number;
  closeCount: number;
  middayCount: number;
  lastSessionCount: number;
  spentDuringSession: string;
  transferredDuringSession: number;
  denominatedValue: number;
  ticker: string;
  openSpot: number;
  closeSpot: number;
  averageSpot: number;
  openConfirmedDt: Date | null;
  closeConfirmedDt: Date | null;
  denomination: {
    id: string;
    value: number;
    name: string;
  };
  currency: {
    id: string;
    ticker: string;
    name: string;
    typeof: string;
  };
}

interface RepositoryWithFloat {
  id: string;
  name: string;
  floatCountRequired: boolean;
  active: boolean;
  state: string;
  accessLogs: any[];
  float: {
    ticker: string;
    name: string;
    typeof: string;
    floatStacks: FloatStackWithDetails[];
  }[];
}

export class GetSessionFloatService {
  private sessionId: string;

  constructor({ sessionId }: GetSessionFloatServiceParams) {
    this.sessionId = sessionId;
  }

  async call(): Promise<{ data?: any; error?: string }> {
    try {
      // Get session details
      const sessionResult = await db
        .select()
        .from(cxSession)
        .where(eq(cxSession.id, this.sessionId))
        .limit(1);

      if (sessionResult.length === 0) {
        return { error: "Session not found" };
      }

      const session = sessionResult[0];

      // Get repositories for the session's organization
      const repositories = await db
        .select()
        .from(repository)
        .where(eq(repository.organizationId, session.organizationId));

      // Get repository access logs for this session
      const accessLogs = await db
        .select()
        .from(repositoryAccessLog)
        .where(eq(repositoryAccessLog.sessionId, this.sessionId));

      // Get all float stacks for this session
      const floatStacks = await db
        .select({
          floatStack,
          denomination,
          currency,
        })
        .from(floatStack)
        .leftJoin(denomination, eq(floatStack.denominationId, denomination.id))
        .leftJoin(currency, eq(denomination.currencyId, currency.id))
        .where(eq(floatStack.sessionId, this.sessionId));

      // Group float stacks by repository and currency
      const repositoryFloatMap = new Map<
        string,
        Map<string, FloatStackWithDetails[]>
      >();

      for (const item of floatStacks) {
        const { floatStack: fs, denomination: denom, currency: curr } = item;

        if (!fs || !denom || !curr) continue;

        if (!repositoryFloatMap.has(fs.repositoryId)) {
          repositoryFloatMap.set(fs.repositoryId, new Map());
        }

        const repoMap = repositoryFloatMap.get(fs.repositoryId)!;
        if (!repoMap.has(curr.ticker)) {
          repoMap.set(curr.ticker, []);
        }

        const floatStackWithDetails: FloatStackWithDetails = {
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
          denomination: {
            id: denom.id,
            value: denom.value || 0,
            name: denom.name || "",
          },
          currency: {
            id: curr.id,
            ticker: curr.ticker,
            name: curr.name || "",
            typeof: curr.typeof || "",
          },
        };

        repoMap.get(curr.ticker)!.push(floatStackWithDetails);
      }

      // Build the response structure
      const repositoriesWithFloat: RepositoryWithFloat[] = repositories.map(
        (repo) => {
          const repoAccessLogs = accessLogs.filter(
            (log) => log.repositoryId === repo.id
          );
          const repoFloatMap = repositoryFloatMap.get(repo.id);

          // Determine repository state based on access logs
          let state = "DORMANT";
          if (repoAccessLogs.length > 0) {
            const latestLog = repoAccessLogs[repoAccessLogs.length - 1];
            if (latestLog.closeConfirmDt) {
              state = "DORMANT";
            } else if (latestLog.closeStartDt) {
              state = "CLOSE_START";
            } else if (latestLog.openConfirmDt) {
              state = "OPEN_CONFIRMED";
            } else if (latestLog.openStartDt) {
              state = "OPEN_START";
            }
          }

          const float: any[] = [];
          if (repoFloatMap) {
            for (const [ticker, stacks] of repoFloatMap.entries()) {
              if (stacks.length > 0) {
                const currency = stacks[0].currency;
                float.push({
                  ticker,
                  name: currency.name,
                  typeof: currency.typeof,
                  floatStacks: stacks.sort(
                    (a, b) => b.denominatedValue - a.denominatedValue
                  ),
                });
              }
            }
          }

          return {
            id: repo.id,
            name: repo.name,
            floatCountRequired: repo.floatCountRequired || false,
            active: repo.active || true,
            state,
            accessLogs: repoAccessLogs,
            float,
          };
        }
      );

      return {
        data: {
          session,
          repositories: repositoriesWithFloat,
          branches: [
            {
              // Simplified branch structure for compatibility
              id: session.organizationId,
              name: "Main Branch",
            },
          ],
        },
      };
    } catch (error) {
      console.error("Error in GetSessionFloatService:", error);
      return { error: "Failed to get session float data" };
    }
  }
}
