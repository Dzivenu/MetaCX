import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { loadEnvFiles, getConvexUrl } from "./env-loader";

/**
 * Script to reset resetable tables in the Convex database
 *
 * PRESERVED TABLES (never reset): users, userPreferences, cxsessions, organizations
 * RESETABLE TABLES: app_currencies, org_currencies, org_denominations, etc.
 *
 * This script will:
 * 1. Connect to Convex using environment variables
 * 2. Show current database statistics (preserved vs resetable)
 * 3. Prompt for confirmation (unless --force flag is used)
 * 4. Reset only the resetable tables in the database
 * 5. Show final statistics to confirm reset
 *
 * Usage:
 *   npm run db:reset-convex
 *   npm run db:reset-convex -- --force  (skip confirmation)
 */

async function resetConvexDatabase() {
  console.log("🔥 Convex Database Reset Tool");
  console.log("=".repeat(50));

  // Load environment variables from .env files
  loadEnvFiles();

  // Get Convex URL from environment
  let convexUrl: string;
  try {
    convexUrl = getConvexUrl();
  } catch (error) {
    process.exit(1);
  }

  console.log(`🔗 Connecting to Convex: ${convexUrl}`);

  // Initialize Convex client
  const client = new ConvexHttpClient(convexUrl);

  try {
    // Step 1: Show current database statistics
    console.log("\n📊 Getting current database statistics...");
    const preResetStats = await client.mutation(
      api.functions.database.getDatabaseStats,
      {}
    );

    console.log("\n📈 Current Database State:");
    console.log(
      `   Total records across all tables: ${preResetStats.totalRecords}`
    );

    // Handle both old and new response formats
    const preservedRecords = preResetStats.preservedRecords ?? 0;
    const resetRecords =
      preResetStats.resetRecords ?? preResetStats.totalRecords;
    const preservedStats = preResetStats.preservedStats ?? {};
    const resetStats = preResetStats.resetStats ?? preResetStats.stats ?? {};

    console.log(`   🔒 Preserved tables: ${preservedRecords} records`);
    console.log(`   🗑️  Resetable tables: ${resetRecords} records`);

    if (preResetStats.totalRecords > 0) {
      // Show preserved tables if available
      const preservedEntries = Object.entries(preservedStats).filter(
        ([_, count]) => count > 0
      );
      if (preservedEntries.length > 0) {
        console.log("\n   🔒 Preserved tables (will NOT be reset):");
        preservedEntries.forEach(([table, count]) => {
          console.log(`     ${table}: ${count} records`);
        });
      }

      // Show resetable tables
      const resetEntries = Object.entries(resetStats).filter(
        ([_, count]) => count > 0
      );
      if (resetEntries.length > 0) {
        console.log("\n   🗑️  Resetable tables (will be cleared):");
        resetEntries.forEach(([table, count]) => {
          console.log(`     ${table}: ${count} records`);
        });
      }

      // If we don't have the new format, show all tables as potentially resetable
      if (
        Object.keys(preservedStats).length === 0 &&
        Object.keys(resetStats).length === 0
      ) {
        console.log(
          "\n   📋 All tables (some will be preserved during reset):"
        );
        Object.entries(preResetStats.stats || {})
          .filter(([_, count]) => count > 0)
          .forEach(([table, count]) => {
            console.log(`     ${table}: ${count} records`);
          });
      }
    } else {
      console.log("   Database is already empty!");
    }

    // Step 2: Confirmation (unless --force flag is used)
    const forceReset = process.argv.includes("--force");

    if (!forceReset && resetRecords > 0) {
      console.log(
        "\n⚠️  WARNING: This will permanently delete data from RESETABLE tables only!"
      );
      console.log(
        "   🔒 Preserved tables (users, userPreferences, cxsessions, organizations) will NOT be affected."
      );
      console.log(
        `   🗑️  ${resetRecords} records in resetable tables will be deleted.`
      );
      console.log("   This action cannot be undone.");
      console.log(
        "\n   To proceed without this confirmation, use: npm run db:reset-convex -- --force"
      );
      console.log(
        "\n❓ Are you sure you want to continue? (type 'DELETE RESETABLE DATA' to confirm)"
      );

      // Wait for user input
      process.stdin.setRawMode(true);
      process.stdin.resume();

      const confirmation = await new Promise<string>((resolve) => {
        let input = "";
        process.stdin.on("data", (chunk) => {
          const char = chunk.toString();
          if (char === "\r" || char === "\n") {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            resolve(input);
          } else if (char === "\u0003") {
            // Ctrl+C
            console.log("\n\n🚫 Operation cancelled by user.");
            process.exit(0);
          } else if (char === "\u007f") {
            // Backspace
            if (input.length > 0) {
              input = input.slice(0, -1);
              process.stdout.write("\b \b");
            }
          } else {
            input += char;
            process.stdout.write(char);
          }
        });
      });

      if (confirmation !== "DELETE RESETABLE DATA") {
        console.log(
          "\n\n🚫 Confirmation text did not match. Operation cancelled."
        );
        console.log('   Required: "DELETE RESETABLE DATA"');
        console.log(`   Received: "${confirmation}"`);
        process.exit(0);
      }
    }

    // Step 3: Perform the reset
    console.log("\n🚨 Starting database reset...");
    const resetResult = await client.mutation(
      api.functions.database.resetDatabase,
      {}
    );

    if (resetResult.success) {
      console.log("\n✅ Database reset completed successfully!");

      console.log("\n📊 Deletion Summary:");
      Object.entries(resetResult.deletionResults).forEach(([table, count]) => {
        if (count === -1) {
          console.log(`   ❌ ${table}: Error occurred`);
        } else if (count === 0) {
          console.log(`   ⚪ ${table}: Already empty`);
        } else {
          console.log(`   ✅ ${table}: ${count} records deleted`);
        }
      });

      // Step 4: Verify the reset
      console.log("\n🔍 Verifying database is empty...");
      const postResetStats = await client.mutation(
        api.functions.database.getDatabaseStats,
        {}
      );

      // Handle both old and new response formats for verification
      const postPreservedRecords = postResetStats.preservedRecords ?? 0;
      const postResetRecords =
        postResetStats.resetRecords ?? postResetStats.totalRecords;
      const postResetStatsData =
        postResetStats.resetStats ?? postResetStats.stats ?? {};

      if (
        postResetRecords === 0 ||
        (postResetStats.resetRecords !== undefined &&
          postResetStats.resetRecords === 0)
      ) {
        console.log(
          "✅ Verification successful: All resetable tables are empty!"
        );
        if (postResetStats.preservedRecords !== undefined) {
          console.log(
            `   🔒 Preserved tables still contain ${postPreservedRecords} records (as expected)`
          );
        }
      } else {
        console.log(
          `⚠️  Warning: ${postResetRecords} records still remain in resetable tables.`
        );
        console.log(
          "   Some resetable tables may not have been fully cleared:"
        );
        Object.entries(postResetStatsData)
          .filter(([_, count]) => count > 0)
          .forEach(([table, count]) => {
            console.log(`     ${table}: ${count} records remaining`);
          });
      }
    } else {
      console.log("❌ Database reset failed!");
      console.log("   Check the console output above for specific errors.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n💥 Fatal error during database reset:");
    console.error(error);
    process.exit(1);
  }

  console.log("\n🎉 Database reset operation completed!");
  console.log("=".repeat(50));
}

// Handle script termination gracefully
process.on("SIGINT", () => {
  console.log("\n\n🚫 Operation cancelled by user (Ctrl+C).");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n🚫 Operation terminated.");
  process.exit(0);
});

// Run the reset
resetConvexDatabase()
  .then(() => {
    console.log("🏁 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
