import {
  pgTable,
  text,
  timestamp,
  bigint,
  real,
  decimal,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { cxSession } from "./cx-session";
import { repository } from "./repositories";
import { denomination } from "./denominations";

export const floatStack = pgTable(
  "float_stacks",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => cxSession.id, { onDelete: "cascade" }),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repository.id, { onDelete: "cascade" }),
    denominationId: text("denomination_id")
      .notNull()
      .references(() => denomination.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$defaultFn(() => new Date()),

    // Float counts
    openCount: real("open_count").default(0.0),
    closeCount: real("close_count").default(0.0),
    middayCount: real("midday_count").default(0.0),
    lastSessionCount: real("last_session_count").default(0.0),

    // Confirmation timestamps
    openConfirmedDt: timestamp("open_confirmed_dt"),
    closeConfirmedDt: timestamp("close_confirmed_dt"),

    // Session tracking
    spentDuringSession: decimal("spent_during_session").default("0.0"),
    transferredDuringSession: real("transferred_during_session").default(0.0),

    // Value and pricing
    denominatedValue: real("denominated_value").default(0.0),
    ticker: text("ticker").notNull(),
    averageSpot: real("average_spot").default(0.0),
    openSpot: real("open_spot").default(0.0),
    closeSpot: real("close_spot").default(0.0),

    // Previous session reference
    previousSessionFloatStackId: text("previous_session_float_stack_id"),
  },
  (table) => ({
    denominationIdIdx: index("index_float_stacks_on_denomination_id").on(
      table.denominationId
    ),
    repositoryIdIdx: index("index_float_stacks_on_repository_id").on(
      table.repositoryId
    ),
    sessionIdIdx: index("index_float_stacks_on_session_id").on(table.sessionId),
    tickerIdx: index("index_float_stacks_on_ticker").on(table.ticker),
  })
);
