import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Simple .env file loader utility
 * Loads environment variables from common .env file patterns
 */

export function loadEnvFiles(): void {
  // Common .env file patterns in order of precedence
  const envFiles = [
    ".env.local",
    ".env.development.local",
    ".env.development",
    ".env",
  ];

  // Get the app directory (where package.json is located)
  const appDir = process.cwd();

  console.log(`🔍 Looking for environment files in: ${appDir}`);

  let loadedFiles = 0;
  let envVars = 0;

  for (const envFile of envFiles) {
    const envPath = join(appDir, envFile);

    if (existsSync(envPath)) {
      try {
        console.log(`📄 Loading environment file: ${envFile}`);
        const envContent = readFileSync(envPath, "utf8");
        const vars = parseEnvFile(envContent);

        // Set environment variables (don't override existing ones)
        for (const [key, value] of Object.entries(vars)) {
          if (!process.env[key]) {
            process.env[key] = value;
            envVars++;
          }
        }

        loadedFiles++;
        console.log(
          `   ✅ Loaded ${Object.keys(vars).length} variables from ${envFile}`
        );
      } catch (error) {
        console.warn(
          `   ⚠️  Failed to load ${envFile}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  if (loadedFiles === 0) {
    console.log(
      `📝 No .env files found. You may need to create a .env.local file.`
    );
    console.log(`   Example files available: env.example, sample.env`);
    console.log(`   Run: cp env.example .env.local`);
  } else {
    console.log(
      `✅ Loaded ${envVars} environment variables from ${loadedFiles} file(s)`
    );
  }

  console.log("");
}

/**
 * Parse .env file content into key-value pairs
 */
function parseEnvFile(content: string): Record<string, string> {
  const vars: Record<string, string> = {};

  const lines = content.split("\n");

  for (let line of lines) {
    // Remove comments and trim whitespace
    line = line.split("#")[0].trim();

    // Skip empty lines
    if (!line) continue;

    // Parse KEY=VALUE format
    const equalIndex = line.indexOf("=");
    if (equalIndex === -1) continue;

    const key = line.slice(0, equalIndex).trim();
    let value = line.slice(equalIndex + 1).trim();

    // Remove quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      vars[key] = value;
    }
  }

  return vars;
}

/**
 * Get Convex URL from environment with helpful error messages
 */
export function getConvexUrl(): string {
  const convexUrl =
    process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

  if (!convexUrl) {
    console.error(
      "❌ Error: NEXT_PUBLIC_CONVEX_URL or CONVEX_URL environment variable not found!"
    );
    console.error("");
    console.error("🔧 To fix this issue:");
    console.error("   1. Create a .env.local file in the app directory");
    console.error("   2. Copy from the example: cp env.example .env.local");
    console.error("   3. Add your Convex URL:");
    console.error(
      '      NEXT_PUBLIC_CONVEX_URL="https://your-convex-deployment-url.convex.cloud"'
    );
    console.error("   4. For local development:");
    console.error('      NEXT_PUBLIC_CONVEX_URL="http://localhost:8187"');
    console.error("");
    console.error("📖 Available example files:");
    console.error("   - env.example (template with all variables)");
    console.error("   - sample.env (sample configuration)");

    throw new Error("Convex URL not configured");
  }

  return convexUrl;
}
