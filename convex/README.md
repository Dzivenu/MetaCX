# Convex Directory Structure

This directory contains the reorganized Convex database and function structure for better maintainability and separation of concerns.

## Folder Structure

```
convex/
├── schema/           # Database schema definitions
│   ├── users.ts
│   ├── repositories.ts
│   ├── currencies.ts
│   ├── cxsessions.ts
│   ├── userPreferences.ts
│   └── appCurrencies.ts
├── functions/        # Queries and mutations
│   ├── users.ts
│   ├── repositories.ts
│   ├── currencies.ts
│   ├── cxsessions.ts
│   └── auth.ts
├── actions/          # Actions (external API calls, etc.)
│   └── currencies.ts
├── cron/            # Scheduled cron jobs
│   └── README.md
├── _generated/      # Auto-generated Convex files
├── schema.ts        # Main schema file (imports from schema/)
└── auth.config.js   # Authentication configuration
```

## Schema Organization

Each table schema is defined in its own file within the `schema/` folder:

- **users.ts** - User accounts synced from Clerk
- **repositories.ts** - Repository/location management
- **currencies.ts** - Organization-specific currencies
- **cxsessions.ts** - Currency exchange sessions
- **userPreferences.ts** - User-specific settings
- **appCurrencies.ts** - Global currency rates

## Functions Organization

Database functions (queries and mutations) are organized by domain:

- **users.ts** - User management functions
- **repositories.ts** - Repository CRUD operations
- **currencies.ts** - Currency management
- **cxsessions.ts** - Session management
- **auth.ts** - Authentication helpers

## Actions Organization

Actions that perform external operations are in the `actions/` folder:

- **currencies.ts** - External API calls for currency rates

## Usage

When importing from the new structure, use:

```typescript
import { api } from "../convex/_generated/api";

// For functions (queries/mutations)
const currencies = useQuery(api.functions.currencies.getCurrencies);
const createCurrency = useMutation(api.functions.currencies.createCurrency);

// For actions
const refreshRates = useAction(api.actions.currencies.refreshAppCurrencies);
```

## Benefits

1. **Better Organization** - Related functionality is grouped together
2. **Separation of Concerns** - Schema, functions, and actions are clearly separated
3. **Maintainability** - Easier to find and modify specific functionality
4. **Scalability** - Structure supports growth as the application expands
5. **Clear Dependencies** - Actions vs functions distinction is explicit

## Migration

All existing API calls have been updated to use the new structure. The old files have been removed from the convex root directory.
