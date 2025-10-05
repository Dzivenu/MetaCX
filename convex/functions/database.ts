import { mutation } from "../_generated/server";

/**
 * Reset the entire Convex database by deleting all records from all tables
 * WARNING: This will permanently delete ALL data in the database!
 */
export const resetDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🚨 Starting database reset - this will delete ALL data!");

    // Define table names to reset (excluding preserved tables)
    // PRESERVED TABLES (will NOT be reset): users, userPreferences, cxsessions, organizations
    const tableNames = [
      // "app_currencies",
      "org_currencies",
      "org_denominations",
      "org_breakdowns",
      "org_orders",
      "org_identifications",
      "org_customers",
      "org_contacts",
      "org_addresses",
      "org_repositories",
      "org_float_transfers",
      "org_float_stacks",
      "org_float_snapshots",
      "org_repository_access_logs",
      "org_activities",
      "org_cx_sessions",
      "org_cx_session_access_logs",
    ] as const;

    console.log("🔒 Preserved tables (will NOT be reset):");
    console.log("   - users");
    console.log("   - userPreferences");
    console.log("   - cxsessions");
    console.log("   - organizations");
    console.log("");
    console.log("🗑️ Tables to be reset:");
    tableNames.forEach((table) => console.log(`   - ${table}`));

    const deletionResults: Record<string, number> = {};

    // Delete all records from each table
    for (const tableName of tableNames) {
      try {
        console.log(`🗑️ Clearing table: ${tableName}`);

        // Get all records from the table
        const records = await ctx.db.query(tableName).collect();
        console.log(`   Found ${records.length} records in ${tableName}`);

        // Delete each record
        let deletedCount = 0;
        for (const record of records) {
          await ctx.db.delete(record._id);
          deletedCount++;
        }

        deletionResults[tableName] = deletedCount;
        console.log(`   ✅ Deleted ${deletedCount} records from ${tableName}`);
      } catch (error) {
        console.error(`   ❌ Error clearing table ${tableName}:`, error);
        deletionResults[tableName] = -1; // Indicate error
      }
    }

    console.log("🎉 Database reset completed!");
    console.log("📊 Deletion summary:", deletionResults);

    return {
      success: true,
      deletionResults,
      message: "Database has been completely reset. All tables are now empty.",
    };
  },
});

/**
 * Get count of records in all tables (useful for verification)
 */
export const getDatabaseStats = mutation({
  args: {},
  handler: async (ctx) => {
    // All table names from the schema
    const allTableNames = [
      "users",
      "userPreferences",
      "app_currencies",
      "cxsessions",
      "organizations",
      "org_currencies",
      "org_denominations",
      "org_breakdowns",
      "org_orders",
      "org_identifications",
      "org_customers",
      "org_contacts",
      "org_addresses",
      "org_repositories",
      "org_float_transfers",
      "org_float_stacks",
      "org_float_snapshots",
      "org_repository_access_logs",
      "org_activities",
      "org_cx_sessions",
      "org_cx_session_access_logs",
    ] as const;

    // Define preserved tables for reference
    const preservedTables = [
      "users",
      "userPreferences",
      "cxsessions",
      "organizations",
    ];
    const resetTables = allTableNames.filter(
      (table) => !preservedTables.includes(table)
    );

    const stats: Record<string, number> = {};
    const preservedStats: Record<string, number> = {};
    const resetStats: Record<string, number> = {};

    for (const tableName of allTableNames) {
      try {
        const records = await ctx.db.query(tableName).collect();
        const count = records.length;
        stats[tableName] = count;

        if (preservedTables.includes(tableName)) {
          preservedStats[tableName] = count;
        } else {
          resetStats[tableName] = count;
        }
      } catch (error) {
        console.error(`Error getting stats for ${tableName}:`, error);
        stats[tableName] = -1;
      }
    }

    const totalRecords = Object.values(stats).reduce(
      (sum, count) => sum + (count > 0 ? count : 0),
      0
    );
    const preservedRecords = Object.values(preservedStats).reduce(
      (sum, count) => sum + (count > 0 ? count : 0),
      0
    );
    const resetRecords = Object.values(resetStats).reduce(
      (sum, count) => sum + (count > 0 ? count : 0),
      0
    );

    return {
      stats,
      preservedStats,
      resetStats,
      totalRecords,
      preservedRecords,
      resetRecords,
      preservedTables,
      resetTables,
    };
  },
});
