import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  username,
  admin,
  organization,
  apiKey,
  twoFactor,
  openAPI,
} from "better-auth/plugins";
import { db } from "@/server/db";
import { env } from "@/shared/config/env";

export const auth = betterAuth({
  appName: env.NEXT_PUBLIC_APP_NAME,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  secret: env.BETTER_AUTH_SECRET,

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Cookie configuration for development
  cookies: {
    sessionToken: {
      name: "better-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: false, // Set to false for localhost development
        path: "/",
      },
    },
  },

  // Advanced security
  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubDomainCookies: {
      enabled: false, // Disable for localhost development
    },
  },

  // Rate limiting
  rateLimit: {
    window: 10,
    max: 100,
  },

  plugins: [
    // Username authentication plugin
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
      usernameValidator: (username) => {
        // Disallow reserved usernames
        const reserved = ["admin", "api", "www", "app", "support", "help"];
        if (reserved.includes(username.toLowerCase())) {
          return false;
        }
        // Allow alphanumeric, underscore, and dot
        return /^[a-zA-Z0-9_.]+$/.test(username);
      },
    }),

    // Admin plugin with role-based access control
    admin({
      adminUserIds: [], // Add specific admin user IDs here if needed
    }),

    // Organization plugin with members only (no teams)
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      membershipLimit: 100,
      creatorRole: "owner",
      invitationExpiresIn: 60 * 60 * 24 * 2, // 2 days
      cancelPendingInvitationsOnReInvite: true,
      invitationLimit: 50,

      // Disable teams/sub-organizations
      teams: {
        enabled: false,
      },

      // Organization creation hooks
      organizationCreation: {
        disabled: false,
        beforeCreate: async ({ organization, user }) => {
          // Add custom metadata or validation
          return {
            data: {
              ...organization,
              metadata: {
                createdBy: user.id,
                createdAt: new Date().toISOString(),
              },
            },
          };
        },
        afterCreate: async ({ organization, user }) => {
          // Set up default resources, send notifications, etc.
          console.log(
            `Organization ${organization.name} created by ${user.email}`
          );
        },
      },

      // Organization deletion hooks
      organizationDeletion: {
        disabled: false,
        beforeDelete: async (data) => {
          // Cleanup resources, send notifications, etc.
          console.log(
            `Organization ${data.organization.name} is being deleted`
          );
        },
        afterDelete: async () => {
          // Final cleanup
          console.log(`Organization deleted successfully`);
        },
      },
    }),

    // API Key plugin with comprehensive configuration
    apiKey({
      // Key generation settings
      defaultKeyLength: 64,
      defaultPrefix: "metacx_",
      maximumPrefixLength: 10,
      minimumPrefixLength: 3,
      maximumNameLength: 100,
      minimumNameLength: 3,

      // API key headers to check
      apiKeyHeaders: ["x-api-key", "authorization"],

      // Key expiration settings
      keyExpiration: {
        defaultExpiresIn: null, // No expiration by default
        disableCustomExpiresTime: false,
        minExpiresIn: 1, // 1 day minimum
        maxExpiresIn: 365, // 1 year maximum
      },

      // Rate limiting for API keys
      rateLimit: {
        enabled: true,
        timeWindow: 1000 * 60 * 60, // 1 hour
        maxRequests: 1000, // 1000 requests per hour
      },

      // Enable metadata storage
      enableMetadata: true,

      // Starting characters configuration
      startingCharactersConfig: {
        shouldStore: true,
        charactersLength: 8,
      },

      // Default permissions for new API keys
      permissions: {
        defaultPermissions: {
          // Default read permissions
          users: ["read"],
          organizations: ["read"],
        },
      },

      // Don't disable session creation for API keys
      disableSessionForAPIKeys: false,
    }),

    // Two-Factor Authentication plugin
    twoFactor({
      // Issuer name for authenticator apps
      issuer: env.NEXT_PUBLIC_APP_NAME,

      // Skip verification when enabling 2FA (for easier setup)
      skipVerificationOnEnable: false,

      // TOTP settings
      totpOptions: {
        digits: 6,
        period: 30,
      },

      // OTP settings (for email/SMS)
      otpOptions: {
        sendOTP: async ({ user, otp }) => {
          // Implement your OTP sending logic here
          console.log(`Sending OTP ${otp} to ${user.email}`);
          // You can integrate with email service like Resend, SendGrid, etc.
        },
        period: 5, // 5 minutes
      },

      // Backup codes settings
      backupCodeOptions: {
        amount: 10,
        length: 8,
      },
    }),

    // OpenAPI plugin for API documentation
    openAPI({
      path: "/api/auth/reference",
      disableDefaultReference: false,
    }),
  ],

  // Email verification (if you want to enable it later)
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
  },

  // Trusted origins for CORS
  trustedOrigins: [env.BETTER_AUTH_URL, env.NEXT_PUBLIC_APP_URL],
  
  // CORS configuration
  cors: {
    origin: [env.BETTER_AUTH_URL, env.NEXT_PUBLIC_APP_URL],
    credentials: true,
  },
});
