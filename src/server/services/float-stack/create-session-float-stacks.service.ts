import { db } from "@/server/db";
import { floatStack, repository, currency, denomination, cxSession } from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";

export interface CreateSessionFloatStacksParams {
  sessionId: string;
  organizationId: string;
  repositoryIds?: string[]; // Optional: specific repositories, if not provided, all org repositories
}

export interface CreateSessionFloatStacksResult {
  floatStacks: (typeof floatStack.$inferSelect)[];
  error: string | null;
}

export class CreateSessionFloatStacksService {
  private floatStacks: (typeof floatStack.$inferSelect)[] = [];
  private error: string | null = null;
  private sessionId: string;
  private organizationId: string;
  private repositoryIds?: string[];

  constructor(params: CreateSessionFloatStacksParams) {
    this.sessionId = params.sessionId;
    this.organizationId = params.organizationId;
    this.repositoryIds = params.repositoryIds;
  }

  async call(): Promise<CreateSessionFloatStacksResult> {
    try {
      await this.validateSession();
      await this.createFloatStacks();
      return { floatStacks: this.floatStacks, error: null };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Failed to create float stacks";
      return { floatStacks: [], error: this.error };
    }
  }

  private async validateSession(): Promise<void> {
    const sessions = await db
      .select()
      .from(cxSession)
      .where(
        and(
          eq(cxSession.id, this.sessionId),
          eq(cxSession.organizationId, this.organizationId)
        )
      )
      .limit(1);

    if (sessions.length === 0) {
      throw new Error("Session not found or access denied");
    }
  }

  private async createFloatStacks(): Promise<void> {
    console.log(`🔍 Starting float stack creation for session ${this.sessionId}`);
    
    // Get repositories for this organization (filtered by repositoryIds if provided)
    const repositoryQuery = db
      .select()
      .from(repository)
      .where(eq(repository.organizationId, this.organizationId));

    const repositories = this.repositoryIds 
      ? await repositoryQuery.where(eq(repository.id, this.repositoryIds[0])) // TODO: Handle multiple repository IDs
      : await repositoryQuery;

    console.log(`📁 Found ${repositories.length} repositories for organization ${this.organizationId}`);
    repositories.forEach(repo => {
      console.log(`  - Repository: ${repo.name} (${repo.id}) - Currency Tickers: ${JSON.stringify(repo.currencyTickers)}`);
    });

    // Get previous session to link float stacks (like Ruby's previous_session_with_repository_access)
    const previousSessions = await db
      .select()
      .from(cxSession)
      .where(
        and(
          eq(cxSession.organizationId, this.organizationId),
          // Get sessions before current one
        )
      )
      .orderBy(desc(cxSession.createdAt))
      .limit(2); // Get last 2 sessions to find the previous one

    const previousSession = previousSessions.find(s => s.id !== this.sessionId);
    console.log(`🔗 Previous session: ${previousSession ? previousSession.id : 'None found'}`);

    // For each repository, create float stacks for all its currencies and denominations
    for (const repo of repositories) {
      console.log(`\n🏪 Processing repository: ${repo.name} (${repo.id})`);
      
      // Get currencies for this repository from currencyTickers
      const repoCurrencies = repo.currencyTickers ? 
        (Array.isArray(repo.currencyTickers) ? repo.currencyTickers : JSON.parse(repo.currencyTickers as string)) : [];
      
      console.log(`💱 Repository currency tickers: ${JSON.stringify(repoCurrencies)}`);
      
      if (repoCurrencies.length === 0) {
        console.log(`⚠️  No currency tickers found for repository ${repo.name}`);
        continue;
      }
      
      // Get all currencies that match the repository's tickers
      const currencies = await db
        .select()
        .from(currency)
        .where(eq(currency.organizationId, this.organizationId));

      console.log(`💰 Found ${currencies.length} total currencies in organization`);
      const matchingCurrencies = currencies.filter(c => repoCurrencies.includes(c.ticker));
      console.log(`✅ Found ${matchingCurrencies.length} matching currencies:`, matchingCurrencies.map(c => `${c.name} (${c.ticker})`));

      if (matchingCurrencies.length === 0) {
        console.log(`⚠️  No matching currencies found for repository ${repo.name}`);
        continue;
      }

      // For each matching currency, get its denominations and create float stacks
      for (const curr of matchingCurrencies) {
        console.log(`\n💵 Processing currency: ${curr.name} (${curr.ticker})`);
        
        const denominations = await db
          .select()
          .from(denomination)
          .where(eq(denomination.currencyId, curr.id));
        
        console.log(`🪙 Found ${denominations.length} denominations for ${curr.ticker}:`, denominations.map(d => `${d.name} (${d.value})`));

        if (denominations.length === 0) {
          console.log(`⚠️  No denominations found for currency ${curr.ticker} - skipping float stack creation`);
          continue;
        }

        // Create float stack for each denomination
        for (const denom of denominations) {
          console.log(`\n🔧 Creating float stack for ${curr.ticker} - ${denom.name} (${denom.value})`);
          // Get last session count from previous session float stack (if exists)
          let lastSessionCount = 0;
          if (previousSession) {
            const previousFloatStacks = await db
              .select()
              .from(floatStack)
              .where(
                and(
                  eq(floatStack.sessionId, previousSession.id),
                  eq(floatStack.repositoryId, repo.id),
                  eq(floatStack.denominationId, denom.id)
                )
              )
              .limit(1);

            if (previousFloatStacks.length > 0) {
              lastSessionCount = previousFloatStacks[0].closeCount || 0;
            }
          }

          // Create new float stack for current session
          try {
            const newFloatStack = await db
              .insert(floatStack)
              .values({
                id: crypto.randomUUID(),
                sessionId: this.sessionId,
                repositoryId: repo.id,
                denominationId: denom.id,
                ticker: curr.ticker, // Add the required ticker field
                openCount: lastSessionCount, // Start with last session's close count
                closeCount: 0,
                middayCount: 0,
                lastSessionCount: lastSessionCount,
                spentDuringSession: "0",
                transferredDuringSession: 0,
                denominatedValue: denom.value,
                openSpot: 0,
                closeSpot: 0,
                averageSpot: 0,
                openConfirmedDt: null,
                closeConfirmedDt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returning();

            if (newFloatStack.length > 0) {
              this.floatStacks.push(newFloatStack[0]);
              console.log(`✅ Created float stack: ${newFloatStack[0].id}`);
            }
          } catch (error) {
            console.error(`❌ Failed to create float stack for ${curr.ticker} - ${denom.name}:`, error);
            throw error;
          }
        }
      }
    }

    console.log(`✅ Created ${this.floatStacks.length} float stacks for session ${this.sessionId}`);
  }
}

export default CreateSessionFloatStacksService;
