# Currency Swap Specification

## Overview
This document details the process and requirements for creating currency swaps in the MetaCX application. Currency swaps allow tellers to exchange denominations within the same currency across different repositories, maintaining accurate float tracking.

## Business Rules

### Prerequisites for Currency Swap
1. **Session Status**: Session must be in `FLOAT_OPEN_COMPLETE` state
2. **User Authorization**: User must be active and authorized on the session
3. **Repository Validation**: Both inbound and outbound repositories must exist and be accessible
4. **Currency Validation**: Both inbound and outbound tickers must be the same currency
5. **Non-zero Values**: Both inbound and outbound sums must be greater than 0
6. **Breakdown Validation**: Breakdowns must match the specified sums and directions

### Swap Process Flow
1. **Select Currency**: Choose the currency ticker for the swap
2. **Select Repositories**: Choose inbound and outbound repositories
3. **Specify Amounts**: Enter inbound and outbound sums (must be equal)
4. **Define Breakdowns**: Specify denominations and counts for each direction
5. **Validate & Execute**: System validates and processes the swap
6. **Update Float**: Float stacks are automatically updated

## Legacy System Analysis (Rails Backend)

### Backend Currency Swap Flow

#### 1. Currency Swap Controller (`/app/controllers/api/v1/currency_swap_controller.rb`)
```ruby
def create
  float_swap_data = float_swap_params

  # Extract inbound and outbound data from breakdowns
  inbound_breakdowns = float_swap_data[:breakdowns].select { |b| b[:direction] == 'INBOUND' }
  outbound_breakdowns = float_swap_data[:breakdowns].select { |b| b[:direction] == 'OUTBOUND' }

  # Create inbound and outbound objects
  inbound_data = {}
  inbound_breakdowns.each do |breakdown|
    inbound_data[breakdown[:denomination][:value].to_s] = breakdown[:count]
  end

  outbound_data = {}
  outbound_breakdowns.each do |breakdown|
    outbound_data[breakdown[:denomination][:value].to_s] = breakdown[:count]
  end

  # Extract repository IDs from breakdowns if not provided
  inbound_repository_id = float_swap_data[:inbound_repository_id].presence
  if inbound_repository_id.blank? && inbound_breakdowns.present?
    inbound_repository_id = inbound_breakdowns.first[:repository_id]
  end

  outbound_repository_id = float_swap_data[:outbound_repository_id].presence
  if outbound_repository_id.blank? && outbound_breakdowns.present?
    outbound_repository_id = outbound_breakdowns.first[:repository_id]
  end

  # Format the data for the service
  currency_swap_data = {
    ticker: float_swap_data[:inbound_ticker],
    inbound_repository_id: inbound_repository_id,
    outbound_repository_id: outbound_repository_id,
    session_id: float_swap_data[:session_id],
    inbound_sum: float_swap_data[:inbound_sum],
    outbound_sum: float_swap_data[:outbound_sum]
  }

  breakdowns = BreakdownsHelper.format_controller_breakdowns_data(
    float_swap_data[:breakdowns]
  )

  currency_swap_service = FloatEngine::CurrencySwapService.call(
    new_swap_data: currency_swap_data,
    breakdowns: breakdowns,
    user: current_user,
    action: 'CREATE',
    inbound: inbound_data,
    outbound: outbound_data
  )

  if currency_swap_service.success
    render json: { result: currency_swap_service.currency_swap }, status: 200
  else
    render json: { error: currency_swap_service.error }, status: 500
  end
end
```

#### 2. Currency Swap Model (`/app/models/currency_swap.rb`)
```ruby
class CurrencySwap < ApplicationRecord
  belongs_to :session
  belongs_to :repository
  belongs_to :currency
  belongs_to :user, optional: true
  has_many :breakdowns, as: :breakable
  has_many :float_snapshots, as: :source_model
  belongs_to :inbound_repository, class_name: 'Repository', optional: true
  belongs_to :outbound_repository, class_name: 'Repository', optional: true

  validates :inbound_ticker, presence: true
  validates :outbound_ticker, presence: true
  validates :inbound_repository_id, presence: true
  validates :outbound_repository_id, presence: true
  validates :inbound_sum, presence: true
  validates :outbound_sum, presence: true
  validates :user_id, presence: true
  validates :session_id, presence: true

  validate :_validate_currency_swap_source_model, on: :create

  private

  def _validate_currency_swap_source_model
    throw('Inbound sum cannot be 0 for CurrencySwap.') unless inbound_sum != 0.0
    throw('Outbound sum cannot be 0 for CurrencySwap.') unless outbound_sum != 0.0

    session = Session.find_by(id: session_id)
    unless session && session.state == 'FLOAT_OPEN_COMPLETE'
      throw('Session must be open for business')
    end

    user = User.find_by(id: user_id)
    throw('User must be active') unless user && user.is_active

    true
  end
end
```

#### 3. Currency Swap Service (`/app/services/float_engine/currency_swap_service.rb`)
```ruby
module FloatEngine
  class CurrencySwapService
    attr_reader :success, :error, :currency_swap, :activity

    def self.call(new_swap_data:, breakdowns:, user:, action:, inbound:, outbound:)
      new(
        new_swap_data: new_swap_data,
        breakdowns: breakdowns,
        user: user,
        action: action,
        inbound: inbound,
        outbound: outbound
      ).call
    end

    def call
      set_values
      perform_validation

      @currency_swap = CurrencySwap.create(
        inbound: @inbound,
        outbound: @outbound,
        session_id: @session.id,
        repository_id: @inbound_repository.id,
        currency_id: @currency.id,
        swap_value: @value,
        status: 'COMPLETED',
        user_id: @user.id,
        inbound_ticker: @currency.ticker,
        outbound_ticker: @currency.ticker,
        inbound_repository_id: @inbound_repository.id,
        outbound_repository_id: @outbound_repository.id,
        inbound_sum: @value,
        outbound_sum: @value
      )

      float_stacks_change_service = FloatEngine::FloatStacksChangeService.call(
        breakable: @currency_swap,
        intention: 'CREATE_AND_COMMIT',
        breakdowns: @breakdowns
      )

      raise float_stacks_change_service.error if float_stacks_change_service.error

      @activity = Activity.create_from_params(
        event: 'SWAP_CREATED',
        user_id: @user.id,
        session_id: @session.id,
        reference_id: '',
        comment: '',
        meta: @new_swap_data
      )

      self
    rescue => e
      @currency_swap.destroy if @currency_swap
      @activity.destroy if @activity

      @success = false
      @error = e
      self
    end

    private

    def set_values
      @session = Session.find(@new_swap_data[:session_id])
      @currency = Currency.find_by(ticker: @new_swap_data[:ticker])
      @inbound_repository = Repository.find(@new_swap_data[:inbound_repository_id])
      @outbound_repository = Repository.find(@new_swap_data[:outbound_repository_id])
      @value = @new_swap_data[:inbound_sum]
    end

    def perform_validation
      throw 'Currency session missing' if @session.nil?
      throw 'Inbound repository missing' if @inbound_repository.nil?
      throw 'Outbound repository missing' if @outbound_repository.nil?
      throw 'Currency missing' if @currency.nil?

      @session.ensure_operable!
    end
  end
end
```

### Frontend Currency Swap Flow

#### 1. Swap Data Helper (`/src/pages/Dashboard/TellerViews/Swap/data.js`)
```javascript
export const confirmBillSwap = (sessionData, payload, ticker) => {
  return fetch(`${sessionData.baseUrl}/api/v1/currency_swap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Email': sessionData.userEmail,
      'X-User-Token': sessionData.userToken
    },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .catch(err => {
      console.log(err)
      AppToast('Unable to create currency swap.', 'error')
      return false
    })
    .then(data => {
      if (data.error) {
        console.log(data)
        AppToast('Unable to create currency swap.', 'error')
        return false
      } else {
        AppToast(
          `Successfully created currency swap. Float for ${ticker} has been updated!`,
          'success'
        )
        AppToast(data.message, 'info')
        return true
      }
    })
}

export const getSessionSwaps = (sessionData, sessionID) => {
  return makeAppGetRequest({
    sessionData,
    path: `currency_swap/session_history/${sessionID}`
  })
}
```

## Technical Implementation (MetaCX/Convex)

### Backend Currency Swap Creation
```typescript
export const createCurrencySwap = mutation({
  args: {
    clerkOrganizationId: v.string(),
    sessionId: v.id("org_cx_sessions"),
    inboundRepositoryId: v.id("org_repositories"),
    outboundRepositoryId: v.id("org_repositories"),
    ticker: v.string(),
    inboundSum: v.number(),
    outboundSum: v.number(),
    breakdowns: v.array(v.object({
      floatStackId: v.id("org_float_stacks"),
      count: v.number(),
      direction: v.string(), // "INBOUND" or "OUTBOUND"
      repositoryId: v.id("org_repositories"),
      denomination: v.object({
        value: v.string(),
        id: v.string()
      })
    }))
  },
  handler: async (ctx, args) => {
    // 1. Authenticate user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // 2. Validate session
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "FLOAT_OPEN_COMPLETE") {
      throw new Error("Session must be open for business");
    }
    
    // 3. Validate repositories
    const inboundRepo = await ctx.db.get(args.inboundRepositoryId);
    const outboundRepo = await ctx.db.get(args.outboundRepositoryId);
    if (!inboundRepo || !outboundRepo) {
      throw new Error("Invalid repositories specified");
    }
    
    // 4. Validate currency
    const currency = await ctx.db
      .query("org_currencies")
      .withIndex("by_ticker", (q) => q.eq("ticker", args.ticker))
      .first();
    if (!currency) throw new Error("Currency not found");
    
    // 5. Validate sums
    if (args.inboundSum <= 0 || args.outboundSum <= 0) {
      throw new Error("Inbound and outbound sums must be greater than 0");
    }
    
    // 6. Validate breakdowns
    const inboundBreakdowns = args.breakdowns.filter(b => b.direction === "INBOUND");
    const outboundBreakdowns = args.breakdowns.filter(b => b.direction === "OUTBOUND");
    
    if (inboundBreakdowns.length === 0 || outboundBreakdowns.length === 0) {
      throw new Error("Both inbound and outbound breakdowns are required");
    }
    
    // 7. Create currency swap record
    const swapId = await ctx.db.insert("org_currency_swaps", {
      clerkOrganizationId: args.clerkOrganizationId,
      sessionId: args.sessionId,
      userId: identity.subject,
      currencyId: currency._id,
      inboundRepositoryId: args.inboundRepositoryId,
      outboundRepositoryId: args.outboundRepositoryId,
      inboundTicker: args.ticker,
      outboundTicker: args.ticker,
      inboundSum: args.inboundSum,
      outboundSum: args.outboundSum,
      status: "COMPLETED",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // 8. Create breakdown records
    for (const breakdown of args.breakdowns) {
      await ctx.db.insert("org_breakdowns", {
        clerkOrganizationId: args.clerkOrganizationId,
        breakableType: "currency_swap",
        breakableId: swapId,
        floatStackId: breakdown.floatStackId,
        count: breakdown.count,
        direction: breakdown.direction,
        repositoryId: breakdown.repositoryId,
        denominationValue: breakdown.denomination.value,
        denominationId: breakdown.denomination.id,
        status: "COMMITTED",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // 9. Update float stacks
    await updateFloatStacksForSwap(ctx, args.breakdowns);
    
    // 10. Log activity
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: args.clerkOrganizationId,
      userId: identity.subject,
      sessionId: args.sessionId,
      event: "SWAP_CREATED",
      referenceId: swapId,
      comment: "",
      meta: {
        ticker: args.ticker,
        inboundSum: args.inboundSum,
        outboundSum: args.outboundSum,
        inboundRepositoryId: args.inboundRepositoryId,
        outboundRepositoryId: args.outboundRepositoryId
      },
      createdAt: Date.now(),
    });
    
    return { success: true, swapId };
  },
});

// Helper function to update float stacks
async function updateFloatStacksForSwap(ctx: any, breakdowns: any[]) {
  for (const breakdown of breakdowns) {
    const floatStack = await ctx.db.get(breakdown.floatStackId);
    if (!floatStack) continue;
    
    const newCount = breakdown.direction === "INBOUND" 
      ? floatStack.currentCount + breakdown.count
      : floatStack.currentCount - breakdown.count;
    
    await ctx.db.patch(breakdown.floatStackId, {
      currentCount: newCount,
      updatedAt: Date.now(),
    });
  }
}
```

### Session History Query
```typescript
export const getSessionCurrencySwaps = query({
  args: {
    sessionId: v.id("org_cx_sessions"),
  },
  handler: async (ctx, args) => {
    const swaps = await ctx.db
      .query("org_currency_swaps")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();
    
    // Enrich with repository names
    const enrichedSwaps = await Promise.all(
      swaps.map(async (swap) => {
        const inboundRepo = await ctx.db.get(swap.inboundRepositoryId);
        const outboundRepo = await ctx.db.get(swap.outboundRepositoryId);
        
        return {
          ...swap,
          inboundRepositoryName: inboundRepo?.name,
          outboundRepositoryName: outboundRepo?.name,
        };
      })
    );
    
    return enrichedSwaps;
  },
});
```

## Error Handling

### Validation Errors
- **Unauthorized**: "User is not authenticated or lacks permissions"
- **Session Not Open**: "Session must be open for business"
- **Invalid Repository**: "Invalid repositories specified"
- **Currency Not Found**: "Currency not found"
- **Zero Sum**: "Inbound and outbound sums must be greater than 0"
- **Missing Breakdowns**: "Both inbound and outbound breakdowns are required"
- **Insufficient Float**: "Insufficient float in outbound repository"

### System Errors
- **Database Error**: "An error occurred while creating the currency swap"
- **Float Update Error**: "Failed to update float stacks"

## User Interface Requirements

### Creation Form
1. **Currency Selection**: Dropdown of available currencies
2. **Repository Selection**: Separate selectors for inbound and outbound repositories
3. **Amount Input**: Inbound and outbound sum fields (must match)
4. **Breakdown Builder**: Interface for specifying denominations and counts
5. **Validation Feedback**: Real-time validation with clear error messages
6. **Confirmation Dialog**: Summary before final submission

### Success States
- Green notification: "Successfully created currency swap. Float for [TICKER] has been updated!"
- Automatic refresh of float data
- Update of repository float counts

### History View
- List of all swaps for current session
- Show repository names, amounts, and timestamps
- Filter by currency or repository

## Integration Points

### Components Using Currency Swaps
1. **Swap Page**: Main interface for creating swaps
2. **Float Management**: Integration with float stack updates
3. **Session Dashboard**: Display of swap history
4. **Audit Trail**: Activity logging for compliance

### Shared Functions
- `createCurrencySwap()` from swap creation hook
- `getSessionCurrencySwaps()` for history
- `updateFloatStacksForSwap()` for float management

## Testing Requirements

### Unit Tests
- Test swap creation with valid/invalid data
- Test breakdown validation logic
- Test float stack updates
- Test repository validation
- Test currency validation

### Integration Tests
- Test complete swap flow from UI
- Test float stack consistency
- Test session history tracking
- Test error handling

### Edge Cases
- Insufficient float in outbound repository
- Invalid repository combinations
- Zero or negative amounts
- Malformed breakdown data
- Concurrent swap attempts

## Security Considerations

### Authorization
- Verify user has swap permissions
- Validate user belongs to session organization
- Ensure repositories are accessible to user

### Data Integrity
- Atomic swap creation with float updates
- Proper audit trail with activity logging
- Validation of all dependent data

## Performance Considerations

### Database Queries
- Efficient indexing on session ID for history queries
- Optimize float stack updates with batch operations
- Cache currency and repository data

### User Experience
- Fast validation feedback
- Real-time float count updates
- Progress indicators for complex operations

## Migration Notes

### Legacy to MetaCX Differences
1. **Authentication**: Rails uses token auth vs MetaCX uses Clerk JWT
2. **Database**: Rails PostgreSQL vs MetaCX Convex
3. **Float Management**: Legacy uses complex service objects vs MetaCX direct updates
4. **Activity Logging**: Legacy uses polymorphic associations vs MetaCX structured logs

### Preserved Legacy Logic
- Session state validation (FLOAT_OPEN_COMPLETE required)
- Repository and currency validation
- Breakdown structure and validation
- Activity logging for audit trail
- Status tracking (COMPLETED status)

## Future Enhancements

### Potential Improvements
1. **Quick Swap**: Pre-configured common swap patterns
2. **Bulk Swaps**: Process multiple swaps at once
3. **Swap Templates**: Save and reuse swap configurations
4. **Auto-calculation**: Automatically calculate optimal denominations
5. **Swap Analytics**: Track swap patterns and efficiency

### Analytics
- Track swap frequency by currency and repository
- Monitor float movement patterns
- Report on swap success rates
- User behavior analysis for swap optimization
