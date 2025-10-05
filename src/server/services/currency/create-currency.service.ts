import { db } from "@/server/db";
import { currency } from "@/server/db/schema/currencies";
import { denomination } from "@/server/db/schema/denominations";
import { repository } from "@/server/db/schema/repositories";
import { floatStack } from "@/server/db/schema/float-stacks";
import { cxSession } from "@/server/db/schema/cx-session";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface CurrencyCreationParams {
  currency: {
    rate?: number;
    name?: string;
    ticker: string;
    rateApi?: string;
    rateApiIdentifier: string;
    typeOf?: string;
    api?: number;
    icon?: string;
    network?: string;
    chainId?: string;
    symbol?: string;
    contract?: string;
    organizationId: string;
  };
  denominations: Array<{
    value: number;
  }>;
  repositories: string[]; // array of repository ids
}

export interface CurrencyCreationResult {
  currency: typeof currency.$inferSelect | null;
  denominations: (typeof denomination.$inferSelect)[] | null;
  repositories: (typeof repository.$inferSelect)[] | null;
  floatStacks: (typeof floatStack.$inferSelect)[] | null;
  error: string | null;
}

export class CurrencyCreationService {
  private currency: typeof currency.$inferSelect | null = null;
  private denominations: (typeof denomination.$inferSelect)[] = [];
  private repositories: (typeof repository.$inferSelect)[] = [];
  private floatStacks: (typeof floatStack.$inferSelect)[] = [];
  private error: string | null = null;
  private currencyParams: CurrencyCreationParams["currency"];
  private denominationParams: CurrencyCreationParams["denominations"];
  private repositoryIds: string[];

  constructor(params: CurrencyCreationParams) {
    this.currencyParams = params.currency;
    this.denominationParams = params.denominations;
    this.repositoryIds = params.repositories;
  }

  static async call(
    params: CurrencyCreationParams
  ): Promise<CurrencyCreationResult> {
    const service = new CurrencyCreationService(params);
    return await service.execute();
  }

  async execute(): Promise<CurrencyCreationResult> {
    try {
      // Validate params
      await this.validateParams();
      if (this.error) return this.getResult();

      // Build currency
      await this.buildCurrency();
      if (this.error) return this.getResult();

      // Build denominations
      await this.buildDenominations();
      if (this.error) return this.getResult();

      // Attach to repositories
      await this.buildRepositories();
      if (this.error) return this.getResult();

      // Commit all changes
      await this.commitCurrency();

      return this.getResult();
    } catch (error) {
      console.error("Error in currency creation:", error);
      this.error =
        error instanceof Error ? error.message : "Unknown error occurred";
      return this.getResult();
    }
  }

  private async validateParams(): Promise<void> {
    try {
      // Basic validation
      if (!this.currencyParams.ticker) {
        this.error = "Currency ticker is required";
        return;
      }

      if (!this.currencyParams.rateApiIdentifier) {
        this.error = "Rate API identifier is required";
        return;
      }

      if (!this.currencyParams.organizationId) {
        this.error = "Organization ID is required";
        return;
      }

      // Check if currency with same ticker already exists
      const existingCurrency = await db
        .select()
        .from(currency)
        .where(eq(currency.ticker, this.currencyParams.ticker))
        .limit(1);

      if (existingCurrency.length > 0) {
        this.error = `Currency with ticker ${this.currencyParams.ticker} already exists`;
        return;
      }

      // Validate denominations
      if (!this.denominationParams || this.denominationParams.length === 0) {
        this.error = "At least one denomination is required";
        return;
      }

      for (const denom of this.denominationParams) {
        if (!denom.value || denom.value <= 0) {
          this.error = "All denominations must have a positive value";
          return;
        }
      }

      // Validate repositories exist
      if (this.repositoryIds.length > 0) {
        const existingRepos = await db
          .select()
          .from(repository)
          .where(inArray(repository.id, this.repositoryIds));

        if (existingRepos.length !== this.repositoryIds.length) {
          this.error = "One or more specified repositories do not exist";
          return;
        }
      }
    } catch (error) {
      console.error("Error validating params:", error);
      this.error = "Validation failed";
    }
  }

  private async buildCurrency(): Promise<void> {
    try {
      // Get the maximum float display order
      const maxOrderResult = await db
        .select({
          maxOrder: sql<number>`COALESCE(MAX(${currency.floatDisplayOrder}), 0)`,
        })
        .from(currency);

      const maxOrder = maxOrderResult[0]?.maxOrder || 0;

      // Create currency with all required fields
      const currencyData = {
        id: nanoid(),
        name: this.currencyParams.name || this.currencyParams.ticker,
        ticker: this.currencyParams.ticker,
        rate: this.currencyParams.rate || 1.0,
        rateApi: this.currencyParams.rateApi || "",
        rateApiIdentifier: this.currencyParams.rateApiIdentifier,
        typeOf: this.currencyParams.typeOf,
        api: this.currencyParams.api || 0, // 0 = manual, 1 = automated
        icon: this.currencyParams.icon,
        network: this.currencyParams.network,
        chainId: this.currencyParams.chainId,
        symbol: this.currencyParams.symbol,
        contract: this.currencyParams.contract,
        organizationId: this.currencyParams.organizationId,
        floatDisplayOrder: maxOrder + 1,
        tradeable: true,
        rateUpdatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isBaseCurrency: false,
      };

      // Determine if first currency in organization
      const existingCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(currency)
        .where(eq(currency.organizationId, this.currencyParams.organizationId));

      const isFirstCurrency = Number(existingCount[0]?.count || 0) === 0;
      // If first currency ever for org, set as base; otherwise remain false
      if (isFirstCurrency) {
        currencyData.isBaseCurrency = true;
      }

      const result = await db.insert(currency).values(currencyData).returning();
      this.currency = result[0];
    } catch (error) {
      console.error("Error building currency:", error);
      this.error = "Failed to create currency";
    }
  }

  private async buildDenominations(): Promise<void> {
    try {
      if (!this.currency) {
        this.error = "Currency must be created before denominations";
        return;
      }

      const denominationData = this.denominationParams.map((denom) => ({
        id: nanoid(),
        value: denom.value,
        currencyId: this.currency!.id,
        accepted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Validate each denomination before inserting
      for (const denom of denominationData) {
        if (!denom.value || denom.value <= 0) {
          this.error = "Invalid denomination value";
          // Clean up currency if denominations fail
          await db.delete(currency).where(eq(currency.id, this.currency!.id));
          return;
        }
      }

      const result = await db
        .insert(denomination)
        .values(denominationData)
        .returning();
      this.denominations = result;
    } catch (error) {
      console.error("Error building denominations:", error);
      this.error = "Failed to create denominations";
      // Clean up currency if denominations fail
      if (this.currency) {
        await db.delete(currency).where(eq(currency.id, this.currency.id));
      }
    }
  }

  private async buildRepositories(): Promise<void> {
    try {
      if (this.repositoryIds.length === 0) {
        return; // No repositories to attach
      }

      if (!this.currency) {
        this.error = "Currency must be created before repository associations";
        return;
      }

      // Get existing repositories
      const existingRepos = await db
        .select()
        .from(repository)
        .where(inArray(repository.id, this.repositoryIds));

      // Update each repository to include the new currency ticker
      for (const repo of existingRepos) {
        const currentTickers = (repo.currencyTickers || []).filter(
          (ticker): ticker is string => Boolean(ticker)
        );
        const newTicker = String(this.currency!.ticker ?? "");
        if (!currentTickers.includes(newTicker)) {
          const updatedTickers = [...currentTickers, newTicker];

          const result = await db
            .update(repository)
            .set({
              currencyTickers: updatedTickers,
              updatedAt: new Date(),
            })
            .where(eq(repository.id, repo.id))
            .returning();

          if (result!.length === 0) {
            this.error = `Failed to update repository ${repo.id}`;
            // Clean up currency and denominations if repository update fails
            await this.cleanup();
            return;
          }
        }
      }

      this.repositories = existingRepos;
    } catch (error) {
      console.error("Error building repositories:", error);
      this.error = "Failed to associate repositories";
      await this.cleanup();
    }
  }

  private async buildFloat(): Promise<void> {
    try {
      if (this.repositoryIds.length === 0 || this.denominations.length === 0) {
        return; // No float stacks to create
      }

      // Get the last two CX sessions (equivalent to Session.second_to_last and Session.last in Rails)
      const sessions = await db
        .select()
        .from(cxSession)
        .orderBy(desc(cxSession.createdAt))
        .limit(2);

      if (sessions.length < 2) {
        console.warn("Not enough CX sessions to create float stacks");
        return;
      }

      const [currentSession, previousSession] = sessions;

      // Create float stacks for each repository and denomination combination
      for (const repoId of this.repositoryIds) {
        for (const denom of this.denominations) {
          // Create previous session float stack
          const prevFloatStackData = {
            id: nanoid(),
            denominatedValue: denom.value,
            denominationId: denom.id,
            repositoryId: repoId,
            closeCount: 0.0,
            sessionId: previousSession.id,
            ticker: String(this.currency!.ticker ?? ""),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Create current session float stack
          const currentFloatStackData = {
            id: nanoid(),
            denominatedValue: denom.value,
            denominationId: denom.id,
            repositoryId: repoId,
            openCount: 0.0,
            sessionId: currentSession.id,
            ticker: String(this.currency!.ticker ?? ""),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const prevResult = await db
            .insert(floatStack)
            .values(prevFloatStackData)
            .returning();
          const currentResult = await db
            .insert(floatStack)
            .values(currentFloatStackData)
            .returning();

          this.floatStacks.push(...prevResult, ...currentResult);
        }
      }
    } catch (error) {
      console.error("Error building float stacks:", error);
      // Note: We don't set error here as float stack creation is not critical
      // and matches the backend behavior where this is done after commit
    }
  }

  private async commitCurrency(): Promise<void> {
    try {
      // All main entities are already saved, now create float stacks
      await this.buildFloat();
    } catch (error) {
      console.error("Error committing currency:", error);
      this.error = "Failed to complete currency creation";
    }
  }

  private async cleanup(): Promise<void> {
    try {
      // Clean up in reverse order of creation
      if (this.currency) {
        // Remove denominations
        await db
          .delete(denomination)
          .where(eq(denomination.currencyId, this.currency.id));

        // Remove currency
        await db.delete(currency).where(eq(currency.id, this.currency.id));
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }

  private getResult(): CurrencyCreationResult {
    return {
      currency: this.currency,
      denominations: this.denominations,
      repositories: this.repositories,
      floatStacks: this.floatStacks,
      error: this.error,
    };
  }
}

// Export for convenience
export default CurrencyCreationService;
