import { createAuthClient } from "better-auth/client";
import {
  usernameClient,
  adminClient,
  organizationClient,
  apiKeyClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { env } from "@/shared/config/env";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  
  // Ensure cookies are sent with requests
  fetchOptions: {
    credentials: 'include',
  },

  plugins: [
    // Username authentication client plugin
    usernameClient(),

    // Admin client plugin
    adminClient(),

    // Organization client plugin (no teams)
    organizationClient({
      teams: {
        enabled: false,
      },
    }),

    // API Key client plugin
    apiKeyClient(),

    // Two-Factor Authentication client plugin
    twoFactorClient({
      onTwoFactorRedirect: () => {
        // Redirect to 2FA verification page
        window.location.href = "/auth/2fa";
      },
    }),
  ],
});

// Export auth methods for easier access
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  // Admin methods
  admin,
  // Organization methods
  organization,
  // API Key methods
  apiKey,
  // Two-Factor methods
  twoFactor,
} = authClient;
