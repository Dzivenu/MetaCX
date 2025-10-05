import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/shared/config/env";

function subdomainMiddleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  // Get the base domain from environment or fallback
  const baseDomain = new URL(env.NEXT_PUBLIC_APP_URL).hostname;

  // Skip middleware for localhost and IP addresses during development
  if (hostname.includes("localhost") || hostname.match(/^\d+\.\d+\.\d+\.\d+/)) {
    return NextResponse.next();
  }

  // Extract subdomain
  const subdomain = hostname.replace(`.${baseDomain}`, "");

  // Skip if no subdomain or if it's www
  if (!subdomain || subdomain === hostname || subdomain === "www") {
    return NextResponse.next();
  }

  // Skip if subdomain contains reserved words
  const reservedSubdomains = ["api", "www", "mail", "ftp", "admin", "app"];
  if (reservedSubdomains.includes(subdomain)) {
    return NextResponse.next();
  }

  // Skip if the path already starts with the subdomain
  if (url.pathname.startsWith(`/${subdomain}`)) {
    return NextResponse.next();
  }

  // Rewrite the URL to include the subdomain as a path parameter
  url.pathname = `/${subdomain}${url.pathname}`;

  return NextResponse.rewrite(url);
}

export default clerkMiddleware((auth, request) => {
  // First handle Clerk authentication
  // Then handle subdomain logic
  return subdomainMiddleware(request);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
