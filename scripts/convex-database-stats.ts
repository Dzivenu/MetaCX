import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { loadEnvFiles, getConvexUrl } from "./env-loader";

/**
 * Script to show Convex database statistics
 *
 * This script will:
 * 1. Connect to Convex using environment variables
 * 2. Show record counts for all tables
 * 3. Show total database size
 *
 * Usage:
 *   npm run db:stats-convex
 */

async function showConvexDatabaseStats() {
  console.log("📊 Convex Database Statistics");
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
    console.log("\n📈 Fetching database statistics...");
    const stats = await client.mutation(
      api.functions.database.getDatabaseStats,
      {}
    );

    console.log(`\n📊 Total Records: ${stats.totalRecords}`);

    // Handle both old and new response formats
    const preservedRecords = stats.preservedRecords ?? 0;
    const resetRecords = stats.resetRecords ?? stats.totalRecords;
    const preservedStats = stats.preservedStats ?? {};
    const resetStats = stats.resetStats ?? stats.stats ?? {};

    console.log(`   🔒 Preserved tables: ${preservedRecords} records`);
    console.log(`   🗑️  Resetable tables: ${resetRecords} records`);

    if (stats.totalRecords === 0) {
      console.log("\n🗃️  Database is empty - no records found in any table.");
    } else {
      // Show preserved tables if available
      const preservedEntries = Object.entries(preservedStats);
      if (preservedEntries.length > 0) {
        console.log("\n🔒 Preserved Tables (never reset):");
        const sortedPreservedStats = preservedEntries.sort(
          ([, a], [, b]) => b - a
        );

        sortedPreservedStats.forEach(([table, count]) => {
          if (count === -1) {
            console.log(`   ❌ ${table}: Error retrieving data`);
          } else if (count === 0) {
            console.log(`   ⚪ ${table}: 0 records`);
          } else {
            console.log(`   📄 ${table}: ${count.toLocaleString()} records`);
          }
        });
      }

      // Show reset tables
      const resetEntries = Object.entries(resetStats);
      if (resetEntries.length > 0) {
        console.log("\n🗑️  Resetable Tables:");
        const sortedResetStats = resetEntries.sort(([, a], [, b]) => b - a);

        sortedResetStats.forEach(([table, count]) => {
          if (count === -1) {
            console.log(`   ❌ ${table}: Error retrieving data`);
          } else if (count === 0) {
            console.log(`   ⚪ ${table}: 0 records`);
          } else {
            console.log(`   📄 ${table}: ${count.toLocaleString()} records`);
          }
        });
      }

      // Show summary - prefer the new format, fall back to old format
      const allStats = stats.stats || {};
      const allTablesWithData = Object.entries(allStats).filter(
        ([, count]) => count > 0
      );
      if (allTablesWithData.length > 0) {
        console.log(
          `\n💾 Active tables: ${allTablesWithData.length}/${
            Object.keys(allStats).length
          }`
        );
        console.log(
          "   Tables with data:",
          allTablesWithData.map(([table]) => table).join(", ")
        );
      }

      // If we don't have the new format, show all tables without categorization
      if (preservedEntries.length === 0 && resetEntries.length === 0) {
        console.log("\n📋 All Tables:");
        const sortedAllStats = Object.entries(allStats).sort(
          ([, a], [, b]) => b - a
        );

        sortedAllStats.forEach(([table, count]) => {
          if (count === -1) {
            console.log(`   ❌ ${table}: Error retrieving data`);
          } else if (count === 0) {
            console.log(`   ⚪ ${table}: 0 records`);
          } else {
            console.log(`   📄 ${table}: ${count.toLocaleString()} records`);
          }
        });
      }
    }
  } catch (error) {
    console.error("\n💥 Error fetching database statistics:");
    console.error(error);
    process.exit(1);
  }

  console.log("\n✅ Statistics retrieval completed!");
  console.log("=".repeat(50));
}

// Run the stats
showConvexDatabaseStats()
  .then(() => {
    console.log("🏁 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
