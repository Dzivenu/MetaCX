# Float Transfer Specification

## Overview
This document details the process and requirements for creating float transfers in the MetaCX application. Float transfers allow tellers to move currency between repositories, maintaining accurate float tracking and audit trails.

## Business Rules

### Prerequisites for Float Transfer
1. **Session Status**: Session must be in `FLOAT_OPEN_COMPLETE` state
2. **User Authorization**: User must be active and authorized on the session
3. **Repository Validation**: Both source and destination repositories must exist and be accessible
4. **Currency Validation**: Both inbound and outbound tickers must be specified
5. **Non-zero Values**: Both inbound and outbound sums must be greater than 0
6. **Breakdown Validation**: Breakdowns must match the specified sums and directions

### Transfer Process Flow
1. **Select Direction**: Choose transfer direction (between repositories)
2. **Select Currency**: Choose the currency ticker for the transfer
3. **Specify Amounts**: Enter inbound and outbound sums
4. **Define Breakdowns**: Specify denominations and counts for transfer
5. **Validate & Execute**: System validates and processes the transfer
6. **Update Float**: Float stacks are automatically updated

## Legacy System Analysis (Rails Backend)

### Backend Float Transfer Flow

#### 1. Repositories Controller Float Transfer (`/app/controllers/api/v1/repositories_controller.rb`)
```ruby
def float_transfer
  authorize User

  request_raw = float_transfer_params
  breakdowns_params = request_raw[:breakdowns]
  denominations_params = float_transfer_params[:denominations]

  breakdowns_data = BreakdownsHelper.format_controller_breakdowns_data(breakdowns_params)

  service = FloatEngine::RepositoryTransferService.call(
    outbound_repository_id: request_raw[:outbound_repository_id],
    inbound_repository_id: request_raw[:inbound_repository_id],
    session_id: request_raw[:session_id],
    outbound_sum: request_raw[:outbound_sum],
    inbound_sum: request_raw[:inbound_sum],
    outbound_ticker: request_raw[:outbound_ticker],
    inbound_ticker: request_raw[:inbound_ticker],
    user: current_user,
    breakdowns: breakdowns_data,
    denominations: denominations_params
  )

  if service.success == true
    render json: { float_transfer: service.transfer }, status: 200
  else
    render json: service.error, status: 500
  end
end

def float_transfer_params
  params.require(:float_transfer).permit(
    :session_id,
    :outbound_repository_id,
    :inbound_repository_id,
    :outbound_sum,
    :inbound_sum,
    :outbound_ticker,
    :inbound_ticker,
    denominations: %i[bill_type bill_count],
    breakdowns: [
      :float_stack_id,
      :repository_id,
      :count,
      :direction,
      denomination: [:value]
    ]
  )
end
```

#### 2. Float Transfer Model (`/app/models/float_transfer.rb`)
```ruby
class FloatTransfer < ApplicationRecord
  belongs_to :session
  belongs_to :from, class_name: 'Repository'
  belongs_to :to, class_name: 'Repository'
  belongs_to :user
  belongs_to :inbound_repository, class_name: 'Repository', optional: true
  belongs_to :outbound_repository, class_name: 'Repository', optional: true

  # Define the polymorphic association to Breakdowns
  has_many :breakdowns, as: :breakable, dependent: :destroy
  has_many :float_snapshots, as: :source_model

  validates :inbound_ticker, presence: true
  validates :outbound_ticker, presence: true
  validates :inbound_repository_id, presence: true
  validates :outbound_repository_id, presence: true
  validates :inbound_sum, presence: true
  validates :outbound_sum, presence: true

  validates :user_id, presence: true
  validates :session_id, presence: true

  validate :_validate_float_transfer_source_model, on: :create

  def inbound_currency
    inbound_ticker.present? ? Currency.find_by(ticker: inbound_ticker) : nil
  end

  def outbound_currency
    outbound_ticker.present? ? Currency.find_by(ticker: outbound_ticker) : nil
  end

  private

  def _validate_float_transfer_source_model
    unless inbound_sum != 0.0
      throw('Inbound sum cannot be 0 for FloatTransfer.')
    end

    unless outbound_sum != 0.0
      throw('Outbound sum cannot be 0 for FloatTransfer.')
    end

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

#### 3. Repository Transfer Service (`/app/services/float_engine/repository_transfer_service.rb`)
```ruby
module FloatEngine
  class RepositoryTransferService < ApplicationService
    attr_reader :transfer, :activity, :success, :error, :user

    def self.call(
      outbound_repository_id:,
      inbound_repository_id:,
      session_id:,
      outbound_sum:,
      inbound_sum:,
      outbound_ticker:,
      inbound_ticker:,
      user:,
      breakdowns:,
      denominations: nil
    )
      new(
        outbound_repository_id: outbound_repository_id,
        inbound_repository_id: inbound_repository_id,
        session_id: session_id,
        outbound_sum: outbound_sum,
        inbound_sum: inbound_sum,
        outbound_ticker: outbound_ticker,
        inbound_ticker: inbound_ticker,
        user: user,
        breakdowns: breakdowns,
        denominations: denominations
      ).call
    end

    def call
      outbound_repo = Repository.find(@outbound_repository_id)
      inbound_repo = Repository.find(@inbound_repository_id)
      session = Session.find(@session_id)

      @transfer = FloatTransfer.create!(
        from: outbound_repo,
        to: inbound_repo,
        session: session,
        value: @outbound_sum,
        ticker: @outbound_ticker,
        breakdown: @denominations,
        user_id: @user.id,
        inbound_ticker: @inbound_ticker,
        outbound_ticker: @outbound_ticker,
        inbound_repository_id: @inbound_repository_id,
        outbound_repository_id: @outbound_repository_id,
        inbound_sum: @inbound_sum,
        outbound_sum: @outbound_sum,
        status: 'COMPLETED'
      )

      service = FloatEngine::FloatStacksChangeService.call(
        breakable: @transfer,
        intention: 'CREATE_AND_COMMIT',
        breakdowns: @breakdowns
      )

      raise service.error if service.error

      @activity = Activity.create_from_params(
        event: 'TRANSFER_CREATED',
        user_id: @user.id,
        session_id: @session_id,
        reference_id: @transfer.id,
        comment: '',
        meta: ''
      )

      @success = true
      self
    rescue StandardError => e
      @transfer.destroy if @transfer
      @activity.destroy if @activity

      @success = false
      @error = e
      self
    end
  end
end
```

#### 4. Float Transfers Controller (`/app/controllers/api/v1/float_transfers_controller.rb`)
```ruby
class Api::V1::FloatTransfersController < Api::V1::BaseController
  acts_as_token_authentication_handler_for User

  def index
    begin
      @float_transfers = policy_scope(FloatTransfer)
        .includes(:from, :to)
        .where(session: params[:session_id])
        .order(created_at: :desc)
    rescue => exception
      render json: { errors: exception.message }, status: 400
    end
  end

  def logs
    # Parse API date data
    start_date = Date.parse(params['start_date'])
    end_date = Date.parse(params['end_date'])

    transfers = FloatTransfer.where(
      'created_at >= ? AND created_at <= ?',
      start_date,
      end_date
    )
    authorize transfers

    if transfers
      transfers_with_repos = transfers.map do |transfer|
        {
          transfer: transfer,
          from_repo: Repository.find_by(id: transfer.from_id),
          to_repo: Repository.find_by(id: transfer.to_id)
        }
      end

      render json: { status: 200, data: transfers_with_repos }, status: 200
    else
      render json: { error: 'Error fetching transfers.' }, status: :unprocessable_entity
    end
  end
end
```

### Frontend Float Transfer Flow

#### 1. Transfers Data Helper (`/src/pages/Dashboard/TellerViews/Transfers/data.js`)
```javascript
export const createDebitDeposit = (sessionData, payload) => {
  return fetch(`${sessionData.baseUrl}/api/v1/repositories/float_transfer`, {
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
      AppToast('Unable to create new debit-deposit.', 'error')
    })
}

export const fetchSessionTransfers = (sessionData, id) => {
  return fetch(`${sessionData.baseUrl}/api/v1/float_transfers?session_id=${id}`, {
    method: 'GET',
    headers: {
      'Content-type': 'application/json',
      'X-User-Email': sessionData.userEmail,
      'X-User-Token': sessionData.userToken
    }
  })
    .then(res => res.json())
    .catch(err => {
      console.log(err)
      AppToast(`Unable to fetch transfer history for session id #${id}.`, 'error')
    })
}

export const fetchLatestSession = (sessionData) => {
  return fetch(`${sessionData.baseUrl}/api/v1/sessions/latest`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Email': `${sessionData.userEmail}`,
      'X-User-Token': `${sessionData.userToken}`
    }
  })
    .then(res => res.json())
    .catch(err => {
      console.log(err)
      AppToast('Unable to fetch latest session details.', 'error')
    })
}
```

## Technical Implementation (MetaCX/Convex)

### Backend Float Transfer Creation
```typescript
export const createFloatTransfer = mutation({
  args: {
    clerkOrganizationId: v.string(),
    sessionId: v.id("org_cx_sessions"),
    fromRepositoryId: v.id("org_repositories"),
    toRepositoryId: v.id("org_repositories"),
    inboundTicker: v.string(),
    outboundTicker: v.string(),
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
    })),
    denominations: v.optional(v.array(v.object({
      bill_type: v.string(),
      bill_count: v.number()
    })))
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
    const fromRepo = await ctx.db.get(args.fromRepositoryId);
    const toRepo = await ctx.db.get(args.toRepositoryId);
    if (!fromRepo || !toRepo) {
      throw new Error("Invalid repositories specified");
    }
    
    // 4. Validate currencies
    const inboundCurrency = await ctx.db
      .query("org_currencies")
      .withIndex("by_ticker", (q) => q.eq("ticker", args.inboundTicker))
      .first();
    const outboundCurrency = await ctx.db
      .query("org_currencies")
      .withIndex("by_ticker", (q) => q.eq("ticker", args.outboundTicker))
      .first();
    
    if (!inboundCurrency || !outboundCurrency) {
      throw new Error("Invalid currency tickers specified");
    }
    
    // 5. Validate sums
    if (args.inboundSum <= 0 || args.outboundSum <= 0) {
      throw new Error("Inbound and outbound sums must be greater than 0");
    }
    
    // 6. Validate breakdowns
    if (args.breakdowns.length === 0) {
      throw new Error("Breakdowns are required for float transfer");
    }
    
    // 7. Create float transfer record
    const transferId = await ctx.db.insert("org_float_transfers", {
      clerkOrganizationId: args.clerkOrganizationId,
      sessionId: args.sessionId,
      userId: identity.subject,
      fromRepositoryId: args.fromRepositoryId,
      toRepositoryId: args.toRepositoryId,
      inboundTicker: args.inboundTicker,
      outboundTicker: args.outboundTicker,
      inboundSum: args.inboundSum,
      outboundSum: args.outboundSum,
      value: args.outboundSum,
      ticker: args.outboundTicker,
      status: "COMPLETED",
      breakdown: args.denominations || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // 8. Create breakdown records
    for (const breakdown of args.breakdowns) {
      await ctx.db.insert("org_breakdowns", {
        clerkOrganizationId: args.clerkOrganizationId,
        breakableType: "float_transfer",
        breakableId: transferId,
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
    await updateFloatStacksForTransfer(ctx, args.breakdowns);
    
    // 10. Log activity
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: args.clerkOrganizationId,
      userId: identity.subject,
      sessionId: args.sessionId,
      event: "TRANSFER_CREATED",
      referenceId: transferId,
      comment: "",
      meta: {
        fromRepositoryId: args.fromRepositoryId,
        toRepositoryId: args.toRepositoryId,
        inboundTicker: args.inboundTicker,
        outboundTicker: args.outboundTicker,
        inboundSum: args.inboundSum,
        outboundSum: args.outboundSum
      },
      createdAt: Date.now(),
    });
    
    return { success: true, transferId };
  },
});

// Helper function to update float stacks
async function updateFloatStacksForTransfer(ctx: any, breakdowns: any[]) {
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

### Session Transfers Query
```typescript
export const getSessionFloatTransfers = query({
  args: {
    sessionId: v.id("org_cx_sessions"),
  },
  handler: async (ctx, args) => {
    const transfers = await ctx.db
      .query("org_float_transfers")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();
    
    // Enrich with repository names
    const enrichedTransfers = await Promise.all(
      transfers.map(async (transfer) => {
        const fromRepo = await ctx.db.get(transfer.fromRepositoryId);
        const toRepo = await ctx.db.get(transfer.toRepositoryId);
        
        return {
          ...transfer,
          fromRepositoryName: fromRepo?.name,
          toRepositoryName: toRepo?.name,
        };
      })
    );
    
    return enrichedTransfers;
  },
});
```

### Transfer Logs Query
```typescript
export const getFloatTransferLogs = query({
  args: {
    clerkOrganizationId: v.string(),
    startDate: v.number(), // timestamp
    endDate: v.number(),   // timestamp
  },
  handler: async (ctx, args) => {
    const transfers = await ctx.db
      .query("org_float_transfers")
      .withIndex("by_clerk_org_id", (q) => 
        q.eq("clerkOrganizationId", args.clerkOrganizationId)
      )
      .filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), args.startDate),
          q.lte(q.field("createdAt"), args.endDate)
        )
      )
      .collect();
    
    // Enrich with repository details
    const enrichedTransfers = await Promise.all(
      transfers.map(async (transfer) => {
        const fromRepo = await ctx.db.get(transfer.fromRepositoryId);
        const toRepo = await ctx.db.get(transfer.toRepositoryId);
        
        return {
          transfer: transfer,
          fromRepo: fromRepo ? {
            id: fromRepo._id,
            name: fromRepo.name
          } : null,
          toRepo: toRepo ? {
            id: toRepo._id,
            name: toRepo.name
          } : null,
        };
      })
    );
    
    return { status: 200, data: enrichedTransfers };
  },
});
```

## Error Handling

### Validation Errors
- **Unauthorized**: "User is not authenticated or lacks permissions"
- **Session Not Open**: "Session must be open for business"
- **Invalid Repository**: "Invalid repositories specified"
- **Invalid Currency**: "Invalid currency tickers specified"
- **Zero Sum**: "Inbound and outbound sums must be greater than 0"
- **Missing Breakdowns**: "Breakdowns are required for float transfer"
- **Insufficient Float**: "Insufficient float in source repository"

### System Errors
- **Database Error**: "An error occurred while creating the float transfer"
- **Float Update Error**: "Failed to update float stacks"

## User Interface Requirements

### Creation Form
1. **Source Repository**: Dropdown/select for outbound repository
2. **Destination Repository**: Dropdown/select for inbound repository
3. **Currency Selection**: Separate selectors for inbound/outbound currencies
4. **Amount Input**: Inbound and outbound sum fields
5. **Breakdown Builder**: Interface for specifying denominations and counts
6. **Validation Feedback**: Real-time validation with clear error messages
7. **Confirmation Dialog**: Summary before final submission

### Success States
- Green notification: "Successfully created float transfer"
- Automatic refresh of float data
- Update of repository float counts
- Transfer added to session history

### History View
- List of all transfers for current session
- Show source/destination repositories, amounts, and timestamps
- Filter by currency or repository
- Transfer details with breakdown information

## Integration Points

### Components Using Float Transfers
1. **Transfers Page**: Main interface for creating transfers
2. **Float Management**: Integration with float stack updates
3. **Session Dashboard**: Display of transfer history
4. **Repository Management**: Float tracking across repositories
5. **Audit Trail**: Activity logging for compliance

### Shared Functions
- `createFloatTransfer()` from transfer creation hook
- `getSessionFloatTransfers()` for session history
- `getFloatTransferLogs()` for reporting
- `updateFloatStacksForTransfer()` for float management

## Testing Requirements

### Unit Tests
- Test transfer creation with valid/invalid data
- Test breakdown validation logic
- Test float stack updates
- Test repository validation
- Test currency validation
- Test insufficient float scenarios

### Integration Tests
- Test complete transfer flow from UI
- Test float stack consistency across repositories
- Test session history tracking
- Test error handling
- Test concurrent transfer attempts

### Edge Cases
- Insufficient float in source repository
- Invalid repository combinations
- Zero or negative amounts
- Malformed breakdown data
- Transfer between same repository
- Large transfer amounts

## Security Considerations

### Authorization
- Verify user has transfer permissions
- Validate user belongs to session organization
- Ensure repositories are accessible to user
- Prevent unauthorized float movements

### Data Integrity
- Atomic transfer creation with float updates
- Proper audit trail with activity logging
- Validation of all dependent data
- Float consistency checks

## Performance Considerations

### Database Queries
- Efficient indexing on session ID for history queries
- Optimize float stack updates with batch operations
- Cache currency and repository data
- Pagination for large transfer histories

### User Experience
- Fast validation feedback
- Real-time float count updates
- Progress indicators for complex operations
- Optimistic updates with rollback capability

## Migration Notes

### Legacy to MetaCX Differences
1. **Authentication**: Rails uses token auth vs MetaCX uses Clerk JWT
2. **Database**: Rails PostgreSQL vs MetaCX Convex
3. **Repository Management**: Legacy uses complex associations vs MetaCX direct references
4. **Activity Logging**: Legacy uses polymorphic associations vs MetaCX structured logs

### Preserved Legacy Logic
- Session state validation (FLOAT_OPEN_COMPLETE required)
- Repository and currency validation
- Breakdown structure and validation
- Activity logging for audit trail
- Status tracking (COMPLETED status)
- Float stack management through breakdowns

## Future Enhancements

### Potential Improvements
1. **Quick Transfer**: Pre-configured common transfer patterns
2. **Bulk Transfers**: Process multiple transfers at once
3. **Transfer Templates**: Save and reuse transfer configurations
4. **Auto-calculation**: Automatically calculate optimal denominations
5. **Transfer Analytics**: Track transfer patterns and efficiency
6. **Scheduled Transfers**: Allow scheduling transfers for future times

### Analytics
- Track transfer frequency by currency and repository
- Monitor float movement patterns
- Report on transfer success rates
- User behavior analysis for transfer optimization
- Repository utilization analysis
