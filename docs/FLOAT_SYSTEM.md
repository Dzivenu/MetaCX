# Float System Implementation

This document describes the comprehensive Float system implemented in the application, based on the original system from the `front/` and `back/` codebases.

## Overview

The Float system manages currency denominations across repositories during trading sessions. It tracks opening counts, closing counts, and transactions to ensure accurate currency management and balance validation.

## Architecture

### Database Schema

#### Float Stacks (`float_stacks`)

- **Primary entity** for tracking currency denominations
- Links to sessions, repositories, and denominations
- Tracks counts: `open_count`, `close_count`, `midday_count`, `last_session_count`
- Manages confirmations: `open_confirmed_dt`, `close_confirmed_dt`
- Handles session transactions: `spent_during_session`, `transferred_during_session`

#### Repository Access Logs (`repository_access_logs`)

- Tracks repository access during sessions
- Manages session lifecycle: `open_start_dt`, `open_confirm_dt`, `close_start_dt`, `close_confirm_dt`
- Controls user authorization for repositories

#### Float Snapshots (`float_snapshots`)

- Historical records of float changes
- Audit trail for float operations
- Links to source transactions/operations

#### Float Transfers (`float_transfers`)

- Inter-repository currency transfers
- Tracks inbound/outbound amounts and repositories
- Maintains transfer status and audit information

### API Endpoints

#### Session Float Management

- `GET /api/cx-sessions/[id]/float` - Get session float data
- `POST /api/cx-sessions/[id]/float` - Manage float operations
  - Actions: `START_OPEN`, `CONFIRM_OPEN`, `START_CLOSE`, `CONFIRM_CLOSE`, `CANCEL_CLOSE`

#### Repository Float Management

- `GET /api/repositories/[id]/float` - Get repository float data
- `PUT /api/repositories/[id]/float` - Update float stacks
- `POST /api/repositories/[id]/float` - Validate repository float

#### Float Stack Management

- `GET /api/float-stacks` - Get float stacks for repository
- `POST /api/float-stacks` - Create new float stack

### Services

#### Core Float Services

- `GetSessionFloatService` - Retrieves complete session float data
- `StartFloatService` - Initiates float operations (open/close)
- `ConfirmFloatService` - Confirms float operations
- `CloseFloatService` - Closes float and completes session
- `UpdateRepositoryFloatService` - Updates float stack counts
- `ValidateRepositoryFloatService` - Validates float completion

#### Float Stack Services

- `CreateFloatStackService` - Creates new float stacks
- `GetAllFloatStacksService` - Retrieves float stacks

### React Hooks

#### `useFloat(sessionId)`

Primary hook for float data management:

- Fetches session float data
- Provides actions: `startFloat`, `confirmFloat`, `updateRepositoryFloat`
- Manages loading states and error handling
- Auto-refreshes data on mutations

#### `useFloatCalculations()`

Utility hook for float calculations:

- `countFloatSum` - Calculates float sums by type
- `buildCurrencyPanelState` - Builds currency panel state
- `areFloatStacksConfirmed` - Checks confirmation status
- `floatAmountIsWithinValidRange` - Validates balance ranges
- `formatMoney` - Formats currency amounts

### UI Components

#### `CurrencyPanel`

- Expandable panel for each currency
- Shows float stacks with denomination breakdown
- Handles float count input and validation
- Displays off-balance warnings
- Manages confirmation states

#### `FloatStackRow`

- Individual denomination row within currency panel
- Input fields for open/close counts
- Roll calculator for coin denominations
- Previous count shortcuts (press 'p')
- Real-time balance calculations

#### `RepositoryCard`

- Container for repository float management
- Shows repository status and access logs
- Contains multiple currency panels
- Handles repository-level actions

#### `FloatPage`

- Main float management interface
- Session-level float controls
- Repository listing and management
- Debug tools and session statistics

## Float Workflow

### 1. Session Start

1. User initiates "Start Open"
2. System creates repository access logs
3. Float stacks are generated for all denominations
4. Session status: `FLOAT_OPEN_START`

### 2. Opening Float Count

1. Tellers input opening counts for each denomination
2. System validates against previous session counts
3. Off-balance warnings for significant discrepancies
4. Individual currency confirmation

### 3. Confirm Opening

1. All repositories must have confirmed float stacks
2. System validates completeness
3. Session status: `FLOAT_OPEN_COMPLETE`
4. Float is now active for transactions

### 4. Trading Session

- Float stacks track spent amounts during session
- Transfers between repositories are recorded
- Current balances calculated dynamically

### 5. Closing Float Count

1. User initiates "Start Close"
2. Expected close counts calculated automatically
3. Tellers input actual close counts
4. System validates against expected amounts

### 6. Session Close

1. All close counts confirmed
2. Final validation and balance checks
3. Session status: `FLOAT_CLOSE_COMPLETE`
4. Repository access logs finalized

## Key Features

### Balance Validation

- **Off-balance threshold**: 0.01 (configurable)
- Real-time balance calculations
- Visual warnings for discrepancies
- Automatic expected balance calculations

### Roll Calculator

- Special calculator for coin denominations ($1, $2 CAD)
- Converts rolls to individual coins (25 coins per roll)
- Integrated into float stack input

### Previous Count Shortcuts

- Press 'p' in input fields to use previous session count
- Automatic expected balance calculation
- Quick data entry for unchanged denominations

### Debug Features

- Skip float counts (development mode)
- Bypass entire float process
- Manual float stack manipulation

### Responsive Design

- Container queries for component responsiveness
- Mantine UI components with consistent theming
- Mobile-friendly interface

## Configuration

### Environment Variables

```env
SESSION_FLOAT_OFF_BALANCE_THRESHOLD=0.01
```

### Theme Integration

Uses the modern CSS custom properties theme system:

- `--color-primary` for branding
- `--color-success/warning/error` for status indicators
- Responsive breakpoints with container queries

## Security

### Authorization

- Session-based access control
- Repository-specific permissions
- User type validation (TELLER, MANAGER, ADMIN)

### Data Validation

- Input sanitization and validation
- Float stack integrity checks
- Balance range validation
- Audit trail maintenance

## Testing

Run the float system tests:

```bash
npm run test:float
```

Test script location: `src/scripts/test-float-system.ts`

## Migration Notes

### From Original System

- SCSS styling replaced with CSS custom properties
- Redux replaced with React Query + Zustand
- Class components converted to functional components
- jQuery dependencies removed
- Modern TypeScript implementation

### Database Changes

- Simplified schema with better relationships
- Improved indexing for performance
- Consistent naming conventions
- Foreign key constraints for data integrity

## Performance Considerations

- Optimistic updates for better UX
- Efficient queries with proper indexing
- Component-level caching with React Query
- Lazy loading for large float datasets

## Future Enhancements

- Real-time float updates with WebSocket
- Advanced reporting and analytics
- Mobile app integration
- Multi-currency support improvements
- Automated balance reconciliation
