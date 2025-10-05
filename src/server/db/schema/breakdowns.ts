import { pgTable, text, timestamp, decimal, index } from "drizzle-orm/pg-core";
import { denomination } from "./denominations";
import { floatStack } from "./float-stacks";

export const breakdown = pgTable(
  "breakdowns",
  {
    id: text("id").primaryKey(),
    breakableType: text("breakable_type"),
    breakableId: text("breakable_id"),
    denominationId: text("denomination_id").references(() => denomination.id),
    count: decimal("count"),
    direction: text("direction"),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$defaultFn(() => new Date()),
    floatStackId: text("float_stack_id").references(() => floatStack.id),
    status: text("status"),
  },
  (table) => ({
    breakableTypeIdIdx: index(
      "index_breakdowns_on_breakable_type_and_breakable_id"
    ).on(table.breakableType, table.breakableId),
    denominationIdIdx: index("index_breakdowns_on_denomination_id").on(
      table.denominationId
    ),
    floatStackIdIdx: index("index_breakdowns_on_float_stack_id").on(
      table.floatStackId
    ),
  })
);
