import type { Metadata } from "next";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "@/client/providers";

export const metadata: Metadata = {
  title: "metacx",
  description: "metacx web application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" {...mantineHtmlProps} suppressHydrationWarning>
        <head>
          <ColorSchemeScript defaultColorScheme="auto" />
        </head>
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
