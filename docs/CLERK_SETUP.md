# Clerk Environment Variables Setup

Add these environment variables to your `.env.local` file:

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev
```

## Steps to get these values:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or select existing one
3. In the API Keys section, copy:
   - Publishable key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Secret key → `CLERK_SECRET_KEY`

## 🚨 REQUIRED: Create JWT Template for Convex

**You MUST create a JWT template named "convex" in your Clerk dashboard:**

1. **Go to Clerk Dashboard** → Your App → **Configure** → **JWT Templates**
2. **Click "New Template"**
3. **Set the following:**
   - **Name**: `convex` (exactly this name - case sensitive!)
   - **Audience**: Your Convex deployment URL (from `.env.local`)
   - **Token lifetime**: 3600 seconds (1 hour)
   - **Claims**: Add these custom claims:
     ```json
     {
       "sub": "{{user.id}}",
       "aud": "convex",
       "email": "{{user.primary_email_address.email_address}}",
       "given_name": "{{user.first_name}}",
       "family_name": "{{user.last_name}}",
       "name": "{{user.full_name}}",
       "picture": "{{user.image_url}}",
       "org_id": "{{org.id}}",
       "org_slug": "{{org.slug}}",
       "org_role": "{{membership.role}}"
     }
     ```
4. **Save the template**
5. **Copy the Issuer Domain** from the template details (format: `https://your-domain.clerk.accounts.dev`)

## Convex Auth Configuration

The Convex auth configuration has been set up in `convex/auth.config.js` to work with Clerk JWT tokens.

## Webhook to sync Organizations to Convex

Add this secret to your `.env.local` and configure a Clerk webhook:

```bash
# Clerk Webhook secret (from Clerk → Webhooks → Create endpoint)
CLERK_WEBHOOK_SECRET=whsec_xxx
```

Create a Clerk Webhook endpoint pointing to:

- Local: `http://localhost:4000/api/clerk/webhook`
- Production: `${NEXT_PUBLIC_APP_URL}/api/clerk/webhook`

Subscribe to events:

- `organization.created`
- `organization.updated`

This will mirror organizations into Convex `organizations` table using `organizations.upsertByClerkId`.