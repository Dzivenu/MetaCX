# Currency Design System Specification

## Overview
This document details the comprehensive currency design system in the MetaCX application, covering currency creation, management, denominations, rate calculations, and integration with repositories and sessions.

## Business Rules

### Currency Types
1. **Fiat**: Traditional government-issued currencies (CAD, USD, EUR)
2. **Cryptocurrency**: Digital currencies (BTC, ETH, USDT)
3. **Wrapped Tokens**: Cryptocurrencies that represent other assets

### Currency Properties
- **Ticker**: Unique symbol (e.g., BTC, CAD, ETH)
- **Name**: Full display name
- **Rate**: Current exchange rate to base currency (CAD)
- **Rate API Identifier**: External API source for rate updates
- **Typeof**: Currency classification (Fiat/Cryptocurrency)
- **Network**: Blockchain network for crypto currencies
- **Contract**: Smart contract address for tokens
- **Float Display Order**: UI ordering priority
- **Tradeable**: Whether currency can be traded
- **Advertisable**: Whether currency appears in public displays

### Rate Management
- **Manual Rates**: Set by administrators
- **Automated Rates**: Pulled from external APIs
- **Rate Updates**: Timestamped for audit trail
- **Margin Calculations**: Business margins applied to rates

## Legacy System Analysis (Rails Backend)

### Backend Currency Models and Services

#### 1. Currency Model (`/app/models/currency.rb`)
```ruby
class Currency < ApplicationRecord
  include CurrencyHelper
  include ErrorHelper

  has_many :denominations, dependent: :destroy
  has_many :currency_swaps
  has_many :infos, as: :infoable
  has_many :cash_flows, dependent: :destroy
  has_many :float_snapshots
  belongs_to :branch
  validates :rate_api_identifier, presence: true
  
  before_save :adjust_margin, :adjust_rate, :round_decimals
  before_create :update_rate_api_timestamp
  after_commit :update_repo, on: :destroy
  
  enum api: %i[manual automated]

  def update_rate_value(rate)
    self.update!(rate: rate, rate_updated_at: Time.now)
  end

  def is_wrapped_token?
    underlying.present?
  end

  def exchange_gain_loss(start_date = DateTime.now - 365, end_date = DateTime.now)
    inv_cost = Order.between(start_date, end_date)
      .where("inbound_ticker = ? AND status='COMPLETED'", ticker)
      .reduce(0.0) do |sum, order|
        sum += order.inventory_cost unless order.inventory_cost.nil?
      end
    market_value - inv_cost
  end

  def market_value
    Branch.first.value_of(ticker)[:CAD].round(2)
  end

  def self.rate(ticker)
    Currency.find_by(ticker: ticker).rate
  end
end
```

#### 2. Denomination Model (`/app/models/denomination.rb`)
```ruby
class Denomination < ApplicationRecord
  belongs_to :currency
  has_many :float_stacks, dependent: :destroy
end
```

#### 3. Float Stack Model (`/app/models/float_stack.rb`)
```ruby
class FloatStack < ApplicationRecord
  belongs_to :session
  belongs_to :repository
  belongs_to :denomination
  belongs_to :previous_session_float_stack, optional: true

  scope :get_float, ->(session, ticker) do
    where(session: session)
      .joins(:denomination)
      .joins(:currency)
      .where(currencies: { ticker: ticker })
  end

  scope :fiat_float, ->(session) do
    where(session: session)
      .joins(:denomination)
      .joins(:currency)
      .where(currencies: { typeof: 'Fiat' })
  end

  scope :crypto_float, ->(session) do
    where(session: session)
      .joins(:denomination)
      .joins(:currency)
      .where(currencies: { typeof: 'Cryptocurrency' })
  end

  before_create :adjust_denominated_value, :adjust_ticker

  def expected_close(args = { in_cad_value: true })
    if args[:in_cad_value]
      (self_open_count * self.average_spot * self.denominated_value) -
        (self.denominated_value * self.average_spot * self.spent_during_session).to_f -
        (self.denominated_value * self.average_spot * self.transferred_during_session).to_f
    else
      (self_open_count * self.denominated_value) -
        (self.denominated_value * self.spent_during_session).to_f -
        (self.denominated_value * self.transferred_during_session).to_f
    end
  end

  def average_spot
    if self.open_spot == 0
      open = Currency.find_by(ticker: self.ticker).rate
      self.update!(open_spot: open)
    end

    self_close_spot = self.close_spot
    if self_close_spot == 0
      self_close_spot = Currency.find_by(ticker: self.ticker).rate
    end

    (self.open_spot + self_close_spot) / 2
  end
end
```

#### 4. Currency Creation Service (`/app/services/currency_creation_service.rb`)
```ruby
class CurrencyCreationService
  attr_accessor :currency, :repositories, :denominations, :currency_params, :error, :float_stacks

  def initialize(currency_params = {})
    @currency_params = currency_params
    @currency = currency_params[:currency].permit(
      :rate, :name, :ticker, :rate_api, :rate_api_identifier, :typeof,
      :api, :icon, :network, :chain_id, :symbol, :contract
    )
    @denominations = currency_params[:denominations]
    @repositories = currency_params[:repositories] # array of repository ids
    @float_stacks = []
    @error = false
  end

  def execute
    validate_params
    return @error if @error.present?

    build_currency
    return @error if @error.present?

    build_denominations
    return @error if @error.present?

    build_repositories
    return @error if @error.present?

    commit_currency
    return self
  end

  private

  def build_currency
    @currency = Currency.new @currency
    @currency.branch = Branch.first
    @currency.float_display_order = Currency.pluck(:float_display_order).max + 1
    @currency.tradeable = true

    if @currency.valid?
      @currency.save
    else
      @error = currency.errors.full_messages
    end
  end

  def build_denominations
    @denominations = @denominations.map do |denomination_data|
      denom = Denomination.new denomination_data.permit(:value)
      denom.currency = @currency
      denom.accepted = true
      if denom.valid?
        denom
      else
        @error = denom.errors.full_messages
      end
    end

    @currency.destroy if @error.present?
  end

  def build_repositories
    return if @repositories.empty?

    @repositories.each do |repo_id|
      repo = Repository.find(repo_id)
      repo.currencies << @currency.ticker unless repo.currencies.include?(@currency.ticker)
      repo.save
    end
  end

  def commit_currency
    # Create float stacks for previous and current sessions
    sessions = Session.order(created_at: :desc).limit(2)
    sessions.each do |session|
      @denominations.each do |denom|
        @repositories.each do |repo_id|
          FloatStack.create!(
            session: session,
            repository: Repository.find(repo_id),
            denomination: denom,
            open_count: 0,
            close_count: 0,
            spent_during_session: 0,
            transferred_during_session: 0
          )
        end
      end
    end
  end
end
```

#### 5. Currencies Controller (`/app/controllers/api/v1/currencies_controller.rb`)
```ruby
class Api::V1::CurrenciesController < Api::V1::BaseController
  def index
    @currencies = policy_scope(Currency)
    @minified = params['minified']

    if params['filter'] == 'none'
      @currencies_returned = @currencies.sort do |x, y|
        x.float_display_order <=> y.float_display_order
      end
    else
      @currencies_returned = @currencies
    end
  end

  def create
    skip_authorization # TODO: ensure only managers can create currencies

    response = CurrencyCreationService.call params

    if response.error.present?
      render json: { error: "Error: #{response.error}" }, status: 400
    else
      Activity.create_from_params(
        event: 'CURRENCY_CREATED',
        user_id: current_user.id,
        session_id: '',
        reference_id: response.currency.id,
        comment: '',
        meta: ''
      )

      render json: { response: response }, status: 200
    end
  end

  def float_display_order
    skip_authorization

    object_params = params.permit(currencies: %i[id float_display_order])
    result = PriceEngine::FloatDisplayOrderService.call(
      { currencies: object_params['currencies'] }
    )

    if result.success
      render json: { data: result.currencies }, status: 200
    else
      render json: { error: result.errors }, status: 401
    end
  end

  def delete_currency_by_id
    @currency = Currency.find params[:id]
    authorize @currency

    if @currency.delete_currency
      render json: { success: true }, status: 200
    else
      render json: { error: @currency.errors.full_messages }, status: 422
    end
  end
end
```

### Frontend Currency Management

#### 1. Currency API (`/src/apis/currency.js`)
```javascript
export const fetchSpot = async (sessionData = {}) => {
  const { baseUrl, userEmail, userToken } = sessionData
  const url = `${baseUrl}/api/v1/currencies?minified=true`

  const headers = {
    'X-User-Email': userEmail,
    'X-User-Token': userToken,
    'Content-Type': 'application/json'
  }

  const response = await fetch(url, { headers })
  return response.ok ? response.data : 0
}

export const fetchCurrenciesList = async sessionData => {
  const { userEmail, userToken, baseUrl } = sessionData
  try {
    const results = await fetch(`${baseUrl}/api/v1/currencies/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': userEmail,
        'X-User-Token': userToken
      }
    })
    return await results.json()
  } catch (err) {
    console.log(err)
    AppToast('Unable to fetch currencies.', 'warning')
  }
}

export const fetchCurrencySessionRatesByTicker = async (sessionData, session_id, ticker) => {
  const { userEmail, userToken, baseUrl } = sessionData
  try {
    const results = await fetch(`${baseUrl}/api/v1/currencies/session_rates?session_id=${session_id}&ticker=${ticker}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': userEmail,
        'X-User-Token': userToken
      }
    })
    return await results.json()
  } catch (err) {
    console.log(err)
    AppToast('Unable to fetch currency rates.', 'warning')
  }
}
```

## Technical Implementation (MetaCX/Convex)

### Currency Schema and Models
```typescript
// Currency table schema
export const currencies = pgTable("org_currencies", {
  id: serial("id").primaryKey(),
  clerkOrganizationId: varchar("clerk_organization_id", { length: 255 }).notNull(),
  
  // Basic currency info
  ticker: varchar("ticker", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  typeof: varchar("typeof", { length: 50 }).notNull(), // "Fiat" | "Cryptocurrency"
  
  // Rate information
  rate: decimal("rate", { precision: 20, scale: 8 }).notNull(),
  rateApiIdentifier: varchar("rate_api_identifier", { length: 255 }).notNull(),
  rateUpdatedAt: timestamp("rate_updated_at").defaultNow(),
  
  // Network/blockchain info for crypto
  network: varchar("network", { length: 100 }),
  chainId: integer("chain_id"),
  contract: varchar("contract", { length: 255 }),
  symbol: varchar("symbol", { length: 20 }),
  
  // Display and trade settings
  floatDisplayOrder: integer("float_display_order").notNull(),
  tradeable: boolean("tradeable").default(true),
  advertisable: boolean("advertisable").default(true),
  
  // API settings
  api: varchar("api", { length: 50 }).default("manual"), // "manual" | "automated"
  
  // Metadata
  icon: varchar("icon", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Denominations table schema
export const denominations = pgTable("org_denominations", {
  id: serial("id").primaryKey(),
  clerkOrganizationId: varchar("clerk_organization_id", { length: 255 }).notNull(),
  currencyId: integer("currency_id").references(() => currencies.id).notNull(),
  value: decimal("value", { precision: 20, scale: 8 }).notNull(),
  accepted: boolean("accepted").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Float stacks table schema
export const floatStacks = pgTable("org_float_stacks", {
  id: serial("id").primaryKey(),
  clerkOrganizationId: varchar("clerk_organization_id", { length: 255 }).notNull(),
  sessionId: integer("session_id").references(() => cxSessions.id).notNull(),
  repositoryId: integer("repository_id").references(() => repositories.id).notNull(),
  denominationId: integer("denomination_id").references(() => denominations.id).notNull(),
  previousSessionFloatStackId: integer("previous_session_float_stack_id").references(() => floatStacks.id),
  
  // Float counts
  currentCount: integer("current_count").default(0),
  openCount: integer("open_count").default(0),
  closeCount: integer("close_count").default(0),
  spentDuringSession: integer("spent_during_session").default(0),
  transferredDuringSession: integer("transferred_during_session").default(0),
  
  // Rate tracking
  openSpot: decimal("open_spot", { precision: 20, scale: 8 }).default(0),
  closeSpot: decimal("close_spot", { precision: 20, scale: 8 }).default(0),
  denominatedValue: decimal("denominated_value", { precision: 20, scale: 8 }).notNull(),
  ticker: varchar("ticker", { length: 20 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Currency Creation Service
```typescript
export const createCurrency = mutation({
  args: {
    clerkOrganizationId: v.string(),
    ticker: v.string(),
    name: v.string(),
    typeof: v.string(), // "Fiat" | "Cryptocurrency"
    rate: v.number(),
    rateApiIdentifier: v.string(),
    denominations: v.array(v.object({
      value: v.number(),
    })),
    repositoryIds: v.array(v.id("org_repositories")),
    network: v.optional(v.string()),
    chainId: v.optional(v.number()),
    contract: v.optional(v.string()),
    symbol: v.optional(v.string()),
    icon: v.optional(v.string()),
    api: v.optional(v.string()), // "manual" | "automated"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // 1. Validate currency doesn't exist
    const existingCurrency = await ctx.db
      .query("org_currencies")
      .withIndex("by_ticker", (q) => q.eq("ticker", args.ticker))
      .first();
    
    if (existingCurrency) {
      throw new Error(`Currency ${args.ticker} already exists`);
    }
    
    // 2. Validate repositories exist
    for (const repoId of args.repositoryIds) {
      const repo = await ctx.db.get(repoId);
      if (!repo) throw new Error(`Repository ${repoId} not found`);
    }
    
    // 3. Create currency
    const maxDisplayOrder = await ctx.db
      .query("org_currencies")
      .withIndex("by_clerk_org_id", (q) => 
        q.eq("clerkOrganizationId", args.clerkOrganizationId)
      )
      .order("desc")
      .first();
    
    const currencyId = await ctx.db.insert("org_currencies", {
      clerkOrganizationId: args.clerkOrganizationId,
      ticker: args.ticker,
      name: args.name,
      typeof: args.typeof,
      rate: args.rate,
      rateApiIdentifier: args.rateApiIdentifier,
      rateUpdatedAt: Date.now(),
      network: args.network,
      chainId: args.chainId,
      contract: args.contract,
      symbol: args.symbol,
      icon: args.icon,
      api: args.api || "manual",
      floatDisplayOrder: (maxDisplayOrder?.floatDisplayOrder || 0) + 1,
      tradeable: true,
      advertisable: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // 4. Create denominations
    for (const denom of args.denominations) {
      await ctx.db.insert("org_denominations", {
        clerkOrganizationId: args.clerkOrganizationId,
        currencyId: currencyId,
        value: denom.value,
        accepted: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // 5. Update repositories to include currency ticker
    for (const repoId of args.repositoryIds) {
      const repo = await ctx.db.get(repoId);
      if (repo && !repo.currencyTickers.includes(args.ticker)) {
        await ctx.db.patch(repoId, {
          currencyTickers: [...repo.currencyTickers, args.ticker],
          updatedAt: Date.now(),
        });
      }
    }
    
    // 6. Create float stacks for current and previous sessions
    const sessions = await ctx.db
      .query("org_cx_sessions")
      .withIndex("by_clerk_org_id", (q) => 
        q.eq("clerkOrganizationId", args.clerkOrganizationId)
      )
      .order("desc")
      .limit(2)
      .collect();
    
    const denominations = await ctx.db
      .query("org_denominations")
      .withIndex("by_currency_id", (q) => q.eq("currencyId", currencyId))
      .collect();
    
    for (const session of sessions) {
      for (const repoId of args.repositoryIds) {
        for (const denom of denominations) {
          await ctx.db.insert("org_float_stacks", {
            clerkOrganizationId: args.clerkOrganizationId,
            sessionId: session._id,
            repositoryId: repoId,
            denominationId: denom._id,
            currentCount: 0,
            openCount: 0,
            closeCount: 0,
            spentDuringSession: 0,
            transferredDuringSession: 0,
            openSpot: args.rate,
            closeSpot: 0,
            denominatedValue: denom.value,
            ticker: args.ticker,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
    }
    
    // 7. Log activity
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: args.clerkOrganizationId,
      userId: identity.subject,
      sessionId: null,
      event: "CURRENCY_CREATED",
      referenceId: currencyId,
      comment: "",
      meta: {
        ticker: args.ticker,
        name: args.name,
        typeof: args.typeof
      },
      createdAt: Date.now(),
    });
    
    return { success: true, currencyId };
  },
});
```

### Currency Management Queries
```typescript
export const getCurrencies = query({
  args: {
    clerkOrganizationId: v.string(),
    minified: v.optional(v.boolean()),
    filter: v.optional(v.string()), // "none" or undefined
  },
  handler: async (ctx, args) => {
    let currencies = await ctx.db
      .query("org_currencies")
      .withIndex("by_clerk_org_id", (q) => 
        q.eq("clerkOrganizationId", args.clerkOrganizationId)
      )
      .collect();
    
    // Apply sorting
    if (args.filter === "none") {
      currencies = currencies.sort((a, b) => a.floatDisplayOrder - b.floatDisplayOrder);
    }
    
    // Get denominations for each currency
    const enrichedCurrencies = await Promise.all(
      currencies.map(async (currency) => {
        const denominations = await ctx.db
          .query("org_denominations")
          .withIndex("by_currency_id", (q) => q.eq("currencyId", currency._id))
          .collect();
        
        return {
          ...currency,
          denominations: denominations.map(d => ({
            id: d._id,
            value: d.value,
            accepted: d.accepted
          }))
        };
      })
    );
    
    return enrichedCurrencies;
  },
});

export const updateCurrencyDisplayOrder = mutation({
  args: {
    clerkOrganizationId: v.string(),
    currencies: v.array(v.object({
      id: v.id("org_currencies"),
      floatDisplayOrder: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // Update each currency's display order
    for (const currencyUpdate of args.currencies) {
      await ctx.db.patch(currencyUpdate.id, {
        floatDisplayOrder: currencyUpdate.floatDisplayOrder,
        updatedAt: Date.now(),
      });
    }
    
    return { success: true, message: "Currency display order updated" };
  },
});
```

### Rate Management
```typescript
export const updateCurrencyRate = mutation({
  args: {
    currencyId: v.id("org_currencies"),
    newRate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const currency = await ctx.db.get(args.currencyId);
    if (!currency) throw new Error("Currency not found");
    
    await ctx.db.patch(args.currencyId, {
      rate: args.newRate,
      rateUpdatedAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Log activity
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: currency.clerkOrganizationId,
      userId: identity.subject,
      sessionId: null,
      event: "CURRENCY_RATE_UPDATED",
      referenceId: args.currencyId,
      comment: "",
      meta: {
        ticker: currency.ticker,
        oldRate: currency.rate,
        newRate: args.newRate
      },
      createdAt: Date.now(),
    });
    
    return { success: true, message: "Currency rate updated" };
  },
});
```

## Error Handling

### Validation Errors
- **Currency Exists**: "Currency ticker already exists"
- **Invalid Ticker**: "Invalid currency ticker format"
- **Repository Not Found**: "One or more repositories not found"
- **Invalid Denominations**: "Denomination values must be positive"
- **Unauthorized**: "User is not authorized to manage currencies"

### System Errors
- **Database Error**: "An error occurred while creating currency"
- **Float Stack Creation Error**: "Failed to create float stacks"
- **Repository Update Error**: "Failed to update repositories"

## User Interface Requirements

### Currency Management
1. **Currency List**: Table with sorting, filtering, and pagination
2. **Creation Form**: Multi-step form with currency details, denominations, and repository selection
3. **Rate Management**: Manual rate updates and automated API configuration
4. **Display Order**: Drag-and-drop interface for currency ordering
5. **Status Indicators**: Tradeable, advertisable, and API status badges

### Denomination Management
1. **Denomination List**: Per-currency denomination management
2. **Value Validation**: Proper decimal formatting and validation
3. **Accepted Status**: Toggle for denomination acceptance
4. **Float Impact**: Show float stack impact when changing denominations

### Float Stack Visualization
1. **Repository View**: Currency breakdown by repository
2. **Session Tracking**: Float stack changes across sessions
3. **Real-time Updates**: Live float count updates
4. **Historical Data**: Float stack change history

## Integration Points

### Components Using Currency System
1. **Order Creation**: Currency selection and rate calculations
2. **Float Management**: Float stack tracking and updates
3. **Session Management**: Currency availability and rates
4. **Reporting**: Currency performance and analytics
5. **Customer Management**: Currency preferences and history

### Shared Functions
- `getCurrencies()` for currency listing
- `createCurrency()` for currency creation
- `updateCurrencyRate()` for rate management
- `updateCurrencyDisplayOrder()` for UI ordering

## Testing Requirements

### Unit Tests
- Test currency creation with all parameters
- Test denomination validation and creation
- Test float stack generation
- Test rate update functionality
- Test repository association
- Test display order management

### Integration Tests
- Test complete currency creation flow
- Test float stack consistency
- Test rate update propagation
- Test currency deletion and cleanup
- Test repository currency associations

### Edge Cases
- Duplicate currency tickers
- Invalid denomination values
- Missing repository associations
- Rate update conflicts
- Float stack creation failures

## Security Considerations

### Authorization
- Verify user has currency management permissions
- Validate user belongs to organization
- Prevent unauthorized rate modifications
- Audit trail for all currency changes

### Data Integrity
- Atomic currency creation with dependencies
- Proper validation of currency properties
- Float stack consistency checks
- Rate update audit logging

## Performance Considerations

### Database Queries
- Efficient indexing on ticker and organization
- Optimized float stack queries
- Currency caching for rate lookups
- Pagination for large currency lists

### User Experience
- Fast currency loading and filtering
- Real-time rate updates
- Optimized float stack calculations
- Responsive currency management interface

## Migration Notes

### Legacy to MetaCX Differences
1. **Authentication**: Rails uses token auth vs MetaCX uses Clerk JWT
2. **Database**: Rails PostgreSQL vs MetaCX Convex
3. **Rate APIs**: Legacy uses multiple scrapers vs MetaCX centralized API
4. **Float Management**: Legacy uses complex associations vs MetaCX direct references

### Preserved Legacy Logic
- Currency type classification (Fiat/Cryptocurrency)
- Denomination structure and validation
- Float stack creation patterns
- Rate update mechanisms
- Display order management
- Repository currency associations

## Future Enhancements

### Potential Improvements
1. **Multi-branch Support**: Currency management across branches
2. **Advanced Rate APIs**: Multiple rate sources with fallbacks
3. **Currency Analytics**: Enhanced rate and usage analytics
4. **Automated Trading**: Algorithmic rate adjustments
5. **Mobile Currency Management**: Optimized mobile interface
6. **Currency Templates**: Pre-configured currency setups

### Analytics
- Track currency usage patterns
- Monitor rate volatility
- Report on float utilization
- User behavior analysis for currency preferences
- Revenue analysis by currency
