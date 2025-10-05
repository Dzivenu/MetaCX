import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/db/better-auth";
import { db } from "@/server/db";
import { floatStack, repository, currency, denomination, cxSession } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/sessions/[sessionId]/float-stacks - Get all float stacks for a CX session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the active organization from the session
    const activeOrganizationId = sessionData.session.activeOrganizationId;

    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active organization selected" },
        { status: 400 }
      );
    }

    // Await params before accessing properties (Next.js 15 requirement)
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // First verify the session exists and belongs to the active organization
    const session = await db
      .select()
      .from(cxSession)
      .where(
        and(
          eq(cxSession.id, sessionId),
          eq(cxSession.organizationId, activeOrganizationId)
        )
      )
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json(
        { error: "Session not found or access denied" },
        { status: 404 }
      );
    }

    // Get all repositories for this organization
    const repositories = await db
      .select()
      .from(repository)
      .where(eq(repository.organizationId, activeOrganizationId));

    // Get all float stacks for this session
    const sessionFloatStacks = await db
      .select({
        floatStack: floatStack,
        denomination: denomination,
        currency: currency,
      })
      .from(floatStack)
      .leftJoin(denomination, eq(denomination.id, floatStack.denominationId))
      .leftJoin(currency, eq(currency.id, denomination.currencyId))
      .where(eq(floatStack.sessionId, sessionId));

    // Get all currencies to match Ruby implementation
    const allCurrencies = await db
      .select()
      .from(currency)
      .where(eq(currency.organizationId, activeOrganizationId));

    // Build the response structure matching Ruby implementation
    const result = repositories.map((repo) => {
      // Get currencies for this repository from currencyTickers
      const repoCurrencies = repo.currencyTickers ? 
        (Array.isArray(repo.currencyTickers) ? repo.currencyTickers : JSON.parse(repo.currencyTickers as string)) : [];
      
      const currencies = repoCurrencies.map((ticker: string) => {
        // Find the currency by ticker
        const currencyData = allCurrencies.find(c => c.ticker === ticker);
        if (!currencyData) {
          return null;
        }

        // Get float stacks for this repository and currency
        const currencyFloatStacks = sessionFloatStacks.filter(fs => 
          fs.floatStack?.repositoryId === repo.id && 
          fs.currency?.ticker === ticker
        );

        // Calculate current stash value (sum of all float stacks for this currency)
        let currentStashValue = 0;
        currencyFloatStacks.forEach(fs => {
          if (fs.floatStack && fs.denomination) {
            const openCount = fs.floatStack.openCount || 0;
            const spentDuringSession = parseFloat(fs.floatStack.spentDuringSession?.toString() || "0");
            const transferredDuringSession = fs.floatStack.transferredDuringSession || 0;
            const denominationValue = fs.denomination.value || 0;
            
            currentStashValue += (openCount - spentDuringSession - transferredDuringSession) * denominationValue;
          }
        });

        // Sort float stacks by denomination value (highest first) like Ruby
        const sortedFloatStacks = currencyFloatStacks
          .filter(fs => fs.floatStack && fs.denomination)
          .sort((a, b) => (b.denomination?.value || 0) - (a.denomination?.value || 0))
          .map(fs => {
            const floatStack = fs.floatStack!;
            const denomination = fs.denomination!;
            const openCount = floatStack.openCount || 0;
            const spentDuringSession = parseFloat(floatStack.spentDuringSession?.toString() || "0");
            const transferredDuringSession = floatStack.transferredDuringSession || 0;
            const currentCount = openCount - spentDuringSession - transferredDuringSession;

            return {
              id: floatStack.id,
              open_confirmed_dt: floatStack.openConfirmedDt,
              open_count: openCount,
              midday_count: floatStack.middayCount || 0,
              close_confirmed_dt: floatStack.closeConfirmedDt,
              close_count: floatStack.closeCount || 0,
              repository_id: repo.id,
              spent_during_session: floatStack.spentDuringSession?.toString() || "0",
              previous_session_float_stack: null, // TODO: Add previous session support
              transferred_during_session: transferredDuringSession,
              value: floatStack.denominatedValue || 0,
              denomination_id: denomination.id,
              current_count: currentCount,
              last_session_count: floatStack.lastSessionCount || 0,
              ticker: currencyData.ticker,
              typeof: currencyData.typeOf,
              amount_decimal_places: currencyData.amountDecimalPlaces || 2,
              rate_decimal_places: currencyData.rateDecimalPlaces || 2,
              icon: currencyData.icon,
              photo: currencyData.photo,
            };
          });

        return {
          id: currencyData.id,
          name: currencyData.name,
          ticker: currencyData.ticker,
          icon: currencyData.icon,
          photo: currencyData.photo,
          typeof: currencyData.typeOf,
          float_display_order: currencyData.floatDisplayOrder || 1,
          tradeable: currencyData.tradeable || true,
          current_stash_value: currentStashValue,
          rate_decimal_places: currencyData.rateDecimalPlaces || 2,
          amount_decimal_places: currencyData.amountDecimalPlaces || 2,
          float_stacks: sortedFloatStacks,
        };
      }).filter(Boolean); // Remove null entries

      return {
        id: repo.id,
        name: repo.name,
        typeof: null,
        branch_id: 1,
        type_of_currencies: repo.currencyType || "Fiat",
        type_of_repository: repo.typeOf || "PHYSICAL",
        display_id: repo.displayOrderId,
        currencies,
      };
    });

    // Return repositories array directly (not wrapped in data object)
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching session float stacks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
