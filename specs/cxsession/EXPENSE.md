# Expense Specification

## Overview
This document details the process and requirements for creating and managing expenses in the MetaCX application. Expenses track operational costs, inventory purchases, and other financial transactions within trading sessions.

## Business Rules

### Prerequisites for Expense Creation
1. **Session Status**: Session must be in `FLOAT_OPEN_COMPLETE` state
2. **User Authorization**: User must be active and authorized on the session
3. **Direction Validation**: Expense must be either inbound (MONEY-IN) or outbound (MONEY-OUT), not both
4. **Non-zero Values**: At least one of inbound_sum or outbound_sum must be greater than 0
5. **Repository Validation**: Repository must be specified for the active direction
6. **Type Validation**: Expense type (typeof) must be specified

### Expense Types
- **SALE**: Revenue from sales (auto-generates sale_id)
- **PURCHASE**: Inventory purchases
- **EXPENSE**: Operational expenses
- **OTHER**: Miscellaneous transactions

### Direction Rules
- **Inbound (MONEY-IN)**: Money coming into the business
  - Requires: inbound_ticker, inbound_sum, inbound_repository_id
  - Sets: outbound_ticker = '', outbound_sum = 0.0, outbound_repository_id = null
- **Outbound (MONEY-OUT)**: Money going out of the business
  - Requires: outbound_ticker, outbound_sum, outbound_repository_id
  - Sets: inbound_ticker = '', inbound_sum = 0.0, inbound_repository_id = null

## Legacy System Analysis (Rails Backend)

### Backend Expense Flow

#### 1. Expenses Controller (`/app/controllers/api/v1/expenses_controller.rb`)
```ruby
def create
  authorize Expense

  expense_data = params[:data] || params
  session_id = expense_data[:session_id]
  user = current_user

  expense_breakdowns = expense_data[:breakdowns]
  breakdowns_data = BreakdownsHelper.format_controller_breakdowns_data(expense_breakdowns) if expense_breakdowns

  # Determine if this is an inbound or outbound expense
  is_inbound = expense_data[:inbound_ticker].present? && expense_data[:inbound_sum].present? && expense_data[:inbound_repository_id].present?
  
  # Set ticker and sum based on direction
  ticker = is_inbound ? expense_data[:inbound_ticker] : expense_data[:outbound_ticker]
  sum = is_inbound ? expense_data[:inbound_sum] : expense_data[:outbound_sum]
  repo_id = is_inbound ? expense_data[:inbound_repository_id] : expense_data[:outbound_repository_id]

  # Get currency and calculate FX rate
  expense_currency = Currency.find_by(ticker: ticker)
  expense_fx_rate = nil
  expense_sum_in_cad = 0

  fx_currency = expense_currency.ticker != 'CAD'

  if fx_currency
    expense_fx_rate = expense_currency.rate
    expense_sum_in_cad = expense_fx_rate * sum
  else
    expense_fx_rate = 1.0
    expense_sum_in_cad = sum
  end

  new_expense_data = {
    name: expense_data[:name],
    ticker: ticker,
    sum: sum,
    typeof: expense_data[:typeof],
    session_id: session_id,
    user_id: current_user.id,
    open_dt: Time.now,
    currency_id: expense_currency.id,
    fx_rate: expense_fx_rate,
    sum_in_cad: expense_sum_in_cad,
    status: expense_data[:status] || 'COMPLETED',
    inbound_ticker: expense_data[:inbound_ticker],
    outbound_ticker: expense_data[:outbound_ticker],
    inbound_sum: expense_data[:inbound_sum],
    outbound_sum: expense_data[:outbound_sum],
    inbound_repository_id: expense_data[:inbound_repository_id],
    outbound_repository_id: expense_data[:outbound_repository_id]
  }

  # Handle comment data if present
  infos = []
  if expense_data[:comment].present? && expense_data[:comment][:body].present?
    comment_data = expense_data[:comment]
    infos << {
      body: comment_data[:body],
      user_id: comment_data[:user_id] || current_user.id,
      session_id: session_id
    }
  end

  expense_service = FloatEngine::ExpenseService.call(
    new_expense_data: new_expense_data,
    breakdowns: breakdowns_data,
    repo_id: repo_id,
    infos: infos,
    user: current_user,
    action: 'CREATE'
  )

  if expense_service.success
    render json: { result: format_expenses_json([expense_service.expense]).first }, status: 201
  else
    render json: { error: expense_service.error }, status: 422
  end
end

def destroy
  authorize @expense
  
  expense_service = FloatEngine::ExpenseService.call(
    new_expense_data: nil,
    breakdowns: nil,
    repo_id: nil,
    infos: nil,
    expense: @expense,
    user: current_user,
    action: 'CANCEL'
  )

  if expense_service.success
    render json: { result: format_expenses_json([expense_service.expense]).first }, status: 200
  else
    render json: { error: expense_service.error }, status: 422
  end
end
```

#### 2. Expense Model (`/app/models/expense.rb`)
```ruby
class Expense < ApplicationRecord
  belongs_to :session, touch: true
  belongs_to :currency, touch: true
  belongs_to :user
  has_many :breakdowns, as: :breakable
  has_many :infos, as: :infoable
  has_many :flags, as: :flagable
  has_many :float_snapshots, as: :source_model
  before_create :set_sale_id_if_sale

  belongs_to :inbound_repository, class_name: 'Repository', optional: true
  belongs_to :outbound_repository, class_name: 'Repository', optional: true

  validates_presence_of :ticker, :name, :typeof, :sum
  validates :user_id, presence: true
  validates :session_id, presence: true
  validate :either_inbound_or_outbound_fields_present
  validate :_validate_expense_source_model, on: :create

  def self.between(start_date = DateTime.now - 365, end_date = DateTime.now + 1)
    start_dt = DateTime.parse("#{start_date}T00:00:EST")
    end_dt = DateTime.parse("#{end_date}T23:59:EST")
    Expense.where(
      "status = 'COMPLETED' AND created_at >= ? AND created_at <= ?",
      start_dt,
      end_dt
    )
  end

  def self.inventory_cost(start_dt = DateTime.now - 365, end_dt = DateTime.now + 1, repo = nil)
    if repo.nil?
      Expense.between(start_dt, end_dt).sum { |e| e&.inventory_cost }
    elsif repo.class == String
      repository = Repository.find_by name: repo
      Expense
        .where(
          'inbound_repository_id = ? OR outbound_repository_id = ?',
          repository.id,
          repository.id
        )
        .between(start_dt, end_dt)
        .sum { |e| e&.inventory_cost }
    end
  end

  def inventory_cost
    status == 'COMPLETED' ? fx_rate * sum : 0
  end

  def cancel
    self.revert_breakdown
    self.status = 'CANCELLED'
    self.cancel_dt = Time.now
    self.save
  end

  def fx_currency?
    self.ticker != 'CAD'
  end

  def inbound_currency
    inbound_ticker.present? ? Currency.find_by(ticker: inbound_ticker) : nil
  end

  def outbound_currency
    outbound_ticker.present? ? Currency.find_by(ticker: outbound_ticker) : nil
  end

  private

  def either_inbound_or_outbound_fields_present
    inbound_present = inbound_ticker.present? && inbound_repository_id.present? && inbound_sum.present?
    outbound_present = outbound_ticker.present? && outbound_repository_id.present? && outbound_sum.present?

    unless inbound_present || outbound_present
      errors.add(:base, 'Either all inbound fields or all outbound fields must be present')
    end
  end

  def set_sale_id_if_sale
    if typeof.present? && typeof.upcase == 'SALE'
      highest_sale_id = Expense.where(typeof: 'SALE').maximum(:sale_id)
      self.sale_id = highest_sale_id.to_i + 1
    end
  end

  def _validate_expense_source_model
    if inbound_sum == 0.0 && outbound_sum == 0.0
      throw('Inbound sum and outbound sum both cannot be 0 for Expense.')
    end

    if inbound_sum != 0.0 && outbound_sum != 0.0
      throw('Inbound sum and outbound sum both cannot have values for Expense.')
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

#### 3. Expense Service (`/app/services/float_engine/expense_service.rb`)
```ruby
module FloatEngine
  class ExpenseService < ApplicationService
    attr_reader :success, :error, :expense

    def self.call(
      new_expense_data:,
      breakdowns:,
      repo_id:,
      user:,
      infos:,
      action:,
      expense: nil
    )
      new(
        new_expense_data: new_expense_data,
        breakdowns: breakdowns,
        repo_id: repo_id,
        user: user,
        infos: infos,
        action: action,
        expense: expense
      ).call
    end

    def call
      set_values
      perform_validation

      ActiveRecord::Base.transaction do
        case @action
        when 'CREATE'
          create_expense
        when 'CANCEL'
          cancel_expense
        end
      end

      self
    rescue => e
      @success = false
      @error = e
      self
    end

    private

    def create_expense
      @expense = Expense.create!(@new_expense_data)

      unless @infos.nil? || @infos.length < 1
        @infos.each do |expense_info|
          expense_info[:infoable] = @expense
          expense_info[:session_id] = @session.id
          
          # Set user name from user_id if not already set
          if expense_info[:user_id] && !expense_info[:user]
            user = User.find(expense_info[:user_id])
            expense_info[:user] = user.first_name
          end
          
          Info.create!(expense_info)
        end
      end

      float_stack_change_service = FloatEngine::FloatStacksChangeService.call(
        breakable: @expense,
        intention: 'CREATE_AND_COMMIT',
        breakdowns: @breakdowns
      )

      raise float_stack_change_service.error if float_stack_change_service.error

      Activity.create_from_params(
        event: 'EXPENSE_CREATED',
        user_id: @user.id,
        session_id: @expense.session_id,
        reference_id: @expense.id,
        comment: '',
        meta: ''
      )

      @success = true
    end

    def cancel_expense
      float_stack_change_service = FloatEngine::FloatStacksChangeService.call(
        breakable: @expense,
        intention: 'UNCOMMIT',
        breakdowns: @breakdowns
      )

      raise float_stack_change_service.error if float_stack_change_service.error

      @expense.status = 'CANCELLED'
      @expense.cancel_dt = Time.now
      @expense.save

      Activity.create_from_params(
        event: 'EXPENSE_CANCELLED',
        user_id: @user.id,
        session_id: @expense.session_id,
        reference_id: @expense.id,
        comment: '',
        meta: ''
      )

      @success = true
    end

    def set_values
      if @expense && !@expense.session.nil?
        @session = @expense.session
        return
      end

      if !@new_expense_data.nil? && @new_expense_data[:session_id]
        @session = Session.find(@new_expense_data[:session_id])
      end
    end

    def perform_validation
      throw 'Expense session missing' if @session.nil?
      @session.ensure_operable!
    end
  end
end
```

### Frontend Expense Flow

#### 1. Expense Data Helper (`/src/containers/Expense/ExpenseData.js`)
```javascript
const formatExpenseBeforeSubmission = (sessionData, expense) => {
  const isInbound = expense.direction === 'MONEY-IN'
  const expenseSum = parseFloat(expense.sum)

  // Create the data object with the appropriate values based on direction
  const data = {
    name: expense.name,
    typeof: expense.typeof,
    breakdowns: expense.breakdowns,
    session_id: sessionData?.sessionID
  }

  // Include comment data if it exists
  if (
    expense.commentObj &&
    expense.commentObj.body &&
    expense.commentObj.body.trim() !== ''
  ) {
    data.comment = {
      body: expense.commentObj.body,
      user_id: expense.commentObj.user_id || sessionData?.userId
    }
  }

  // Set the appropriate fields based on direction
  if (isInbound) {
    data.inbound_ticker = expense.ticker
    data.outbound_ticker = ''
    data.inbound_sum = expenseSum
    data.outbound_sum = 0.0
    data.inbound_repository_id = expense.inbound_repository_id
    data.outbound_repository_id = null
  } else {
    data.inbound_ticker = ''
    data.outbound_ticker = expense.ticker
    data.inbound_sum = 0.0
    data.outbound_sum = expenseSum
    data.inbound_repository_id = null
    data.outbound_repository_id = expense.inbound_repository_id
  }

  return { data }
}

export const submitExpense = async (sessionData, expense) => {
  const expenseObj = formatExpenseBeforeSubmission(sessionData, expense)
  const response = await fetch(`${sessionData.baseUrl}/api/v1/expenses`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
      'X-User-Email': `${sessionData.userEmail}`,
      'X-User-Token': `${sessionData.userToken}`
    },
    body: JSON.stringify(expenseObj)
  })
  if (response.ok) {
    AppToast('Expense successfully created!', 'success')
    return true
  } else {
    console.log(response)
    console.dir(expenseObj)
    AppToast('Unable to create expense.', 'error')
    return false
  }
}

export const cancelExpense = (sessionData, expenseId) => {
  return fetch(`${sessionData.baseUrl}/api/v1/expenses/${expenseId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Email': sessionData.userEmail,
      'X-User-Token': sessionData.userToken
    }
  })
    .then(response => {
      if (response.ok) {
        AppToast(`Expense #${expenseId} cancelled.`, 'info')
      }
    })
    .catch(err => {
      console.log(err)
      AppToast(`Unable to cancel expense #${expenseId}.`, 'error')
    })
}
```

#### 2. Next.js Expenses API (`/src/apis/next/expenses.js`)
```javascript
// POST /expenses - Create new expense
export const createExpenseAPI = ({ sessionData, data }) => {
  return AppPostAPI({
    endpoint: 'expenses',
    sessionData,
    data
  })
}

// DELETE /expenses/:id - Delete expense
export const deleteExpenseAPI = ({ sessionData, expenseId }) => {
  return makeAppRequest({
    sessionData,
    method: 'DELETE',
    path: `expenses/${expenseId}`
  })
}

// GET /expenses/session_expenses - Get session expenses
export const getSessionExpensesAPI = ({ sessionData, params = {} }) => {
  return AppFetchAPI({
    endpoint: 'expenses/session_expenses',
    sessionData,
    params
  })
}
```

## Technical Implementation (MetaCX/Convex)

### Backend Expense Creation
```typescript
export const createExpense = mutation({
  args: {
    clerkOrganizationId: v.string(),
    sessionId: v.id("org_cx_sessions"),
    name: v.string(),
    typeof: v.string(), // "SALE", "PURCHASE", "EXPENSE", "OTHER"
    direction: v.string(), // "MONEY-IN" or "MONEY-OUT"
    ticker: v.string(),
    sum: v.number(),
    repositoryId: v.id("org_repositories"),
    breakdowns: v.optional(v.array(v.object({
      floatStackId: v.id("org_float_stacks"),
      count: v.number(),
      direction: v.string(),
      repositoryId: v.id("org_repositories"),
      denomination: v.object({
        value: v.string(),
        id: v.string()
      })
    }))),
    comment: v.optional(v.object({
      body: v.string(),
      userId: v.string()
    })),
    status: v.optional(v.string()) // defaults to "COMPLETED"
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
    
    // 3. Validate repository
    const repository = await ctx.db.get(args.repositoryId);
    if (!repository) throw new Error("Repository not found");
    
    // 4. Validate currency
    const currency = await ctx.db
      .query("org_currencies")
      .withIndex("by_ticker", (q) => q.eq("ticker", args.ticker))
      .first();
    if (!currency) throw new Error("Currency not found");
    
    // 5. Calculate FX rate and CAD sum
    const isFxCurrency = args.ticker !== "CAD";
    const fxRate = isFxCurrency ? currency.rate : 1.0;
    const sumInCad = fxRate * args.sum;
    
    // 6. Prepare expense data based on direction
    const isInbound = args.direction === "MONEY-IN";
    const expenseData = {
      clerkOrganizationId: args.clerkOrganizationId,
      sessionId: args.sessionId,
      userId: identity.subject,
      currencyId: currency._id,
      name: args.name,
      ticker: args.ticker,
      sum: args.sum,
      typeof: args.typeof,
      status: args.status || "COMPLETED",
      fxRate: fxRate,
      sumInCad: sumInCad,
      openDt: Date.now(),
      // Direction-specific fields
      inboundTicker: isInbound ? args.ticker : "",
      outboundTicker: isInbound ? "" : args.ticker,
      inboundSum: isInbound ? args.sum : 0.0,
      outboundSum: isInbound ? 0.0 : args.sum,
      inboundRepositoryId: isInbound ? args.repositoryId : null,
      outboundRepositoryId: isInbound ? null : args.repositoryId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    // 7. Auto-generate sale_id for SALE type
    if (args.typeof.toUpperCase() === "SALE") {
      const lastSale = await ctx.db
        .query("org_expenses")
        .withIndex("by_clerk_org_id", (q) => 
          q.eq("clerkOrganizationId", args.clerkOrganizationId)
        )
        .filter((q) => q.eq(q.field("typeof"), "SALE"))
        .order("desc")
        .first();
      
      expenseData.saleId = (lastSale?.saleId || 0) + 1;
    }
    
    // 8. Create expense record
    const expenseId = await ctx.db.insert("org_expenses", expenseData);
    
    // 9. Create comment if provided
    if (args.comment) {
      await ctx.db.insert("org_infos", {
        clerkOrganizationId: args.clerkOrganizationId,
        infoableType: "expense",
        infoableId: expenseId,
        sessionId: args.sessionId,
        userId: args.comment.userId || identity.subject,
        body: args.comment.body,
        comment: args.comment.body,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // 10. Create breakdowns if provided
    if (args.breakdowns && args.breakdowns.length > 0) {
      for (const breakdown of args.breakdowns) {
        await ctx.db.insert("org_breakdowns", {
          clerkOrganizationId: args.clerkOrganizationId,
          breakableType: "expense",
          breakableId: expenseId,
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
      
      // 11. Update float stacks
      await updateFloatStacksForExpense(ctx, args.breakdowns);
    }
    
    // 12. Log activity
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: args.clerkOrganizationId,
      userId: identity.subject,
      sessionId: args.sessionId,
      event: "EXPENSE_CREATED",
      referenceId: expenseId,
      comment: "",
      meta: {
        name: args.name,
        typeof: args.typeof,
        direction: args.direction,
        ticker: args.ticker,
        sum: args.sum
      },
      createdAt: Date.now(),
    });
    
    return { success: true, expenseId };
  },
});

// Helper function to update float stacks
async function updateFloatStacksForExpense(ctx: any, breakdowns: any[]) {
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

### Expense Cancellation
```typescript
export const cancelExpense = mutation({
  args: {
    expenseId: v.id("org_expenses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // 1. Get expense
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new Error("Expense not found");
    
    // 2. Get and reverse breakdowns
    const breakdowns = await ctx.db
      .query("org_breakdowns")
      .withIndex("by_breakable", (q) => 
        q.eq("breakableType", "expense").eq("breakableId", args.expenseId)
      )
      .collect();
    
    // 3. Reverse float stack changes
    await updateFloatStacksForExpense(ctx, breakdowns.map(b => ({
      ...b,
      direction: b.direction === "INBOUND" ? "OUTBOUND" : "INBOUND"
    })));
    
    // 4. Update expense status
    await ctx.db.patch(args.expenseId, {
      status: "CANCELLED",
      cancelDt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // 5. Log activity
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: expense.clerkOrganizationId,
      userId: identity.subject,
      sessionId: expense.sessionId,
      event: "EXPENSE_CANCELLED",
      referenceId: args.expenseId,
      comment: "",
      meta: {},
      createdAt: Date.now(),
    });
    
    return { success: true, message: "Expense cancelled successfully" };
  },
});
```

### Session Expenses Query
```typescript
export const getSessionExpenses = query({
  args: {
    sessionId: v.id("org_cx_sessions"),
  },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("org_expenses")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();
    
    // Enrich with related data
    const enrichedExpenses = await Promise.all(
      expenses.map(async (expense) => {
        const user = await ctx.db.get(expense.userId);
        const session = await ctx.db.get(expense.sessionId);
        const currency = await ctx.db.get(expense.currencyId);
        const repoId = expense.inboundRepositoryId || expense.outboundRepositoryId;
        const repository = repoId ? await ctx.db.get(repoId) : null;
        const infos = await ctx.db
          .query("org_infos")
          .withIndex("by_infoable", (q) => 
            q.eq("infoableType", "expense").eq("infoableId", expense._id)
          )
          .collect();
        const breakdowns = await ctx.db
          .query("org_breakdowns")
          .withIndex("by_breakable", (q) => 
            q.eq("breakableType", "expense").eq("breakableId", expense._id)
          )
          .collect();
        
        return {
          ...expense,
          user: user ? {
            id: user._id,
            first_name: user.firstName,
            last_name: user.lastName
          } : null,
          session: session ? {
            id: session._id,
            user: user ? {
              id: user._id,
              first_name: user.firstName,
              last_name: user.lastName
            } : null
          } : null,
          currency: currency ? {
            id: currency._id,
            ticker: currency.ticker
          } : null,
          repositoryName: repository?.name,
          infos: infos.map(info => ({
            id: info._id,
            comment: info.comment,
            body: info.body,
            created_at: info.createdAt,
            user: info.userId,
            user_id: info.userId
          })),
          breakdowns: breakdowns.map(breakdown => ({
            id: breakdown._id,
            count: breakdown.count,
            status: breakdown.status,
            direction: breakdown.direction,
            denomination: breakdown.denominationValue
          }))
        };
      })
    );
    
    return enrichedExpenses;
  },
});
```

## Error Handling

### Validation Errors
- **Unauthorized**: "User is not authenticated or lacks permissions"
- **Session Not Open**: "Session must be open for business"
- **Invalid Direction**: "Either all inbound fields or all outbound fields must be present"
- **Zero Sums**: "Inbound sum and outbound sum both cannot be 0"
- **Both Directions**: "Inbound sum and outbound sum both cannot have values"
- **Invalid Repository**: "Repository not found"
- **Invalid Currency**: "Currency not found"

### System Errors
- **Database Error**: "An error occurred while creating the expense"
- **Float Update Error**: "Failed to update float stacks"
- **FX Rate Error**: "Failed to calculate foreign exchange rate"

## User Interface Requirements

### Creation Form
1. **Basic Info**: Name and type selection
2. **Direction Selection**: Money-In vs Money-Out
3. **Currency Selection**: Dropdown of available currencies
4. **Repository Selection**: Based on direction
5. **Amount Input**: Sum with currency formatting
6. **Breakdown Builder**: Optional breakdown specification
7. **Comment Field**: Optional comment with user attribution
8. **Validation Feedback**: Real-time validation with clear errors

### Success States
- Green notification: "Expense successfully created!"
- Automatic refresh of expense list
- Update of float counts if breakdowns used
- Sale ID generation for SALE type expenses

### Management Interface
- List of all expenses for current session
- Filter by type, direction, currency, or status
- Edit and cancel capabilities
- Detailed expense view with breakdowns and comments

## Integration Points

### Components Using Expenses
1. **Expense Page**: Main interface for creating and managing expenses
2. **Session Dashboard**: Display of session expenses
3. **Float Management**: Integration with float stack updates
4. **Reporting**: Financial and inventory reporting
5. **Audit Trail**: Activity logging for compliance

### Shared Functions
- `createExpense()` from expense creation hook
- `cancelExpense()` for expense cancellation
- `getSessionExpenses()` for session history
- `updateFloatStacksForExpense()` for float management

## Testing Requirements

### Unit Tests
- Test expense creation with all types
- Test direction validation logic
- Test FX rate calculations
- Test breakdown processing
- Test sale ID generation
- Test comment handling

### Integration Tests
- Test complete expense flow from UI
- Test float stack consistency
- Test session expense tracking
- Test error handling
- Test expense cancellation

### Edge Cases
- Invalid direction combinations
- Zero or negative amounts
- Invalid currency tickers
- Malformed breakdown data
- Concurrent expense creation
- Large expense amounts

## Security Considerations

### Authorization
- Verify user has expense creation permissions
- Validate user belongs to session organization
- Ensure repository access permissions
- Prevent unauthorized financial transactions

### Data Integrity
- Atomic expense creation with float updates
- Proper audit trail with activity logging
- Validation of all financial calculations
- FX rate accuracy and consistency

## Performance Considerations

### Database Queries
- Efficient indexing on session ID for expense queries
- Optimize float stack updates with batch operations
- Cache currency and repository data
- Pagination for large expense histories

### User Experience
- Fast validation feedback
- Real-time float count updates
- Progress indicators for complex operations
- Currency formatting and localization

## Migration Notes

### Legacy to MetaCX Differences
1. **Authentication**: Rails uses token auth vs MetaCX uses Clerk JWT
2. **Database**: Rails PostgreSQL vs MetaCX Convex
3. **Direction Handling**: Legacy uses separate fields vs MetaCX unified direction approach
4. **Activity Logging**: Legacy uses polymorphic associations vs MetaCX structured logs

### Preserved Legacy Logic
- Session state validation (FLOAT_OPEN_COMPLETE required)
- Direction validation (inbound OR outbound, not both)
- FX rate calculations for non-CAD currencies
- Sale ID auto-generation for SALE type
- Comment and info handling
- Breakdown processing for float updates

## Future Enhancements

### Potential Improvements
1. **Expense Templates**: Pre-configured common expense types
2. **Recurring Expenses**: Automated recurring expense creation
3. **Expense Categories**: Enhanced categorization system
4. **Approval Workflows**: Multi-level approval for large expenses
5. **Mobile Receipt Capture**: Photo receipt integration
6. **Expense Analytics**: Enhanced reporting and insights

### Analytics
- Track expense patterns by type and category
- Monitor float impact from expenses
- Report on expense approval rates
- User behavior analysis for expense optimization
- Financial forecasting based on expense trends
