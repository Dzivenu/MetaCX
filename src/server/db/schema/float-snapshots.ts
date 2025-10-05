import {
  pgTable,
  text,
  timestamp,
  decimal,
  json,
  index,
} from "drizzle-orm/pg-core";
import { cxSession } from "./cx-session";
import { repository } from "./repositories";
import { user } from "./better-auth-schema";

export const floatSnapshot = pgTable(
  "float_snapshots",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").references(() => cxSession.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$defaultFn(() => new Date()),
    status: text("status").notNull(),
    sourceModelType: text("source_model_type"),
    sourceModelId: text("source_model_id"),
    inboundRepositoryId: text("inbound_repository_id").references(
      () => repository.id
    ),
    outboundRepositoryId: text("outbound_repository_id").references(
      () => repository.id
    ),
    inboundTicker: text("inbound_ticker"),
    outboundTicker: text("outbound_ticker"),
    inboundSum: decimal("inbound_sum"),
    outboundSum: decimal("outbound_sum"),
    inboundBalanceBefore: decimal("inbound_balance_before"),
    inboundBalanceAfter: decimal("inbound_balance_after"),
    outboundBalanceBefore: decimal("outbound_balance_before"),
    outboundBalanceAfter: decimal("outbound_balance_after"),
    floatStacksData: json("float_stacks_data").$type<any[]>().default([]),
  },
  (table) => ({
    sessionIdIdx: index("index_float_snapshots_on_session_id").on(
      table.sessionId
    ),
    statusIdx: index("index_float_snapshots_on_status").on(table.status),
    sourceModelIdx: index("index_float_snapshots_on_source_model").on(
      table.sourceModelType,
      table.sourceModelId
    ),
  })
);
