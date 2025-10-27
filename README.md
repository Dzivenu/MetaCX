# MetaCX

A modern web application for currency exchange management built with Next.js 16, TypeScript, and Convex.

## Tech Stack

### Core Framework
- **Next.js 16.0.0**: React framework with App Router, Server Components, and Turbopack
- **React 19.2.0**: Latest React with improved concurrent features
- **TypeScript 5**: Type-safe development

### Backend & Database
- **Convex 1.25.4**: Real-time backend platform with automatic reactivity, serverless functions, and built-in authentication integration

### Authentication
- **Clerk 6.31.3**: Modern authentication with email/password, social logins, organization management, and user profiles

### UI Components & Styling
- **Mantine 8.1.3**: Comprehensive React component library including forms, modals, notifications, data tables, charts, and rich text editor
- **Tabler Icons 3.34.0**: Beautiful icon library
- **Recharts 3.1.0**: Composable charting library

### State Management & Data
- **Redux Toolkit 2.6.1**: Predictable state management
- **React Query (TanStack) 5.76.1**: Server state management and caching
- **React Hook Form 7.56.4**: Performant form management
- **Zod 3.25.76**: TypeScript-first schema validation

### Development Tools
- **ESLint 9**: Code linting with flat config
- **T3 Env**: Type-safe environment variables
- **Hono 4.6.11**: Ultrafast web framework for API routes

## Features

- 🔐 **Multi-tenant Organization Management**: Create and manage multiple organizations with role-based access
- 💱 **Currency Exchange**: Real-time currency exchange rates and calculations
- 👥 **Customer Management**: Track customers, contacts, and addresses with ID scanning
- 📦 **Float Management**: Manage currency floats and transfers across repositories
- 🏦 **Repository Management**: Track physical currency repositories and access logs
- 📊 **CX Sessions**: Manage customer exchange sessions with activity tracking
- 📈 **Analytics & Reporting**: View organizational activities and statistics
- ⚡ **Real-time Updates**: Instant data synchronization with Convex
- 🎨 **Modern UI**: Beautiful, responsive interface with dark mode support

## Prerequisites

- **Node.js 20.9+** (required for Next.js 16)
- **Yarn 1.22.21+** - project package manager
- **Convex Account** - sign up at [convex.dev](https://convex.dev)
- **Clerk Account** - sign up at [clerk.com](https://clerk.com)
- **Open Exchange Rates API Key** - get free key at [openexchangerates.org](https://openexchangerates.org/signup/free)

## Setup Guide

### 1. Clone and Install Dependencies

```bash
# Navigate to the metacx directory
cd apps/metacx

# Install dependencies
yarn install
```

### 2. Environment Configuration

Copy the sample environment file and configure your variables:

```bash
# Copy the sample environment file
cp sample.env .env.local
```

Edit `.env.local` with your credentials:

#### Required Variables

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=MetaCX
NEXT_PUBLIC_APP_DESCRIPTION=A modern web application for currency exchange management

# Environment
NEXT_PUBLIC_NODE_ENV=development
NODE_ENV=development

# Convex (auto-generated when running npx convex dev)
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CONVEX_DEPLOYMENT=your_deployment_name

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_JWT_ISSUER_DOMAIN=your_clerk_jwt_domain

# Open Exchange Rates API
OPEN_EXCHANGE_RATE_APP_ID=your_api_key
NEXT_PUBLIC_OPEN_EXCHANGE_RATE_APP_ID=your_api_key
```

### 3. Initialize Convex Backend

```bash
# Login to Convex (if not already logged in)
npx convex login

# Initialize Convex development environment
npx convex dev
```

This creates a new Convex deployment, generates your Convex environment variables, and starts the development server.

### 4. Configure Clerk

1. Create a new application at [clerk.com](https://clerk.com)
2. Configure authentication methods (email, social, etc.)
3. Enable Organization management for multi-tenancy
4. Copy your API keys to `.env.local`
5. Configure webhook endpoints (see [docs/CLERK_SETUP.md](./docs/CLERK_SETUP.md))

### 5. Start Development Server

```bash
# Run both Next.js and Convex together
yarn dev

# Or run separately:
yarn dev:next    # Next.js only (port 4000)
yarn dev:convex  # Convex only
```

Open [http://localhost:4000](http://localhost:4000) in your browser.

## Available Scripts

```bash
yarn dev              # Run Next.js and Convex in development mode
yarn dev:next         # Run Next.js only
yarn dev:convex       # Run Convex only
yarn build            # Build for production
yarn start            # Start production server
yarn lint             # Run ESLint
yarn lint:fix         # Fix ESLint issues
yarn type:check       # Run TypeScript type checking
yarn tp               # Shortcut for type:check
yarn db:reset-convex  # Reset Convex database
yarn db:stats-convex  # View Convex database statistics
```

## Project Structure

```
metacx/
├── convex/              # Convex backend
│   ├── schema/          # Database schema definitions
│   ├── functions/       # Convex query/mutation functions
│   ├── actions/         # Convex actions (for external APIs)
│   └── auth.config.js   # Clerk authentication config
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── admin/       # Admin panel routes
│   │   ├── api/         # API routes
│   │   ├── auth/        # Authentication pages
│   │   ├── organizations/ # Organization management
│   │   └── portal/      # Customer portal
│   ├── client/          # Client-side code
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── providers/   # Context providers
│   │   └── services/    # Business logic
│   ├── server/          # Server-side code
│   └── shared/          # Shared utilities and types
├── docs/                # Documentation
├── eslint.config.mjs    # ESLint flat configuration
├── next.config.ts       # Next.js configuration
└── sample.env           # Sample environment variables
```

## Key Architecture

### Multi-tenant System
- Organizations operate independently with isolated data
- Role-based access control (Admin, Member, Owner)
- Per-organization currencies, customers, and repositories

### Real-time Backend
- Convex provides automatic data synchronization
- Serverless functions for business logic
- Built-in authentication integration

### Modern Frontend
- Next.js 16 with App Router and Server Components
- Turbopack for fast development builds
- Mantine components for consistent UI

## Documentation

- [Clerk Setup Guide](./docs/CLERK_SETUP.md) - Configure Clerk authentication
- [Float System Documentation](./docs/FLOAT_SYSTEM.md) - Understanding float management

## Deployment

### Production Build

```bash
# Build the application
yarn build

# Deploy Convex to production
npx convex deploy

# Start production server
yarn start
```

### Environment Variables for Production

Ensure all environment variables are configured in your hosting platform:
- Next.js: Vercel/Netlify environment variables
- Convex: Dashboard → Environment settings

## Troubleshooting

### Common Issues

**Port 4000 in use:**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

**Convex connection issues:**
```bash
npx convex login
npx convex dev
```

**TypeScript errors:**
```bash
yarn type:check
```

**ESLint issues:**
```bash
yarn lint:fix
```

## Contributing

1. Create a feature branch from main
2. Make changes following existing patterns
3. Run `yarn lint` and `yarn type:check`
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.
