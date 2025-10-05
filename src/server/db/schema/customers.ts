import {
  pgTable,
  text,
  timestamp,
  boolean,
  date,
  index,
} from "drizzle-orm/pg-core";
import { organization } from "./better-auth-schema";
import { integer, decimal } from "drizzle-orm/pg-core";

// Standardized Customers table
// - Mandatory organization_id
// - Normalized person fields
export const customer = pgTable(
  "customers",
  {
    id: text("id").primaryKey(),

    // Organization scope
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Identity
    title: text("title"),
    firstName: text("first_name").notNull(),
    middleName: text("middle_name"),
    lastName: text("last_name").notNull(),

    // Demographics
    dob: date("dob"), // date of birth

    // Employment
    occupation: text("occupation"),
    employer: text("employer"),

    // Legacy/compatibility fields inspired by Rails schema
    info: text("info"),
    scanSuccess: boolean("scan_success").default(false).notNull(),
    scanRawData: text("scan_raw_data"),
    telephone: text("telephone"),
    email: text("email"),
    duplicate: boolean("duplicate").default(false).notNull(),
    mergedId: text("merged_id"),
    ordersBetween1kTo9k: integer("orders_between_1k_to_9k").default(0),
    ordersBetween9kTo10k: integer("orders_between_9k_to_10k").default(0),
    lastOrderId: text("last_order_id").default("0"),
    suspiciousOrder: boolean("suspicious_order"),
    previousIds: text("previous_ids").array().default([]),
    marketableContactIds: text("marketable_contact_ids").array().default([]),
    primaryPhoneId: text("primary_phone_id"),
    primaryEmailId: text("primary_email_id"),
    primaryAddressId: text("primary_address_id"),
    primaryIdentificationId: text("primary_identification_id"),
    riskScore: decimal("risk_score"),
    lastOrderDt: timestamp("last_order_dt"),
    ordersOver10k: integer("orders_over_10k").default(0),
    blacklistReason: text("blacklist_reason"),

    // Status flags
    active: boolean("active").default(true).notNull(),
    blacklisted: boolean("blacklisted").default(false).notNull(),

    // Timestamps
    createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    orgIdx: index("index_customers_on_organization_id").on(table.organizationId),
    nameIdx: index("index_customers_on_last_first_name").on(
      table.lastName,
      table.firstName
    ),
    firstNameIdx: index("index_customers_on_first_name").on(table.firstName),
    lastNameIdx: index("index_customers_on_last_name").on(table.lastName),
    mergedIdIdx: index("index_customers_on_merged_id").on(table.mergedId),
    riskScoreIdx: index("index_customers_on_risk_score").on(table.riskScore),
  })
);
