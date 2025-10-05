"use client";

import { Container, Center } from "@mantine/core";
import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <Container size="xs" style={{ minHeight: "100vh" }}>
      <Center style={{ minHeight: "100vh" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <SignUp
            routing="hash"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-white shadow-lg rounded-lg border p-6",
                headerTitle: "text-xl font-semibold text-gray-900 text-center",
                headerSubtitle: "text-sm text-gray-600 text-center mb-4",
                formButtonPrimary:
                  "bg-blue-600 hover:bg-blue-700 text-sm normal-case w-full",
                formFieldInput:
                  "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm",
                footerActionLink: "text-blue-600 hover:text-blue-700 text-sm",
                dividerLine: "bg-gray-300",
                dividerText: "text-gray-500 text-sm",
              },
            }}
            signInUrl="/login"
          />
        </div>
      </Center>
    </Container>
  );
}
