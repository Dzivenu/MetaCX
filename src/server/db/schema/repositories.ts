import {
  pgTable,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { organization } from "./better-auth-schema";

export const repository = pgTable("repositories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  typeOf: text("type_of"),
  organizationId: text("organization_id").references(() => organization.id),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
  currencyType: text("currency_type"),
  form: text("form"),
  uid: integer("uid"),
  key: text("key").notNull().unique(),
  currencyTickers: text("currency_tickers").array().default([]),
  displayOrderId: integer("display_order_id"),
  floatThresholdBottom: decimal("float_threshold_bottom"),
  floatThresholdTop: decimal("float_threshold_top"),
  floatCountRequired: boolean("float_count_required"),
  active: boolean("active").default(true),
  // Repository access control - stores array of user IDs who have access
  authorizedUserIds: text("authorized_user_ids"), // JSON array of user IDs
}, (table) => ({
  nameIdx: index("index_repositories_on_name").on(table.name),
  keyIdx: index("index_repositories_on_key").on(table.key),
  // Composite unique constraint for organization_id + name
  orgNameUnique: unique("repositories_org_name_unique").on(table.organizationId, table.name),
}));