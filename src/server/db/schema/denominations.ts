import {
  pgTable,
  text,
  timestamp,
  real,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { currency } from "./currencies";

export const denomination = pgTable(
  "denominations",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    value: real("value").notNull(),
    currencyId: text("currency_id")
      .notNull()
      .references(() => currency.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$defaultFn(() => new Date()),
    accepted: boolean("accepted").default(true),
  },
  (table) => ({
    currencyIdIdx: index("index_denominations_on_currency_id").on(
      table.currencyId
    ),
  })
);
