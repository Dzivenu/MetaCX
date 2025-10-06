# metacx

This is the metacx web application built with Next.js, TypeScript, and Tailwind CSS. It comes pre-configured with a basic project structure, essential libraries, and a set of development guidelines.

## Features

- **Next.js 15**: The latest version of the React framework.
- **TypeScript**: For type-safe code.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
- **Convex**: Real-time backend platform with database, authentication, and serverless functions.
- **Clerk**: Modern authentication and user management.
- **Hono**: A small, simple, and ultrafast web framework for the Edge.
- **React Hook Form**: For flexible and extensible forms.
- **React Query**: For data fetching and state management.
- **Redux Toolkit**: For predictable state management.
- **Zod**: For data validation.
- **Playwright**: For end-to-end testing.

## Environment Variables

This project uses [T3 Env](https://env.t3.gg/) for type-safe environment variables.

### Setup

1. Copy either the `env.example` or `sample.env` file to `.env.local`:

   ```bash
   # Option 1: Use env.example (template with placeholders)
   cp env.example .env.local

   # Option 2: Use sample.env (working example values)
   cp sample.env .env.local
   ```

2. Fill in the required environment variables in `.env.local`:
   - `NEXT_PUBLIC_APP_URL`: Your app's URL (http://localhost:3000 for development)
   - `NEXT_PUBLIC_CONVEX_URL`: Your Convex deployment URL
   - `CONVEX_DEPLOYMENT`: Your Convex deployment name
   - `CLERK_SECRET_KEY`: Your Clerk secret key
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
   - `CLERK_JWT_ISSUER_DOMAIN`: Your Clerk JWT issuer domain
   - `S3_ENDPOINT`: Your S3-compatible storage endpoint (e.g., Supabase Storage) (optional)
   - `S3_REGION`: Your S3 region (optional)
   - `S3_ACCESS_KEY_ID`: Your S3 access key ID (optional)
   - `S3_ACCESS_KEY_SECRET`: Your S3 access key secret (optional)

### Adding New Environment Variables

1. Add the variable to the appropriate section in `src/env.ts`:

   - `server`: For server-side only variables
   - `client`: For client-side variables (must be prefixed with `NEXT_PUBLIC_`)

2. Add the variable to the `runtimeEnv` object in `src/env.ts`

3. Add the variable to `env.example` with an example value

4. Import and use the variable from `src/env.ts`:

   ```typescript
   import { env } from "@/env";

   // Use env.VARIABLE_NAME instead of process.env.VARIABLE_NAME
   ```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:4000](http://localhost:4000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Project Structure

The project structure is organized as follows:

```
src/
├── app/         # Next.js App Router pages
├── client/      # Client-side React code
├── server/      # Server-side logic
└── shared/      # Shared utilities and types
```

For more details on the project structure and development guidelines, please refer to the `.cursorrules` file.
