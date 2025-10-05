import { db } from "@/server/db";
import {
  cxSession,
  repository,
  floatStack,
  denomination,
  currency,
  repositoryAccessLog,
} from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

interface StartFloatServiceParams {
  sessionId: string;
  userId: string;
  action: "OPEN" | "CLOSE" | "CANCEL_CLOSE";
}

export class StartFloatService {
  private sessionId: string;
  private userId: string;
  private action: string;

  constructor({ sessionId, userId, action }: StartFloatServiceParams) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.action = action;
  }

  async call(): Promise<{ data?: any; error?: string }> {
    try {
      // Get session
      const sessionResult = await db
        .select()
        .from(cxSession)
        .where(eq(cxSession.id, this.sessionId))
        .limit(1);

      if (sessionResult.length === 0) {
        return { error: "Session not found" };
      }

      const session = sessionResult[0];

      if (this.action === "OPEN") {
        // Update session status to FLOAT_OPEN_START
        await db
          .update(cxSession)
          .set({
            status: "FLOAT_OPEN_START",
            openStartDt: new Date(),
            openStartUserId: this.userId,
            updatedAt: new Date(),
          })
          .where(eq(cxSession.id, this.sessionId));

        // Create repository access logs and float stacks
        await this.createRepositoryAccessLogsAndFloatStacks(
          session.organizationId
        );
      } else if (this.action === "CLOSE") {
        // Update session status to FLOAT_CLOSE_START
        await db
          .update(cxSession)
          .set({
            status: "FLOAT_CLOSE_START",
            closeStartDt: new Date(),
            closeStartUserId: this.userId,
            updatedAt: new Date(),
          })
          .where(eq(cxSession.id, this.sessionId));

        // Update repository access logs for close start
        await db
          .update(repositoryAccessLog)
          .set({
            closeStartDt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(repositoryAccessLog.sessionId, this.sessionId),
              eq(repositoryAccessLog.closeStartDt, null)
            )
          );
      } else if (this.action === "CANCEL_CLOSE") {
        // Revert session status to FLOAT_OPEN_COMPLETE
        await db
          .update(cxSession)
          .set({
            status: "FLOAT_OPEN_COMPLETE",
            closeStartDt: null,
            closeStartUserId: null,
            updatedAt: new Date(),
          })
          .where(eq(cxSession.id, this.sessionId));

        // Revert repository access logs
        await db
          .update(repositoryAccessLog)
          .set({
            closeStartDt: null,
            updatedAt: new Date(),
          })
          .where(eq(repositoryAccessLog.sessionId, this.sessionId));
      }

      return { data: { success: true } };
    } catch (error) {
      console.error("Error in StartFloatService:", error);
      return { error: "Failed to start float operation" };
    }
  }

  private async createRepositoryAccessLogsAndFloatStacks(
    organizationId: string
  ) {
    // Get all repositories for the organization
    const repositories = await db
      .select()
      .from(repository)
      .where(eq(repository.organizationId, organizationId));

    for (const repo of repositories) {
      // Ensure repository access log exists (idempotent)
      const existingAccessLog = await db
        .select()
        .from(repositoryAccessLog)
        .where(
          and(
            eq(repositoryAccessLog.sessionId, this.sessionId),
            eq(repositoryAccessLog.repositoryId, repo.id)
          )
        )
        .limit(1);

      if (existingAccessLog.length === 0) {
        const accessLogId = nanoid();
        await db.insert(repositoryAccessLog).values({
          id: accessLogId,
          sessionId: this.sessionId,
          repositoryId: repo.id,
          userId: this.userId,
          openStartDt: new Date(),
          authorizedUsers: [this.userId],
        });
      }

      // Get denominations for currencies in this repository
      if (repo.currencyTickers && repo.currencyTickers.length > 0) {
        for (const ticker of repo.currencyTickers) {
          // Get currency
          const currencyResult = await db
            .select()
            .from(currency)
            .where(eq(currency.ticker, ticker))
            .limit(1);

          if (currencyResult.length === 0) continue;

          const curr = currencyResult[0];

          // Get denominations for this currency
          const denominations = await db
            .select()
            .from(denomination)
            .where(eq(denomination.currencyId, curr.id));

          // Create float stacks for each denomination
          for (const denom of denominations) {
            // Skip if a float stack already exists for this session/repo/denom/ticker (idempotent)
            const existingStack = await db
              .select()
              .from(floatStack)
              .where(
                and(
                  eq(floatStack.sessionId, this.sessionId),
                  eq(floatStack.repositoryId, repo.id),
                  eq(floatStack.denominationId, denom.id),
                  eq(floatStack.ticker, ticker)
                )
              )
              .limit(1);

            if (existingStack.length > 0) {
              continue;
            }

            const floatStackId = nanoid();

            // Get previous session float stack for this repository/denomination (most recent)
            const previousFloatStacks = await db
              .select()
              .from(floatStack)
              .where(
                and(
                  eq(floatStack.repositoryId, repo.id),
                  eq(floatStack.denominationId, denom.id),
                  eq(floatStack.ticker, ticker)
                )
              )
              .orderBy(desc(floatStack.createdAt))
              .limit(1);

            const lastSessionCount =
              previousFloatStacks.length > 0
                ? previousFloatStacks[0].closeCount || 0
                : 0;

            await db.insert(floatStack).values({
              id: floatStackId,
              sessionId: this.sessionId,
              repositoryId: repo.id,
              denominationId: denom.id,
              ticker,
              denominatedValue: denom.value || 0,
              lastSessionCount,
              previousSessionFloatStackId:
                previousFloatStacks.length > 0
                  ? previousFloatStacks[0].id
                  : null,
            });
          }
        }
      }
    }
  }
}
