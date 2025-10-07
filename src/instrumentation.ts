// This file runs before any other code in Next.js
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

// Polyfill self immediately at module load time (not in async function)
if (typeof self === "undefined") {
  (globalThis as any).self = globalThis;
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Server-side instrumentation
    console.log("[Instrumentation] Server-side self polyfill applied");
  }
}

