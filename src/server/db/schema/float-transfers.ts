import { pgTable, text, timestamp, decimal, index } from "drizzle-orm/pg-core";
import { cxSession } from "./cx-session";
import { repository } from "./repositories";
import { user } from "./better-auth-schema";

export const floatTransfer = pgTable(
  "float_transfers",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => cxSession.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$defaultFn(() => new Date()),
    inboundRepositoryId: text("inbound_repository_id")
      .notNull()
      .references(() => repository.id, { onDelete: "cascade" }),
    outboundRepositoryId: text("outbound_repository_id")
      .notNull()
      .references(() => repository.id, { onDelete: "cascade" }),
    inboundTicker: text("inbound_ticker").notNull(),
    outboundTicker: text("outbound_ticker").notNull(),
    inboundSum: decimal("inbound_sum").notNull(),
    outboundSum: decimal("outbound_sum").notNull(),
    status: text("status").default("PENDING").notNull(),
    notes: text("notes"),
  },
  (table) => ({
    sessionIdIdx: index("index_float_transfers_on_session_id").on(
      table.sessionId
    ),
    inboundRepositoryIdIdx: index(
      "index_float_transfers_on_inbound_repository_id"
    ).on(table.inboundRepositoryId),
    outboundRepositoryIdIdx: index(
      "index_float_transfers_on_outbound_repository_id"
    ).on(table.outboundRepositoryId),
    statusIdx: index("index_float_transfers_on_status").on(table.status),
  })
);
