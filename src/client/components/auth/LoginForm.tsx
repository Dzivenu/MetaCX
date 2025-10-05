"use client";

import { SignIn } from "@clerk/nextjs";

export function LoginForm() {
  return (
    <SignIn
      routing="hash"
      appearance={{
        elements: {
          formButtonPrimary:
            "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
        },
      }}
      signUpUrl="/signup"
    />
  );
}
