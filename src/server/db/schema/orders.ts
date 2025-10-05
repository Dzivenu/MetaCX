import {
  pgTable,
  text,
  timestamp,
  decimal,
  real,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { cxSession } from "./cx-session";
import { user } from "./better-auth-schema";
import { repository } from "./repositories";

export const order = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    // Core money fields
    inboundSum: decimal("inbound_sum"),
    inboundTicker: text("inbound_ticker"),
    inboundType: text("inbound_type"),
    outboundSum: decimal("outbound_sum"),
    outboundTicker: text("outbound_ticker"),
    outboundType: text("outbound_type"),

    // Pricing
    fxRate: real("fx_rate"),
    rateWoFees: real("rate_wo_fees"),
    finalRate: real("final_rate"),
    finalRateWithoutFees: real("final_rate_without_fees"),
    margin: real("margin"),
    fee: real("fee"),
    networkFee: real("network_fee").default(0),

    status: text("status"), // QUOTE | ACCEPTED | CONFIRMED | COMPLETED | CANCELLED | SCHEDULED | BLOCKED

    // Relations
    sessionId: text("session_id").references(() => cxSession.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    inboundRepositoryId: text("inbound_repository_id").references(
      () => repository.id,
      { onDelete: "set null" }
    ),
    outboundRepositoryId: text("outbound_repository_id").references(
      () => repository.id,
      { onDelete: "set null" }
    ),

    // Meta
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$defaultFn(() => new Date()),
    openDt: timestamp("open_dt"),
    closeDt: timestamp("close_dt"),

    // Optional fields for compatibility
    btcFeeRate: text("btc_fee_rate"),
    quoteSource: text("quote_source"),
    quoteSourceUserId: text("quote_source_user_id"),
    batchedStatus: integer("batched_status").default(0), // 0 never_batched, 1 scheduled, 2 sent
  },
  (table) => ({
    sessionIdIdx: index("index_orders_on_session_id").on(table.sessionId),
    statusIdx: index("index_orders_on_status").on(table.status),
    inboundSumIdx: index("index_orders_on_inbound_sum").on(table.inboundSum),
    outboundSumIdx: index("index_orders_on_outbound_sum").on(table.outboundSum),
    userIdIdx: index("index_orders_on_user_id").on(table.userId),
    inboundRepoIdx: index("index_orders_on_inbound_repository_id").on(
      table.inboundRepositoryId
    ),
    outboundRepoIdx: index("index_orders_on_outbound_repository_id").on(
      table.outboundRepositoryId
    ),
  })
);


