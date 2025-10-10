import { defineTable } from "convex/server";
import { v } from "convex/values";

// Comprehensive org addresses with polymorphic parent support
// Supports multiple addresses per entity (customers, tellers, business entities, etc.)
export const org_addresses = defineTable({
  // Organization references
  clerkOrganizationId: v.string(), // Clerk organization ID (legacy)
  clerk_org_id: v.string(), // Required Clerk organization ID
  org_id: v.id("organizations"), // Required Convex organization ID

  // Polymorphic association - allows attachment to any entity type
  parentType: v.string(), // e.g., "customer", "teller", "business_customer", "organization", "branch"
  parentId: v.string(), // ID of the parent entity

  // Address type classification
  addressType: v.optional(v.string()), // e.g., "home", "work", "business", "mailing", "billing", "shipping"

  // Standard address components
  line1: v.string(), // Street address line 1 (required)
  line2: v.optional(v.string()), // Street address line 2 (apt, suite, etc.)
  line3: v.optional(v.string()), // Additional address line (for international)

  // Geographic locality
  city: v.string(), // City/Municipality
  county: v.optional(v.string()), // County/District
  stateCode: v.string(), // State/Province/Region code (e.g., "CA", "NY", "ON")
  stateName: v.string(), // Full state/province name (e.g., "California", "New York", "Ontario")
  postalCode: v.string(), // ZIP/Postal Code
  countryCode: v.string(), // ISO country code (e.g., "US", "CA", "GB") - REQUIRED
  countryName: v.string(), // Full country name (e.g., "United States", "Canada") - REQUIRED

  // Extended location data
  sublocality: v.optional(v.string()), // Neighborhood/Suburb
  administrativeArea: v.optional(v.string()), // Administrative division

  // Geocoding/mapping support
  latitude: v.optional(v.number()), // Decimal degrees
  longitude: v.optional(v.number()), // Decimal degrees
  timezone: v.optional(v.string()), // IANA timezone (e.g., "America/New_York")

  // Address validation and standardization
  validated: v.optional(v.boolean()), // Whether address was validated by service
  standardized: v.optional(v.boolean()), // Whether address was standardized
  validationService: v.optional(v.string()), // Service used for validation (e.g., "USPS", "Google")
  validationDate: v.optional(v.number()), // When validation occurred

  // Delivery and contact information
  deliveryInstructions: v.optional(v.string()), // Special delivery notes
  accessInstructions: v.optional(v.string()), // How to access the location
  contactPhone: v.optional(v.string()), // Phone for this specific location
  contactEmail: v.optional(v.string()), // Email for this specific location

  // Business/organizational context
  departmentName: v.optional(v.string()), // Department within organization
  buildingName: v.optional(v.string()), // Building or complex name
  floorNumber: v.optional(v.string()), // Floor within building
  roomNumber: v.optional(v.string()), // Room/office number

  // Status and priority flags
  primary: v.optional(v.boolean()), // Is this the primary address for the parent entity?
  active: v.optional(v.boolean()), // @deprecated - No longer used in UI, kept for backwards compatibility
  verified: v.optional(v.boolean()), // Has this address been verified/confirmed?
  confidential: v.optional(v.boolean()), // Should this address be treated as confidential?

  // Date ranges for temporary or seasonal addresses
  effectiveDate: v.optional(v.number()), // When this address becomes effective
  expirationDate: v.optional(v.number()), // When this address expires

  // Legacy/compatibility fields
  addressFull: v.optional(v.string()), // Freeform full address representation
  notes: v.optional(v.string()), // Additional notes about this address

  // Audit trail
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.id("users"),
  lastModifiedBy: v.optional(v.id("users")),
})
  // Primary indexes for organization and parent entity
  .index("by_organization", ["clerkOrganizationId"])
  .index("by_clerk_org_id", ["clerk_org_id"])
  .index("by_org_id", ["org_id"])
  .index("by_parent", ["parentType", "parentId"])

  // Address type and status indexes
  .index("by_parent_and_type", ["parentType", "parentId", "addressType"])
  .index("by_parent_and_primary", ["parentType", "parentId", "primary"])
  .index("by_active", ["active"])
  .index("by_primary", ["primary"])
  .index("by_verified", ["verified"])

  // Geographic indexes for location-based queries
  .index("by_city", ["city"])
  .index("by_state_code", ["stateCode"])
  .index("by_state_name", ["stateName"])
  .index("by_postal_code", ["postalCode"])
  .index("by_country_code", ["countryCode"])
  .index("by_country_name", ["countryName"])
  .index("by_city_state", ["city", "stateCode"])
  .index("by_state_postal", ["stateCode", "postalCode"])
  .index("by_country_state", ["countryCode", "stateCode"])

  // Date-based indexes for temporal addresses
  .index("by_effective_date", ["effectiveDate"])
  .index("by_expiration_date", ["expirationDate"]);
