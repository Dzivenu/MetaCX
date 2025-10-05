# Quote Step - Professional Trading Interface

This directory contains the redesigned Quote Step component that provides a professional trading interface for order creation.

## Overview

The Quote Step has been completely redesigned to match modern cryptocurrency trading platforms, featuring:

- **Professional Dark Theme**: Sleek dark interface with orange accent colors
- **Side-by-Side Currency Selection**: INBOUND and OUTBOUND sections with clear visual separation
- **Swap Functionality**: Easy currency pair switching with visual swap button
- **Real-time Rate Display**: Spot FX rates with refresh functionality
- **Expandable Warnings**: Collapsible warnings section for rate alerts
- **Detailed Quote Information**: Professional layout for quote details
- **Network Fee Selection**: Customizable network fee options
- **Responsive Design**: Mobile-friendly layout

## Components

### QuoteStep.tsx

Main container component that orchestrates all sub-components and manages state.

### QuoteStepHeader.tsx

- "New Order" title with "Order History" button
- "Select a Quote" section with reminder text
- Professional header styling

### CurrencySection.tsx

- Reusable component for both INBOUND and OUTBOUND currencies
- Currency selection with flags/icons
- Amount input with appropriate precision
- Available float display for outbound currencies
- Lock icon for read-only fields

### SpotRatesSection.tsx

- Real-time spot FX rate display
- Last refresh timestamp with "time ago" formatting
- Refresh button with loading state
- Professional rate formatting

### WarningsSection.tsx

- Expandable/collapsible warnings section
- Currency-specific warning badges
- Professional alert styling
- Support for different warning types (warning, error, info)

### QuoteDetailsSection.tsx

- Grid layout for quote details
- Professional input styling
- Color-coded indicators
- Final selling rate, margin, service fee, and network fee display

### NetworkFeeSelector.tsx

- Multiple fee type options (Custom, Slow, Regular, Fast, Batched)
- Visual selection state with orange highlighting
- Professional button styling

## Styling

### CSS Classes

- Dark theme with professional gradients
- Orange accent color (#f97316) for interactive elements
- Consistent border radius and spacing
- Hover effects and transitions
- Mobile-responsive design

### Key Design Elements

- **Colors**: Dark grays (#1f2937, #374151) with orange accents
- **Typography**: Bold amounts, clear labels, appropriate font sizes
- **Spacing**: Consistent padding and margins
- **Borders**: Subtle borders with proper contrast
- **Shadows**: Subtle depth without being distracting

## Features

### Currency Management

- Support for multiple currencies (BTC, ETH, CAD, USD, etc.)
- Automatic precision handling (8 decimals for BTC, 2 for fiat)
- Flag/icon display for visual currency identification
- Available float display for better UX

### Rate Management

- Real-time spot rate display
- Refresh functionality with timestamp tracking
- Rate age warnings
- Professional rate formatting

### Quote Generation

- Enhanced validation and error handling
- Loading states for better UX
- Professional quote display
- Save quote functionality (replaces "Generate Quote")

### Responsive Design

- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interface elements
- Optimized for various screen sizes

## Usage

```tsx
import { QuoteStep } from "@/client/views/orders/steps/QuoteStep";

// Used within the order creation flow
<QuoteStep />;
```

## Configuration

The component integrates with the `OrderCreationContext` for:

- Form state management
- Currency and repository data
- Quote generation
- Error handling

## Customization

### Theme Colors

Update the orange accent color by modifying:

- `#f97316` - Primary orange
- `#ea580c` - Darker orange for hover states

### Currency Icons

Add new currency icons in `CurrencySection.tsx`:

```tsx
const getFlagEmoji = (ticker: string) => {
  const flags: Record<string, string> = {
    NEW_CURRENCY: "🏳️",
    // ... existing currencies
  };
  return flags[ticker] || "💰";
};
```

### Network Fee Options

Modify fee options in `NetworkFeeSelector.tsx`:

```tsx
const feeOptions = [
  { type: "Custom", label: "Custom", description: "Set your own fee" },
  // ... add new options
];
```

## Best Practices

1. **Consistency**: Maintain the established color scheme and spacing
2. **Accessibility**: Ensure proper contrast ratios and keyboard navigation
3. **Performance**: Use appropriate precision for calculations
4. **Validation**: Implement proper form validation
5. **Error Handling**: Provide clear error messages and fallback states

## Future Enhancements

- [ ] Real-time rate updates via WebSocket
- [ ] Advanced charting integration
- [ ] Order book display
- [ ] Price alerts and notifications
- [ ] Advanced order types
- [ ] Market depth visualization

