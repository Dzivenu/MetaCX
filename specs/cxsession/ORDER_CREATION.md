# Order Creation Specification

## Overview
This document details the process and requirements for creating orders in the MetaCX application. Orders represent customer transactions involving currency exchanges with calculated rates, fees, and margin management.

## Business Rules

### Prerequisites for Order Creation
1. **Session Status**: Session must be in `FLOAT_OPEN_COMPLETE` state
2. **User Authorization**: User must be active and authorized on the session
3. **Currency Validation**: Both inbound and outbound currencies must be valid
4. **Repository Validation**: Both inbound and outbound repositories must exist and be accessible
5. **Rate Calculation**: FX rates, margins, and fees must be properly calculated
6. **Float Availability**: Sufficient float must be available in outbound repository

### Order Lifecycle
1. **QUOTE**: Initial order creation with calculated rates
2. **CONFIRMED**: Customer confirms the transaction
3. **COMPLETED**: Transaction processed and float updated
4. **CANCELLED**: Order cancelled (if possible)

### Rate Calculation Components
- **FX Rate**: Base foreign exchange rate
- **Margin**: Business margin added to rate
- **Fee**: Transaction fee charged to customer
- **Network Fee**: Blockchain/network processing fees
- **Final Rate**: Rate including all components
- **Rate Without Fees**: Base rate for customer comparison

## Legacy System Analysis (Rails Backend)

### Backend Order Creation Flow

#### 1. Orders Controller Create Method (`/app/controllers/api/v1/orders_controller.rb`)
```ruby
def create
  session_id = params[:order][:session_id]
  @session = Session.find_by(id: session_id)

  authorize @session

  order_params = params[:order]

  new_order_data = {
    inbound_ticker: order_params[:inbound_ticker],
    inbound_sum: order_params[:inbound_sum],
    outbound_ticker: order_params[:outbound_ticker],
    outbound_sum: order_params[:outbound_sum],
    fx_rate: order_params[:fx_rate],
    rate_wo_fees: order_params[:rate_wo_fees],
    final_rate: order_params[:final_rate],
    final_rate_without_fees: order_params[:final_rate_without_fees],
    margin: order_params[:margin],
    fee: order_params[:fee],
    network_fee: order_params[:network_fee],
    status: order_params[:status],
    btc_fee_rate: order_params[:btc_fee_rate],
    quote_source: order_params[:quote_source],
    inbound_repository_id: order_params[:inbound_repository_uid],
    outbound_repository_id: order_params[:outbound_repository_uid],
    batched_status: order_params[:batched_status] == 1 ? 'scheduled' : 'never_batched'
  }

  order_create_service = OrderEngine::CreateOrderService.call(
    @session,
    current_user,
    new_order_data
  )

  raise order_create_service.error if order_create_service.error

  @order = order_create_service.order

  OrderEngine::AutoSetReceivingAddressService.call(order: @order)

  render json: { order: @order }, status: :ok
rescue StandardError => e
  puts e.message
  puts e.backtrace
  render json: { error: e.message, backtrace: e.backtrace }, status: 500
end
```

#### 2. Create Order Service (`/app/services/order_engine/create_order_service.rb`)
```ruby
module OrderEngine
  class CreateOrderService
    attr_reader :order, :error, :success

    def self.call(session, user, new_order_data)
      new(session, user, new_order_data).call
    end

    def initialize(session, user, new_order_data)
      @session = session
      @user = user
      @new_order_data = new_order_data
      @order_quote_data = nil
      @activity = nil
      @order = nil
      @error = nil
      @success = true
    end

    def call
      raise 'Session not found with ID' if @session.nil?
      prepare_order_quote_data
      create_new_order
      self
    rescue StandardError => e
      @order.destroy if @order
      @activity.destroy if @activity

      puts e.message
      puts e.backtrace

      @error = e
      @success = false
      self
    end

    def prepare_order_quote_data
      @order_quote_data = {
        inbound_ticker: @new_order_data[:inbound_ticker],
        inbound_sum: @new_order_data[:inbound_sum],
        outbound_ticker: @new_order_data[:outbound_ticker],
        outbound_sum: @new_order_data[:outbound_sum],
        fx_rate: @new_order_data[:fx_rate],
        margin: @new_order_data[:margin],
        fee: @new_order_data[:fee],
        network_fee: @new_order_data[:network_fee],
        btc_fee_rate: @new_order_data[:btc_fee_rate],
        inbound_repository_id: @new_order_data[:inbound_repository_id],
        outbound_repository_id: @new_order_data[:outbound_repository_id],
        rate_wo_fees: @new_order_data[:rate_wo_fees],
        final_rate: @new_order_data[:final_rate],
        final_rate_without_fees: @new_order_data[:final_rate_without_fees],
        quote_source: @new_order_data[:quote_source],
        batched_status: @new_order_data[:batched_status]
      }
    end

    def create_new_order
      order_data = {
        session_id: @session.id,
        user_id: @user.id,
        open_dt: Time.now,
        status: 'QUOTE',
        final_rate: @new_order_data[:final_rate],
        final_rate_without_fees: @new_order_data[:final_rate_without_fees]
      }

      @order = Order.new(order_data)
      @order.save!

      order_quote_service = OrderEngine::OrderQuoteService.call(
        order: @order,
        quote_data: @order_quote_data
      )

      raise order_quote_service.error if order_quote_service.error
    end

    private

    def validate_new_order_values
      @session.ensure_operable

      # ensure user is authorized on session
      if !@session.session_access_log.authorized_users.include? @user.id
        raise "User is not authorized on session #{@session.id}"
      end

      # ensure order session is user's current session
      if @session.id != @user.active_session_id
        raise "Attempting to create an order in a session which is not the user's current session"
      end
    end
  end
end
```

#### 3. Order Quote Service
```ruby
module OrderEngine
  class OrderQuoteService
    attr_reader :order, :success, :error

    def self.call(order:, quote_data:)
      new(order: order, quote_data: quote_data).call
    end

    def initialize(order:, quote_data:)
      @order = order
      @quote_data = quote_data
      @success = true
      @error = nil
    end

    def call
      create_order_quote
      self
    rescue StandardError => e
      @order_quote.destroy if @order_quote
      @success = false
      @error = e
      self
    end

    private

    def create_order_quote
      @order_quote = OrderQuote.create!(
        order: @order,
        inbound_ticker: @quote_data[:inbound_ticker],
        inbound_sum: @quote_data[:inbound_sum],
        outbound_ticker: @quote_data[:outbound_ticker],
        outbound_sum: @quote_data[:outbound_sum],
        fx_rate: @quote_data[:fx_rate],
        margin: @quote_data[:margin],
        fee: @quote_data[:fee],
        network_fee: @quote_data[:network_fee],
        btc_fee_rate: @quote_data[:btc_fee_rate],
        inbound_repository_id: @quote_data[:inbound_repository_id],
        outbound_repository_id: @quote_data[:outbound_repository_id],
        rate_wo_fees: @quote_data[:rate_wo_fees],
        final_rate: @quote_data[:final_rate],
        final_rate_without_fees: @quote_data[:final_rate_without_fees],
        quote_source: @quote_data[:quote_source],
        batched_status: @quote_data[:batched_status]
      )
    end
  end
end
```

#### 4. Order Float Stacks Service
```ruby
module OrderEngine
  class OrderFloatStacksService
    attr_reader :order, :success, :error

    def self.call(order:, user:, breakdowns:, intention:)
      new(
        order: order,
        user: user,
        breakdowns: breakdowns,
        intention: intention
      ).call
    end

    def initialize(order:, user:, breakdowns:, intention:)
      @order = order
      @user = user
      @breakdowns = breakdowns
      @intention = intention
      @success = true
      @error = nil
    end

    def call
      validate_order
      handle_breakdowns
      self
    rescue StandardError => e
      @success = false
      @error = e
      self
    end

    private

    def validate_order
      raise "Order cannot be nil" if @order.nil?
      raise "User cannot be nil" if @user.nil?

      @order.ensure_can_be_updated
    end

    def handle_breakdowns
      case @intention
      when 'CREATE'
        create_order_breakdowns
      when 'UPDATE'
        update_order_breakdowns
      when 'DELETE'
        delete_order_breakdowns
      end
    end

    def create_order_breakdowns
      if @breakdowns.nil? || @breakdowns.count == 0
        raise "order.status == 'CONFIRMED', is not possible without order.breakdowns"
      end

      float_stacks_change_service = FloatEngine::FloatStacksChangeService.call(
        breakable: @order,
        intention: 'CREATE_AND_COMMIT',
        breakdowns: @breakdowns
      )

      raise float_stacks_change_service.error if float_stacks_change_service.error
    end
  end
end
```

### Frontend Order Creation Flow

#### 1. Order Data Helper (`/src/containers/Order/OrderData.js`)
```javascript
export const validateOrder = async (sessionData, orderId, payload) => {
  const response = await fetch(`${sessionData.baseUrl}/api/v1/orders/${orderId}/validate`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Email': `${sessionData.userEmail}`,
      'X-User-Token': `${sessionData.userToken}`
    }
  })
  if (response.ok) {
    return response.json()
  } else {
    console.log(response)
    AppToast(`Unable to validate order #${orderId}.`, 'error')
    return false
  }
}

export const updateOrder = async (sessionData, orderId, payload) => {
  const order = formatOrderDataForUpdate(payload)

  const response = await fetch(`${sessionData.baseUrl}/api/v1/orders/${orderId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Email': `${sessionData.userEmail}`,
      'X-User-Token': `${sessionData.userToken}`
    },
    body: JSON.stringify({ order })
  })
  if (response.ok) {
    return response.json()
  } else {
    console.log(response)
    return false
  }
}

export const executeCompleteOrder = async ({ sessionData, currentOrder }) => {
  const orderId = currentOrder.id

  const response = await fetch(`${sessionData.baseUrl}/api/v1/orders/${orderId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Email': `${sessionData.userEmail}`,
      'X-User-Token': `${sessionData.userToken}`
    }
  })

  if (response.ok) {
    return await response.json()
  } else {
    console.log(response)
    AppToast(`Unable to complete order #${orderId}.`, 'error')
    return false
  }
}
```

## Technical Implementation (MetaCX/Convex)

### Backend Order Creation
```typescript
export const createOrder = mutation({
  args: {
    clerkOrganizationId: v.string(),
    sessionId: v.id("org_cx_sessions"),
    inboundTicker: v.string(),
    inboundSum: v.number(),
    outboundTicker: v.string(),
    outboundSum: v.number(),
    fxRate: v.number(),
    rateWithoutFees: v.number(),
    finalRate: v.number(),
    finalRateWithoutFees: v.number(),
    margin: v.number(),
    fee: v.number(),
    networkFee: v.optional(v.number()),
    btcFeeRate: v.optional(v.number()),
    quoteSource: v.string(),
    inboundRepositoryId: v.id("org_repositories"),
    outboundRepositoryId: v.id("org_repositories"),
    batchedStatus: v.optional(v.string()), // "scheduled" or "never_batched"
    customerId: v.optional(v.id("org_customers")),
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
    
    // 5. Validate user authorization on session
    const sessionAccess = await ctx.db
      .query("org_session_access_logs")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();
    
    if (!sessionAccess || !sessionAccess.authorizedUsers.includes(identity.subject)) {
      throw new Error("User is not authorized on this session");
    }
    
    // 6. Create order record
    const orderId = await ctx.db.insert("org_orders", {
      clerkOrganizationId: args.clerkOrganizationId,
      sessionId: args.sessionId,
      userId: identity.subject,
      customerId: args.customerId || null,
      status: "QUOTE",
      openDt: Date.now(),
      finalRate: args.finalRate,
      finalRateWithoutFees: args.finalRateWithoutFees,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // 7. Create order quote record
    await ctx.db.insert("org_order_quotes", {
      clerkOrganizationId: args.clerkOrganizationId,
      orderId: orderId,
      inboundTicker: args.inboundTicker,
      inboundSum: args.inboundSum,
      outboundTicker: args.outboundTicker,
      outboundSum: args.outboundSum,
      fxRate: args.fxRate,
      rateWithoutFees: args.rateWithoutFees,
      finalRate: args.finalRate,
      finalRateWithoutFees: args.finalRateWithoutFees,
      margin: args.margin,
      fee: args.fee,
      networkFee: args.networkFee || 0,
      btcFeeRate: args.btcFeeRate || 0,
      inboundRepositoryId: args.inboundRepositoryId,
      outboundRepositoryId: args.outboundRepositoryId,
      quoteSource: args.quoteSource,
      batchedStatus: args.batchedStatus || "never_batched",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // 8. Auto-set receiving address for crypto orders
    if (inboundCurrency.typeof === "CRYPTO") {
      await setReceivingAddress(ctx, orderId, args.inboundTicker);
    }
    
    // 9. Log activity
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: args.clerkOrganizationId,
      userId: identity.subject,
      sessionId: args.sessionId,
      event: "ORDER_STARTED",
      referenceId: orderId,
      comment: "",
      meta: {
        inboundTicker: args.inboundTicker,
        outboundTicker: args.outboundTicker,
        inboundSum: args.inboundSum,
        outboundSum: args.outboundSum,
        quoteSource: args.quoteSource
      },
      createdAt: Date.now(),
    });
    
    return { success: true, orderId };
  },
});

// Helper function to set receiving address for crypto orders
async function setReceivingAddress(ctx: any, orderId: string, ticker: string) {
  // Generate or retrieve receiving address for the cryptocurrency
  const receivingAddress = generateCryptoAddress(ticker);
  
  await ctx.db.patch(orderId, {
    inboundCryptoAddress: receivingAddress,
    updatedAt: Date.now(),
  });
}

function generateCryptoAddress(ticker: string): string {
  // This would integrate with wallet services for actual address generation
  // For now, return a mock address
  return `${ticker.toLowerCase()}_address_${Date.now()}`;
}
```

### Order Breakdown Creation
```typescript
export const createOrderBreakdowns = mutation({
  args: {
    orderId: v.id("org_orders"),
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // 1. Get order
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    
    // 2. Validate order status
    if (order.status !== "QUOTE") {
      throw new Error("Order must be in QUOTE status to add breakdowns");
    }
    
    // 3. Create breakdown records
    for (const breakdown of args.breakdowns) {
      await ctx.db.insert("org_breakdowns", {
        clerkOrganizationId: order.clerkOrganizationId,
        breakableType: "order",
        breakableId: args.orderId,
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
    
    // 4. Update float stacks
    await updateFloatStacksForOrder(ctx, args.breakdowns);
    
    // 5. Update order status to CONFIRMED
    await ctx.db.patch(args.orderId, {
      status: "CONFIRMED",
      confirmedDt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // 6. Log activity
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: order.clerkOrganizationId,
      userId: identity.subject,
      sessionId: order.sessionId,
      event: "ORDER_CONFIRMED",
      referenceId: args.orderId,
      comment: "",
      meta: {
        breakdownCount: args.breakdowns.length
      },
      createdAt: Date.now(),
    });
    
    return { success: true, message: "Order breakdowns created successfully" };
  },
});

// Helper function to update float stacks for orders
async function updateFloatStacksForOrder(ctx: any, breakdowns: any[]) {
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

### Order Completion
```typescript
export const completeOrder = mutation({
  args: {
    orderId: v.id("org_orders"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // 1. Get order
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    
    // 2. Validate order status
    if (order.status !== "CONFIRMED") {
      throw new Error("Order must be confirmed before completion");
    }
    
    // 3. Update order status
    await ctx.db.patch(args.orderId, {
      status: "COMPLETED",
      completedDt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // 4. Log activity
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: order.clerkOrganizationId,
      userId: identity.subject,
      sessionId: order.sessionId,
      event: "ORDER_COMPLETED",
      referenceId: args.orderId,
      comment: "",
      meta: {},
      createdAt: Date.now(),
    });
    
    return { success: true, message: "Order completed successfully" };
  },
});
```

### Session Orders Query
```typescript
export const getSessionOrders = query({
  args: {
    sessionId: v.id("org_cx_sessions"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("org_orders")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId));
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    const orders = await query.order("desc").collect();
    
    // Enrich with related data
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const user = await ctx.db.get(order.userId);
        const customer = order.customerId ? await ctx.db.get(order.customerId) : null;
        const orderQuote = await ctx.db
          .query("org_order_quotes")
          .withIndex("by_order_id", (q) => q.eq("orderId", order._id))
          .first();
        const breakdowns = await ctx.db
          .query("org_breakdowns")
          .withIndex("by_breakable", (q) => 
            q.eq("breakableType", "order").eq("breakableId", order._id)
          )
          .collect();
        
        return {
          ...order,
          user: user ? {
            id: user._id,
            first_name: user.firstName,
            last_name: user.lastName
          } : null,
          customer: customer ? {
            id: customer._id,
            first_name: customer.firstName,
            last_name: customer.lastName
          } : null,
          quote: orderQuote,
          breakdowns: breakdowns.map(breakdown => ({
            id: breakdown._id,
            count: breakdown.count,
            direction: breakdown.direction,
            denomination: breakdown.denominationValue
          }))
        };
      })
    );
    
    return enrichedOrders;
  },
});
```

## Error Handling

### Validation Errors
- **Unauthorized**: "User is not authenticated or lacks permissions"
- **Session Not Open**: "Session must be open for business"
- **Invalid Repository**: "Invalid repositories specified"
- **Invalid Currency**: "Invalid currency tickers specified"
- **User Not Authorized**: "User is not authorized on this session"
- **Invalid Order Status**: "Order must be in QUOTE status to add breakdowns"

### System Errors
- **Database Error**: "An error occurred while creating the order"
- **Float Update Error**: "Failed to update float stacks"
- **Address Generation Error**: "Failed to generate receiving address"

## User Interface Requirements

### Creation Form
1. **Customer Selection**: Optional customer attachment
2. **Currency Pair**: Inbound and outbound currency selection
3. **Amount Input**: Inbound and outbound sum fields
4. **Repository Selection**: Separate selectors for inbound/outbound
5. **Rate Display**: Show calculated rates, fees, and margins
6. **Quote Summary**: Clear breakdown of all costs
7. **Breakdown Builder**: Specify denominations for physical exchange
8. **Confirmation Dialog**: Final review before order creation

### Order Management
- List of all orders for current session
- Filter by status, customer, or currency pair
- Detailed order view with quotes and breakdowns
- Order completion and cancellation capabilities
- Receipt generation options

### Success States
- Order created with quote details
- Automatic receiving address for crypto orders
- Real-time rate calculations
- Activity logging for audit trail

## Integration Points

### Components Using Orders
1. **Order Page**: Main interface for creating and managing orders
2. **Customer Management**: Customer attachment and history
3. **Float Management**: Integration with float stack updates
4. **Rate Engine**: FX rate calculations and margins
5. **Receipt System**: Transaction documentation
6. **Compliance**: Order monitoring and reporting

### Shared Functions
- `createOrder()` from order creation hook
- `createOrderBreakdowns()` for order confirmation
- `completeOrder()` for transaction completion
- `getSessionOrders()` for order history
- `updateFloatStacksForOrder()` for float management

## Testing Requirements

### Unit Tests
- Test order creation with all currency pairs
- Test rate calculation accuracy
- Test breakdown processing
- Test receiving address generation
- Test order status transitions
- Test customer attachment

### Integration Tests
- Test complete order flow from quote to completion
- Test float stack consistency
- Test session order tracking
- Test error handling and rollback
- Test concurrent order creation

### Edge Cases
- Invalid currency combinations
- Insufficient float in repositories
- Malformed rate calculations
- Customer attachment errors
- Network fee calculation issues
- Large order amounts

## Security Considerations

### Authorization
- Verify user has order creation permissions
- Validate user belongs to session organization
- Ensure repository access permissions
- Prevent unauthorized rate manipulation

### Data Integrity
- Atomic order creation with quote generation
- Proper audit trail with activity logging
- Validation of all financial calculations
- Float consistency checks

## Performance Considerations

### Database Queries
- Efficient indexing on session ID for order queries
- Optimize float stack updates with batch operations
- Cache currency rates and repository data
- Pagination for large order histories

### User Experience
- Fast rate calculations
- Real-time quote updates
- Progress indicators for complex operations
- Currency formatting and localization

## Migration Notes

### Legacy to MetaCX Differences
1. **Authentication**: Rails uses token auth vs MetaCX uses Clerk JWT
2. **Database**: Rails PostgreSQL vs MetaCX Convex
3. **Quote Management**: Legacy uses separate quote model vs MetaCX integrated approach
4. **Activity Logging**: Legacy uses polymorphic associations vs MetaCX structured logs

### Preserved Legacy Logic
- Session state validation (FLOAT_OPEN_COMPLETE required)
- Order lifecycle management (QUOTE → CONFIRMED → COMPLETED)
- Rate calculation components (FX, margin, fees)
- Float stack management through breakdowns
- Customer attachment and tracking
- Receiving address generation for crypto

## Future Enhancements

### Potential Improvements
1. **Order Templates**: Pre-configured common order types
2. **Bulk Orders**: Process multiple orders simultaneously
3. **Order Scheduling**: Schedule orders for future execution
4. **Advanced Rate Engine**: More sophisticated rate calculations
5. **Mobile Order Entry**: Optimized mobile interface
6. **Order Analytics**: Enhanced reporting and insights

### Analytics
- Track order patterns by currency pair and customer
- Monitor float utilization rates
- Report on order completion rates
- User behavior analysis for order optimization
- Revenue and margin analysis
