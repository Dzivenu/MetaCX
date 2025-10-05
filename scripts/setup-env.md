# Environment Setup for Convex Database Scripts

## Quick Setup

To use the Convex database scripts (`yarn db:reset-convex`, `yarn db:stats-convex`), you need to configure your environment variables.

### Option 1: Create .env.local from existing templates

```bash
# From the app directory (apps/app/):
cp env.example .env.local
```

Then edit `.env.local` and update the `NEXT_PUBLIC_CONVEX_URL` variable:

```env
# For local development (if running convex dev):
NEXT_PUBLIC_CONVEX_URL=http://localhost:8187

# For production deployment:
# NEXT_PUBLIC_CONVEX_URL=https://your-deployment-name.convex.cloud
```

### Option 2: Create minimal .env.local

Create a new `.env.local` file with just the Convex URL:

```bash
# Create minimal .env.local file
echo 'NEXT_PUBLIC_CONVEX_URL=http://localhost:8187' > .env.local
```

### Option 3: Use environment variables directly

Set the environment variable in your terminal:

```bash
# For current session
export NEXT_PUBLIC_CONVEX_URL=http://localhost:8187

# Then run the scripts
yarn db:reset-convex
```

## Convex URL Examples

| Environment       | URL Format                          | Example                                 |
| ----------------- | ----------------------------------- | --------------------------------------- |
| Local Development | `http://localhost:8187`             | When running `npx convex dev`           |
| Convex Cloud      | `https://{deployment}.convex.cloud` | `https://happy-animal-123.convex.cloud` |

## Troubleshooting

### "CONVEX_URL not found" Error

This means no environment file was found or the Convex URL isn't set. The scripts now:

1. ✅ Automatically look for `.env.local`, `.env.development.local`, `.env.development`, `.env`
2. ✅ Show helpful error messages with setup instructions
3. ✅ Guide you through the setup process

### Finding Your Convex URL

- **Local Development**: Usually `http://localhost:8187` when running `npx convex dev`
- **Convex Cloud**: Check your Convex dashboard or the URL shown when you run `npx convex deploy`

## Example .env.local File

```env
# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=http://localhost:8187

# App Configuration (optional)
NEXT_PUBLIC_APP_URL=http://localhost:4000
NODE_ENV=development

# Other variables from your project...
```

Once configured, you can run:

```bash
yarn db:stats-convex      # View database statistics
yarn db:reset-convex      # Reset resetable tables (preserves users/orgs)
yarn db:reset-convex -- --force  # Skip confirmation prompt
```
