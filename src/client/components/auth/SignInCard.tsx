"use client";

import { SignIn } from "@clerk/nextjs";

interface SignInCardProps {
  title?: string;
  subtitle?: string;
}

export function SignInCard({
  title = "Welcome back",
  subtitle = "Sign in to your account to continue",
}: SignInCardProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <SignIn
        routing="hash"
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-white shadow-lg rounded-lg border",
            headerTitle: "text-xl font-semibold text-gray-900",
            headerSubtitle: "text-sm text-gray-600",
            formButtonPrimary:
              "bg-blue-600 hover:bg-blue-700 text-sm normal-case w-full",
            formFieldInput:
              "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm",
            footerActionLink: "text-blue-600 hover:text-blue-700 text-sm",
          },
        }}
        signUpUrl="/signup"
      />
    </div>
  );
}
