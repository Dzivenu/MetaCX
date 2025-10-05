import { defineTable } from "convex/server";
import { v } from "convex/values";

// App-wide currency rates table (global rates from API)
export const app_currencies = defineTable({
  name: v.string(),
  ticker: v.string(),
  base_rate_ticker: v.string(),
  type: v.union(
    v.literal("CRYPTOCURRENCY"),
    v.literal("FIAT"),
    v.literal("METAL")
  ),
  rate: v.number(),
  rate_updated_at: v.number(),
  network: v.optional(v.string()),
  contract: v.optional(v.string()),
  chain_id: v.optional(v.string()),
  rate_api: v.optional(v.string()),
  rate_api_identifier: v.optional(v.string()),
  icon: v.optional(v.string()),
})
  .index("by_ticker", ["ticker"])
  .index("by_type", ["type"]);
