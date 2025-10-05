import { defineTable } from "convex/server";
import { v } from "convex/values";

// Standardized Org Customers table
export const org_customers = defineTable({
  // Organization references
  clerkOrganizationId: v.string(), // Clerk organization ID (legacy)
  clerk_org_id: v.string(), // Required Clerk organization ID
  org_id: v.id("organizations"), // Required Convex organization ID

  // Identity
  title: v.optional(v.string()),
  firstName: v.string(),
  middleName: v.optional(v.string()),
  lastName: v.string(),

  // Demographics
  dob: v.optional(v.number()), // date of birth as timestamp

  // Employment
  occupation: v.optional(v.string()),
  employer: v.optional(v.string()),

  // Legacy/compatibility fields inspired by Rails schema
  info: v.optional(v.string()),
  scanSuccess: v.optional(v.boolean()), // default false
  scanRawData: v.optional(v.string()),
  telephone: v.optional(v.string()),
  email: v.optional(v.string()),
  duplicate: v.optional(v.boolean()), // default false
  mergedId: v.optional(v.string()),
  ordersBetween1kTo9k: v.optional(v.number()), // default 0
  ordersBetween9kTo10k: v.optional(v.number()), // default 0
  lastOrderId: v.optional(v.string()), // default "0"
  suspiciousOrder: v.optional(v.boolean()),
  previousIds: v.optional(v.array(v.string())), // default []
  marketableContactIds: v.optional(v.array(v.string())), // default []
  primaryPhoneId: v.optional(v.string()),
  primaryEmailId: v.optional(v.string()),
  primaryAddressId: v.optional(v.string()),
  primaryIdentificationId: v.optional(v.string()),
  riskScore: v.optional(v.string()), // decimal as string
  lastOrderDt: v.optional(v.number()),
  ordersOver10k: v.optional(v.number()), // default 0
  blacklistReason: v.optional(v.string()),

  // Status flags
  active: v.optional(v.boolean()), // default true
  blacklisted: v.optional(v.boolean()), // default false

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),

  // Creator
  createdBy: v.id("users"),
})
  .index("by_organization", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_org_id", ["org_id"])
  .index("by_name", ["lastName", "firstName"])
  .index("by_first_name", ["firstName"])
  .index("by_last_name", ["lastName"])
  .index("by_merged_id", ["mergedId"])
  .index("by_risk_score", ["riskScore"])
  .index("by_active", ["active"])
  .index("by_blacklisted", ["blacklisted"]);
