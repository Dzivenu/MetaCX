# Currency Calculator Services

This directory contains the TypeScript services that reproduce the complex currency calculation logic from the `/front` implementation.

## Files Overview

### QuoteCalculator.ts

Core calculation engine that handles:

- **Real-time FX calculations** between currencies
- **Base currency logic** (CAD as default base for all conversions)
- **Margin and fee applications** based on buy/sell scenarios
- **Final rate calculations** with and without fees
- **Currency swapping** with proper rate recalculations
- **Decimal precision** handling (8 decimals for crypto, 2 for fiat)

### CurrencyService.ts

API service layer that provides:

- **Currency fetching** from backend APIs
- **Float balance lookups** for available currency amounts
- **Rate refresh functionality**
- **Mock service** for development and testing
- **Session management** with proper authentication headers

### useCurrencyCalculator.ts

React hook that integrates:

- **QuoteCalculator** with React state management
- **Real-time updates** when amounts or currencies change
- **Loading states** and error handling
- **Float balance management** with automatic loading
- **Formatted value utilities** for display

## Key Features Reproduced from /front

### 1. Real-time Calculations

When a user enters a value in the inbound field, the outbound value is calculated instantly using:

- Current spot rates
- Applied margins (buy/sell)
- Service and network fees
- Proper decimal precision

### 2. Base Currency Logic

All conversions use the base currency (CAD) as the reference:

- **CAD → Crypto**: Uses sell rates and margins
- **Crypto → CAD**: Uses buy rates and margins
- **Cross-currency**: Converts through CAD as intermediary

### 3. Margin Application

Margins are applied differently based on transaction direction:

- **Buying crypto** (CAD → BTC): Uses buy_margin_max
- **Selling crypto** (BTC → CAD): Uses sell_margin_max
- **Rate calculation**: Includes margin in final rate

### 4. Fee Handling

Multiple fee types are supported:

- **Service fees**: Fixed CAD amount
- **Network fees**: Variable based on blockchain
- **Fee application**: Deducted from appropriate side of transaction

### 5. Currency Swapping

Smart currency swapping that:

- Preserves entered amounts where possible
- Recalculates rates for new currency pair
- Updates margins based on new direction
- Maintains calculation accuracy

## Usage Example

```typescript
// Initialize the calculator
const calculator = useCurrencyCalculator({
  serviceFee: 2,
  networkFee: 0,
  useMockData: true, // Use false for production
  autoLoadFloatBalance: true,
});

// Use in component
const {
  inboundTicker,
  outboundTicker,
  inboundAmount,
  outboundAmount,
  updateInboundAmount,
  swapCurrencies,
  // ... other methods
} = calculator;

// Update amount - triggers real-time calculation
updateInboundAmount(1000); // Enter 1000 CAD
// outboundAmount automatically updates to equivalent BTC
```

## Integration with QuoteStep

The enhanced QuoteStep component now:

1. **Initializes** the currency calculator
2. **Passes calculator instance** to CurrencySection components
3. **Syncs state** between calculator and form context
4. **Provides real-time feedback** as users type

## Mock Data

For development, the MockCurrencyService provides realistic test data:

- **CAD**: Base currency (rate: 1.0)
- **BTC**: High-value crypto (rate: 65,000 CAD)
- **ETH**: Mid-value crypto (rate: 3,200 CAD)
- **USD**: Foreign fiat (rate: 1.35 CAD)

Each currency includes proper margins, we_buy/we_sell rates, and type classifications.

## Production Setup

To use with real APIs:

1. Set `useMockData: false` in calculator options
2. Configure proper `baseUrl`, `userEmail`, `userToken` in CurrencyService
3. Ensure backend APIs match expected endpoints:
   - `GET /api/v1/currencies?minified=TRUE`
   - `GET /api/v1/sessions/float_for/{sessionId}?ticker={ticker}`
   - `POST /api/v1/currencies/enqueue_currencies_rates_refresh`

## Benefits

This implementation provides:

- ✅ **Type Safety**: Full TypeScript with proper interfaces
- ✅ **Real-time UX**: Instant feedback as users type
- ✅ **Accurate Calculations**: Reproduced complex logic from working system
- ✅ **Modern Architecture**: React hooks, clean separation of concerns
- ✅ **Theme Integration**: Uses CSS custom properties from theme system
- ✅ **Error Handling**: Comprehensive error states and loading indicators
- ✅ **Testing Ready**: Mock services for development and testing
