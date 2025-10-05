import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { organization } from "./better-auth-schema";

// Standardized US address with polymorphic parent
// parent_type examples: CUSTOMER, USER
export const address = pgTable(
  "addresses",
  {
    id: text("id").primaryKey(),

    // Organization scope
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Polymorphic association
    parentType: text("parent_type").notNull(),
    parentId: text("parent_id").notNull(),

    // Address lines
    line1: text("line1").notNull(),
    line2: text("line2"),

    // Locality
    city: text("city").notNull(),
    state: text("state").notNull(), // US state code (e.g., CA)
    postalCode: text("postal_code").notNull(),
    countryCode: text("country_code").default("US").notNull(),

    // Flags
    primary: boolean("primary").default(false).notNull(),
    active: boolean("active").default(true).notNull(),

    // Optional freeform full address
    addressFull: text("address_full"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    orgIdx: index("index_addresses_on_organization_id").on(table.organizationId),
    parentIdx: index("index_addresses_on_parent").on(table.parentType, table.parentId),
    cityIdx: index("index_addresses_on_city").on(table.city),
    postalIdx: index("index_addresses_on_postal_code").on(table.postalCode),
  })
);
