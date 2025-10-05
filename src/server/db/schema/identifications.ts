import { pgTable, text, timestamp, boolean, date, index } from "drizzle-orm/pg-core";
import { organization, user } from "./better-auth-schema";
import { customer } from "./customers";
import { address } from "./addresses";

// Standardized identifications (KYC) per customer
// - Mandatory organization_id
export const identification = pgTable(
  "identifications",
  {
    id: text("id").primaryKey(),

    // Scope & relations
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    addressId: text("address_id").references(() => address.id, {
      onDelete: "set null",
    }),

    // Document
    typeOf: text("type_of").notNull(), // PASSPORT | DRIVING_LICENSE | NATIONAL_ID | RESIDENCY_CARD | ...
    referenceNumber: text("reference_number").notNull(),
    issuingCountryCode: text("issuing_country_code"), // ISO country code
    issueDate: date("issue_date"),
    expiryDate: date("expiry_date"),
    photo: text("photo"),

    // Person data (copied for KYC snapshot, optional)
    dateOfBirth: date("date_of_birth"),

    // Compliance context
    originOfFunds: text("origin_of_funds"),
    purposeOfFunds: text("purpose_of_funds"),
    description: text("description"),

    // Verification
    verified: boolean("verified").default(false).notNull(),
    verifiedAt: timestamp("verified_at"),
    reviewerId: text("reviewer_id").references(() => user.id, {
      onDelete: "set null",
    }),
    primary: boolean("primary").default(false).notNull(),
    typeCode: text("type_code"),
    countryCode: text("country_code"),
    provinceCode: text("province_code"),
    provinceOther: text("province_other"),
    active: boolean("active").default(true).notNull(),
    orderId: text("order_id"),

    // Audit
    createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    orgIdx: index("index_identifications_on_organization_id").on(
      table.organizationId
    ),
    customerIdx: index("index_identifications_on_customer_id").on(table.customerId),
    addressIdx: index("index_identifications_on_address_id").on(table.addressId),
    typeIdx: index("index_identifications_on_type_of").on(table.typeOf),
    refIdx: index("index_identifications_on_reference_number").on(
      table.referenceNumber
    ),
    activeIdx: index("index_identifications_on_active").on(table.active),
    primaryIdx: index("index_identifications_on_primary").on(table.primary),
  })
);
