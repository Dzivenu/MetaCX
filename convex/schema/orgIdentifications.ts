import { defineTable } from "convex/server";
import { v } from "convex/values";

// Standardized org identifications (KYC) per customer
export const org_identifications = defineTable({
  // Organization references
  clerkOrganizationId: v.string(), // Clerk organization ID (legacy)
  clerk_org_id: v.string(), // Required Clerk organization ID
  org_id: v.id("organizations"), // Required Convex organization ID
  orgCustomerId: v.id("org_customers"),
  orgAddressId: v.optional(v.id("org_addresses")),

  // Document
  typeOf: v.string(), // PASSPORT | DRIVING_LICENSE | NATIONAL_ID | RESIDENCY_CARD | ...
  referenceNumber: v.string(),
  issuingCountryCode: v.optional(v.string()), // ISO country code
  issuingCountryName: v.optional(v.string()), // Full country name
  issuingStateCode: v.optional(v.string()), // State/Province code
  issuingStateName: v.optional(v.string()), // State/Province name
  issueDate: v.optional(v.number()), // Date as timestamp
  expiryDate: v.optional(v.number()), // Date as timestamp
  photo: v.optional(v.string()),

  // Person data (copied for KYC snapshot, optional)
  dateOfBirth: v.optional(v.number()), // Date as timestamp

  // Compliance context
  originOfFunds: v.optional(v.string()),
  purposeOfFunds: v.optional(v.string()),
  description: v.optional(v.string()),

  // Verification
  verified: v.optional(v.boolean()), // default false
  verifiedAt: v.optional(v.number()),
  reviewerId: v.optional(v.id("users")),
  primary: v.optional(v.boolean()), // default false
  typeCode: v.optional(v.string()),
  countryCode: v.optional(v.string()),
  countryName: v.optional(v.string()),
  provinceCode: v.optional(v.string()),
  provinceName: v.optional(v.string()),
  provinceOther: v.optional(v.string()),
  active: v.optional(v.boolean()), // @deprecated - No longer used in UI, kept for backwards compatibility
  orderId: v.optional(v.string()),

  // Audit
  createdAt: v.number(),
  updatedAt: v.number(),

  // Creator
  createdBy: v.id("users"),
})
  .index("by_organization", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_org_id", ["org_id"])
  .index("by_org_customer", ["orgCustomerId"])
  .index("by_org_address", ["orgAddressId"])
  .index("by_type", ["typeOf"])
  .index("by_reference_number", ["referenceNumber"])
  .index("by_issuing_country", ["issuingCountryCode"])
  .index("by_issuing_state", ["issuingStateCode"])
  .index("by_active", ["active"])
  .index("by_primary", ["primary"]);
