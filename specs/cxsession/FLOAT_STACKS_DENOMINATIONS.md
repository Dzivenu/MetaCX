# Float Stacks and Denominations Specification

## Overview
This document details the float stacks and denominations system in the MetaCX application, covering float management, denomination structures, session-based tracking, and integration with repositories and currencies.

## Business Rules

### Float Stack Types
1. **Physical Float**: Physical cash denominations (bills, coins)
2. **Digital Float**: Cryptocurrency balances
3. **Combined Float**: Mixed physical and digital denominations

### Denomination Properties
- **Value**: Monetary value of the denomination
- **Currency**: Associated currency ticker
- **Accepted Status**: Whether denomination is accepted for transactions
- **Count Tracking**: Current, opening, and closing counts

### Float Stack Lifecycle
1. **Opening**: Initial float allocation at session start
2. **Operations**: Float changes through orders, transfers, and expenses
3. **Closing**: Final float reconciliation at session end
4. **Transfer**: Float movement between sessions/repositories

### Float Management Rules
- Float stacks are created per session, repository, and denomination
- Previous session float stacks are linked for continuity
- Float changes are tracked through breakdowns
- Real-time float count updates during operations

## Legacy System Analysis (Rails Backend)

### Backend Float Stack Models and Services

#### 1. Float Stack Model (`/app/models/float_stack.rb`)
```ruby
class FloatStack < ApplicationRecord
  belongs_to :session
  belongs_to :repository
  belongs_to :denomination
  belongs_to :previous_session_float_stack,
             class_name: 'FloatStack',
             foreign_key: 'previous_session_float_stack_id',
             optional: true

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

  def self_open_count
    self.open_count || 0
  end

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

  def close_or_expected_count(args = { in_cad_value: true })
    if self.close_count.nil?
      return self.expected_close(args)
    else
      if args[:in_cad_value]
        (self.close_count * self.average_spot * self.denominated_value).to_f
      else
        (self.close_count * self.denominated_value).to_f
      end
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

  def adjust_denominated_value
    self.denominated_value = self.denomination.value
  end

  def adjust_ticker
    self.ticker = self.denomination.currency.ticker
  end
end
```

#### 2. Denomination Model (`/app/models/denomination.rb`)
```ruby
class Denomination < ApplicationRecord
  belongs_to :currency
  has_many :float_stacks, dependent: :destroy
  validates :value, presence: true, numericality: { greater_than: 0 }
  validates :currency, presence: true
end
```

#### 3. Float Stacks Change Service (`/app/services/float_engine/float_stacks_change_service.rb`)
```ruby
module FloatEngine
  class FloatStacksChangeService
    attr_reader :breakable, :intention, :breakdowns, :success, :error

    def self.call(breakable:, intention:, breakdowns:)
      new(breakable: breakable, intention: intention, breakdowns: breakdowns).call
    end

    def initialize(breakable:, intention:, breakdowns:)
      @breakable = breakable
      @intention = intention
      @breakdowns = breakdowns
      @success = true
      @error = nil
    end

    def call
      validate_intention
      validate_breakdowns
      validate_breakable

      case @intention
      when 'CREATE_AND_COMMIT'
        create_and_commit_breakdowns
      when 'DELETE'
        delete_breakdowns
      when 'UPDATE'
        update_breakdowns
      end

      self
    rescue StandardError => e
      @success = false
      @error = e
      self
    end

    private

    def create_and_commit_breakdowns
      ActiveRecord::Base.transaction do
        @breakdowns.each do |breakdown|
          float_stack = find_float_stack(breakdown)
          
          case breakdown[:direction]
          when 'INBOUND'
            float_stack.current_count += breakdown[:count]
          when 'OUTBOUND'
            float_stack.current_count -= breakdown[:count]
          end
          
          float_stack.save!
          
          # Create breakdown record
          create_breakdown_record(breakdown, float_stack)
        end
      end
    end

    def delete_breakdowns
      ActiveRecord::Base.transaction do
        existing_breakdowns = @breakable.breakdowns
        
        existing_breakdowns.each do |breakdown|
          float_stack = breakdown.float_stack
          
          # Reverse the float change
          case breakdown.direction
          when 'INBOUND'
            float_stack.current_count -= breakdown.count
          when 'OUTBOUND'
            float_stack.current_count += breakdown.count
          end
          
          float_stack.save!
          breakdown.destroy!
        end
      end
    end

    def find_float_stack(breakdown)
      FloatStack.find_by(
        session: @breakable.session,
        repository: breakdown[:repository],
        denomination: breakdown[:denomination]
      )
    end

    def create_breakdown_record(breakdown, float_stack)
      @breakable.breakdowns.create!(
        float_stack: float_stack,
        count: breakdown[:count],
        direction: breakdown[:direction],
        status: 'COMMITTED'
      )
    end

    def validate_intention
      valid_intentions = ['CREATE_AND_COMMIT', 'DELETE', 'UPDATE']
      unless valid_intentions.include?(@intention)
        raise "Invalid intention: #{@intention}"
      end
    end

    def validate_breakdowns
      raise "Breakdowns cannot be empty" if @breakdowns.nil? || @breakdowns.empty?
      
      @breakdowns.each do |breakdown|
        validate_breakdown_structure(breakdown)
      end
    end

    def validate_breakdown_structure(breakdown)
      required_fields = [:float_stack_id, :count, :direction]
      required_fields.each do |field|
        unless breakdown.key?(field)
          raise "Breakdown missing required field: #{field}"
        end
      end
    end

    def validate_breakable
      raise "Breakable cannot be nil" if @breakable.nil?
      
      case @breakable.class.name
      when 'Order'
        @breakable.ensure_can_be_updated
      when 'Expense'
        @breakdown.ensure_can_be_updated
      when 'FloatTransfer'
        @breakable.ensure_can_be_updated
      end
    end
  end
end
```

#### 4. Float Stacks Controller (`/app/controllers/api/v1/float_stacks_controller.rb`)
```ruby
class Api::V1::FloatStacksController < Api::V1::BaseController
  def index
    authorize FloatStack

    session_id = params[:session_id]
    repository_id = params[:repository_id]
    ticker = params[:ticker]

    @float_stacks = FloatStack.all

    if session_id.present?
      @float_stacks = @float_stacks.where(session_id: session_id)
    end

    if repository_id.present?
      @float_stacks = @float_stacks.where(repository_id: repository_id)
    end

    if ticker.present?
      @float_stacks = @float_stacks.joins(:denomination)
                                  .joins(:currency)
                                  .where(currencies: { ticker: ticker })
    end

    render json: @float_stacks
  end

  def show
    authorize FloatStack
    @float_stack = FloatStack.find(params[:id])
    render json: @float_stack
  end

  def create
    authorize FloatStack

    @float_stack = FloatStack.new(float_stack_params)
    
    if @float_stack.save
      render json: @float_stack, status: :created
    else
      render json: { errors: @float_stack.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize FloatStack
    @float_stack = FloatStack.find(params[:id])

    if @float_stack.update(float_stack_params)
      render json: @float_stack
    else
      render json: { errors: @float_stack.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize FloatStack
    @float_stack = FloatStack.find(params[:id])
    @float_stack.destroy
    head :no_content
  end

  private

  def float_stack_params
    params.require(:float_stack).permit(
      :session_id,
      :repository_id,
      :denomination_id,
      :current_count,
      :open_count,
      :close_count,
      :spent_during_session,
      :transferred_during_session,
      :open_spot,
      :close_spot,
      :denominated_value,
      :ticker
    )
  end
end
```

### Frontend Float Stack Management

#### 1. Float Data Helper (`/src/helpers/FloatData.js`)
```javascript
export const formatFloatStacksForDisplay = (floatStacks) => {
  return floatStacks.map(stack => ({
    id: stack.id,
    denomination: stack.denomination.value,
    currency: stack.ticker,
    currentCount: stack.current_count,
    openCount: stack.open_count,
    closeCount: stack.close_count,
    spentDuringSession: stack.spent_during_session,
    transferredDuringSession: stack.transferred_during_session,
    value: parseFloat(stack.denominated_value),
    repository: stack.repository.name,
    session: stack.session.id
  }));
};

export const calculateFloatTotal = (floatStacks, inCadValue = true) => {
  return floatStacks.reduce((total, stack) => {
    const stackValue = inCadValue 
      ? (stack.currentCount * stack.average_spot * stack.value)
      : (stack.currentCount * stack.value);
    return total + stackValue;
  }, 0);
};

export const getFloatStacksByRepository = (floatStacks, repositoryId) => {
  return floatStacks.filter(stack => stack.repository_id === repositoryId);
};

export const getFloatStacksByCurrency = (floatStacks, ticker) => {
  return floatStacks.filter(stack => stack.ticker === ticker);
};
```

## Technical Implementation (MetaCX/Convex)

### Float Stack Schema and Models
```typescript
// Float stacks table schema (enhanced from currency spec)
export const floatStacks = pgTable("org_float_stacks", {
  id: serial("id").primaryKey(),
  clerkOrganizationId: varchar("clerk_organization_id", { length: 255 }).notNull(),
  sessionId: integer("session_id").references(() => cxSessions.id).notNull(),
  repositoryId: integer("repository_id").references(() => repositories.id).notNull(),
  denominationId: integer("denomination_id").references(() => denominations.id).notNull(),
  previousSessionFloatStackId: integer("previous_session_float_stack_id").references(() => floatStacks.id),
  
  // Float counts and tracking
  currentCount: integer("current_count").default(0),
  openCount: integer("open_count").default(0),
  closeCount: integer("close_count").default(0),
  spentDuringSession: integer("spent_during_session").default(0),
  transferredDuringSession: integer("transferred_during_session").default(0),
  
  // Rate tracking for value calculations
  openSpot: decimal("open_spot", { precision: 20, scale: 8 }).default(0),
  closeSpot: decimal("close_spot", { precision: 20, scale: 8 }).default(0),
  denominatedValue: decimal("denominated_value", { precision: 20, scale: 8 }).notNull(),
  ticker: varchar("ticker", { length: 20 }).notNull(),
  
  // Status and metadata
  status: varchar("status", { length: 50 }).default("ACTIVE"), // "ACTIVE" | "CLOSED" | "TRANSFERRED"
  lastUpdated: timestamp("last_updated").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Breakdowns table for tracking float changes
export const breakdowns = pgTable("org_breakdowns", {
  id: serial("id").primaryKey(),
  clerkOrganizationId: varchar("clerk_organization_id", { length: 255 }).notNull(),
  breakableType: varchar("breakable_type", { length: 50 }).notNull(), // "order" | "expense" | "float_transfer"
  breakableId: integer("breakable_id").notNull(),
  floatStackId: integer("float_stack_id").references(() => floatStacks.id).notNull(),
  
  // Breakdown details
  count: integer("count").notNull(),
  direction: varchar("direction", { length: 20 }).notNull(), // "INBOUND" | "OUTBOUND"
  status: varchar("status", { length: 20 }).default("COMMITTED"), // "COMMITTED" | "CANCELLED"
  
  // Value tracking at time of breakdown
  rateAtTime: decimal("rate_at_time", { precision: 20, scale: 8 }),
  valueAtTime: decimal("value_at_time", { precision: 20, scale: 8 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Float stack changes for audit trail
export const floatStackChanges = pgTable("org_float_stack_changes", {
  id: serial("id").primaryKey(),
  clerkOrganizationId: varchar("clerk_organization_id", { length: 255 }).notNull(),
  floatStackId: integer("float_stack_id").references(() => floatStacks.id).notNull(),
  breakdownId: integer("breakdown_id").references(() => breakdowns.id).notNull(),
  
  // Change details
  previousCount: integer("previous_count").notNull(),
  newCount: integer("new_count").notNull(),
  changeAmount: integer("change_amount").notNull(), // positive for increase, negative for decrease
  changeType: varchar("change_type", { length: 50 }).notNull(), // "ORDER" | "EXPENSE" | "TRANSFER" | "ADJUSTMENT"
  
  // Reference to what caused the change
  referenceType: varchar("reference_type", { length: 50 }), // "order" | "expense" | "float_transfer" | "manual_adjustment"
  referenceId: integer("reference_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Float Stack Management Service
```typescript
export const createFloatStacksForSession = mutation({
  args: {
    clerkOrganizationId: v.string(),
    sessionId: v.id("org_cx_sessions"),
    repositoryIds: v.array(v.id("org_repositories")),
    currencyIds: v.array(v.id("org_currencies")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // 1. Validate session exists
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    
    // 2. Get all denominations for the currencies
    const denominations = await ctx.db
      .query("org_denominations")
      .withIndex("by_currency_id", (q) => 
        q.eq("clerkOrganizationId", args.clerkOrganizationId)
      )
      .collect();
    
    const relevantDenominations = denominations.filter(denom => 
      args.currencyIds.includes(denom.currencyId)
    );
    
    // 3. Create float stacks for each repository-denomination combination
    for (const repoId of args.repositoryIds) {
      for (const denom of relevantDenominations) {
        // Check if float stack already exists
        const existingStack = await ctx.db
          .query("org_float_stacks")
          .withIndex("by_session_repository_denomination", (q) =>
            q.eq("sessionId", args.sessionId)
             .eq("repositoryId", repoId)
             .eq("denominationId", denom._id)
          )
          .first();
        
        if (!existingStack) {
          // Get currency for ticker
          const currency = await ctx.db.get(denom.currencyId);
          
          await ctx.db.insert("org_float_stacks", {
            clerkOrganizationId: args.clerkOrganizationId,
            sessionId: args.sessionId,
            repositoryId: repoId,
            denominationId: denom._id,
            currentCount: 0,
            openCount: 0,
            closeCount: 0,
            spentDuringSession: 0,
            transferredDuringSession: 0,
            openSpot: currency?.rate || 0,
            closeSpot: 0,
            denominatedValue: denom.value,
            ticker: currency?.ticker || "UNKNOWN",
            status: "ACTIVE",
            lastUpdated: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
    }
    
    return { success: true, message: "Float stacks created for session" };
  },
});
```

### Float Stack Change Service
```typescript
export const updateFloatStacks = mutation({
  args: {
    clerkOrganizationId: v.string(),
    breakdowns: v.array(v.object({
      floatStackId: v.id("org_float_stacks"),
      count: v.number(),
      direction: v.string(), // "INBOUND" | "OUTBOUND"
      referenceType: v.string(), // "order" | "expense" | "float_transfer"
      referenceId: v.id("org_orders"), // Can be order, expense, or transfer ID
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // 1. Process each breakdown
    for (const breakdown of args.breakdowns) {
      const floatStack = await ctx.db.get(breakdown.floatStackId);
      if (!floatStack) throw new Error("Float stack not found");
      
      const previousCount = floatStack.currentCount;
      const changeAmount = breakdown.direction === "INBOUND" 
        ? breakdown.count 
        : -breakdown.count;
      
      const newCount = previousCount + changeAmount;
      
      if (newCount < 0) {
        throw new Error("Insufficient float for operation");
      }
      
      // 2. Update float stack
      await ctx.db.patch(breakdown.floatStackId, {
        currentCount: newCount,
        lastUpdated: Date.now(),
        updatedAt: Date.now(),
      });
      
      // 3. Create breakdown record
      const breakdownId = await ctx.db.insert("org_breakdowns", {
        clerkOrganizationId: args.clerkOrganizationId,
        breakableType: breakdown.referenceType,
        breakableId: breakdown.referenceId,
        floatStackId: breakdown.floatStackId,
        count: breakdown.count,
        direction: breakdown.direction,
        status: "COMMITTED",
        rateAtTime: floatStack.openSpot,
        valueAtTime: breakdown.count * floatStack.denominatedValue,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      // 4. Create audit trail entry
      await ctx.db.insert("org_float_stack_changes", {
        clerkOrganizationId: args.clerkOrganizationId,
        floatStackId: breakdown.floatStackId,
        breakdownId: breakdownId,
        previousCount: previousCount,
        newCount: newCount,
        changeAmount: changeAmount,
        changeType: breakdown.referenceType.toUpperCase(),
        referenceType: breakdown.referenceType,
        referenceId: breakdown.referenceId,
        createdAt: Date.now(),
      });
      
      // 5. Update spent/transferred counters based on direction
      if (breakdown.direction === "OUTBOUND") {
        await ctx.db.patch(breakdown.floatStackId, {
          spentDuringSession: floatStack.spentDuringSession + breakdown.count,
          updatedAt: Date.now(),
        });
      }
    }
    
    return { success: true, message: "Float stacks updated successfully" };
  },
});
```

### Float Stack Queries
```typescript
export const getFloatStacks = query({
  args: {
    clerkOrganizationId: v.string(),
    sessionId: v.optional(v.id("org_cx_sessions")),
    repositoryId: v.optional(v.id("org_repositories")),
    ticker: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("org_float_stacks")
      .withIndex("by_clerk_org_id", (q) => 
        q.eq("clerkOrganizationId", args.clerkOrganizationId)
      );
    
    // Apply filters
    if (args.sessionId) {
      query = query.withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId));
    }
    
    if (args.repositoryId) {
      query = query.withIndex("by_repository_id", (q) => q.eq("repositoryId", args.repositoryId));
    }
    
    const floatStacks = await query.collect();
    
    // Apply ticker filter if specified
    let filteredStacks = floatStacks;
    if (args.ticker) {
      filteredStacks = floatStacks.filter(stack => stack.ticker === args.ticker);
    }
    
    // Enrich with related data
    const enrichedStacks = await Promise.all(
      filteredStacks.map(async (stack) => {
        const repository = await ctx.db.get(stack.repositoryId);
        const denomination = await ctx.db.get(stack.denominationId);
        const currency = denomination ? await ctx.db.get(denomination.currencyId) : null;
        
        return {
          ...stack,
          repository: repository ? {
            id: repository._id,
            name: repository.name,
            typeOfRepository: repository.typeOfRepository,
          } : null,
          denomination: denomination ? {
            id: denomination._id,
            value: denomination.value,
            accepted: denomination.accepted,
          } : null,
          currency: currency ? {
            id: currency._id,
            ticker: currency.ticker,
            name: currency.name,
            typeof: currency.typeof,
            rate: currency.rate,
          } : null,
        };
      })
    );
    
    return enrichedStacks;
  },
});

export const getFloatStackHistory = query({
  args: {
    clerkOrganizationId: v.string(),
    floatStackId: v.id("org_float_stacks"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("org_float_stack_changes")
      .withIndex("by_float_stack_id", (q) => q.eq("floatStackId", args.floatStackId))
      .order("desc");
    
    if (args.limit) {
      query = query.take(args.limit);
    }
    
    const changes = await query.collect();
    
    // Enrich with reference data
    const enrichedChanges = await Promise.all(
      changes.map(async (change) => {
        let reference = null;
        
        if (change.referenceType && change.referenceId) {
          switch (change.referenceType) {
            case "order":
              reference = await ctx.db.get(change.referenceId as any);
              break;
            case "expense":
              reference = await ctx.db.get(change.referenceId as any);
              break;
            case "float_transfer":
              reference = await ctx.db.get(change.referenceId as any);
              break;
          }
        }
        
        return {
          ...change,
          reference: reference ? {
            id: reference._id,
            type: change.referenceType,
            // Add relevant fields based on reference type
          } : null,
        };
      })
    );
    
    return enrichedChanges;
  },
});
```

### Denomination Management
```typescript
export const createDenominations = mutation({
  args: {
    clerkOrganizationId: v.string(),
    currencyId: v.id("org_currencies"),
    denominations: v.array(v.object({
      value: v.number(),
      accepted: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // 1. Validate currency exists
    const currency = await ctx.db.get(args.currencyId);
    if (!currency) throw new Error("Currency not found");
    
    // 2. Create denominations
    for (const denom of args.denominations) {
      // Check if denomination already exists
      const existing = await ctx.db
        .query("org_denominations")
        .withIndex("by_currency_id", (q) => 
          q.eq("currencyId", args.currencyId)
        )
        .filter((q) => q.eq(q.field("value"), denom.value))
        .first();
      
      if (!existing) {
        await ctx.db.insert("org_denominations", {
          clerkOrganizationId: args.clerkOrganizationId,
          currencyId: args.currencyId,
          value: denom.value,
          accepted: denom.accepted ?? true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
    
    return { success: true, message: "Denominations created successfully" };
  },
});
```

## Error Handling

### Validation Errors
- **Insufficient Float**: "Insufficient float for operation"
- **Invalid Denomination**: "Invalid denomination value"
- **Float Stack Not Found**: "Float stack not found"
- **Negative Count**: "Float count cannot be negative"
- **Unauthorized**: "User is not authorized to manage float"

### System Errors
- **Database Error**: "An error occurred while updating float stacks"
- **Concurrent Modification**: "Float stack was modified by another operation"
- **Breakdown Creation Error**: "Failed to create breakdown record"
- **Audit Trail Error**: "Failed to create audit trail entry"

## User Interface Requirements

### Float Stack Management
1. **Float View**: Repository-based float stack display
2. **Real-time Updates**: Live float count updates during operations
3. **Historical Tracking**: Float stack change history
4. **Currency Filtering**: Filter float stacks by currency
5. **Repository Organization**: Group float stacks by repository

### Denomination Management
1. **Denomination List**: Per-currency denomination display
2. **Value Validation**: Proper decimal formatting
3. **Accepted Status**: Toggle for denomination acceptance
4. **Float Impact**: Show float stack impact when changing denominations

### Float Operations
1. **Breakdown Builder**: Interface for creating float breakdowns
2. **Float Validation**: Real-time validation of float availability
3. **Transfer Interface**: Float transfer between repositories
4. **Adjustment Tools**: Manual float adjustment capabilities

## Integration Points

### Components Using Float Stacks
1. **Order Creation**: Float availability checking and breakdown creation
2. **Expense Management**: Float tracking for expense operations
3. **Float Transfers**: Source and destination float stack management
4. **Session Management**: Float stack creation and closing
5. **Reporting**: Float utilization and variance reporting

### Shared Functions
- `getFloatStacks()` for float stack retrieval
- `updateFloatStacks()` for float stack modifications
- `createFloatStacksForSession()` for session setup
- `getFloatStackHistory()` for audit trail

## Testing Requirements

### Unit Tests
- Test float stack creation with all parameters
- Test float update operations and validations
- Test breakdown creation and float changes
- Test denomination management
- Test audit trail creation
- Test float stack linking between sessions

### Integration Tests
- Test complete float operation workflows
- Test concurrent float modifications
- Test float stack consistency
- Test session float stack creation
- Test float transfer operations

### Edge Cases
- Insufficient float scenarios
- Negative float counts
- Concurrent float modifications
- Float stack corruption
- Invalid denomination values

## Security Considerations

### Authorization
- Verify user has float management permissions
- Validate user belongs to organization
- Prevent unauthorized float modifications
- Audit trail for all float changes

### Data Integrity
- Atomic float stack updates
- Proper validation of float operations
- Consistency checks for float counts
- Complete audit trail tracking

## Performance Considerations

### Database Queries
- Efficient indexing on session, repository, and denomination
- Optimized float stack queries with proper joins
- Float change history pagination
- Real-time float stack caching

### User Experience
- Fast float stack loading and filtering
- Real-time float count updates
- Optimized breakdown calculations
- Responsive float management interface

## Migration Notes

### Legacy to MetaCX Differences
1. **Authentication**: Rails uses token auth vs MetaCX uses Clerk JWT
2. **Database**: Rails PostgreSQL vs MetaCX Convex
3. **Float Tracking**: Legacy uses complex callbacks vs MetaCX explicit services
4. **Audit Trail**: Legacy uses basic logging vs MetaCX comprehensive change tracking

### Preserved Legacy Logic
- Float stack creation patterns
- Breakdown structure and validation
- Float change calculations
- Session-based float tracking
- Repository float organization
- Denomination management

## Future Enhancements

### Potential Improvements
1. **Advanced Float Analytics**: Enhanced float utilization reporting
2. **Predictive Float Management**: AI-powered float optimization
3. **Mobile Float Management**: Optimized mobile float interface
4. **Multi-branch Float**: Cross-branch float visibility and transfers
5. **Float Automation**: Automated float rebalancing
6. **Real-time Notifications**: Float level alerts and notifications

### Analytics
- Track float utilization patterns
- Monitor float variance and discrepancies
- Report on denomination efficiency
- User behavior analysis for float operations
- Revenue analysis by float optimization
