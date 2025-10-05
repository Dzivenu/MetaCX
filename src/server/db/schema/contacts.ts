import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { organization, user } from "./better-auth-schema";

// Contacts linked to customers
// - Mandatory organization_id
// - One row per endpoint (email/telephone/etc.)
export const contact = pgTable(
  "contacts",
  {
    id: text("id").primaryKey(),

    // Scope & relations
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Polymorphic association (e.g., CUSTOMER, USER)
    parentType: text("parent_type").notNull(),
    parentId: text("parent_id").notNull(),

    // Contact details
    typeOf: text("type_of").notNull(), // email | telephone | ...
    endpoint: text("endpoint").notNull(), // value (e.g., email address or phone number)
    extension: text("extension"), // phone extension if applicable

    // Flags
    primary: boolean("primary").default(false).notNull(),
    verified: boolean("verified").default(false).notNull(),
    verifiedAt: timestamp("verified_at"),
    marketable: boolean("marketable"),
    marketableAcceptDt: timestamp("marketable_accept_dt"),
    active: boolean("active").default(true).notNull(),

    // Audit
    createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),

    // Optional reviewer for verification tracking
    reviewerId: text("reviewer_id").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    orgIdx: index("index_contacts_on_organization_id").on(table.organizationId),
    parentIdx: index("index_contacts_on_parent").on(table.parentType, table.parentId),
    typeIdx: index("index_contacts_on_type_of").on(table.typeOf),
  })
);
