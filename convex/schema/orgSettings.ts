import { defineTable } from "convex/server";
import { v } from "convex/values";

export const org_settings = defineTable({
  clerkOrganizationId: v.string(),
  
  thermalReceiptFontSizePixels: v.optional(v.number()),
  thermalReceiptFontFace: v.optional(v.string()),
  thermalReceiptLeftPaddingPixels: v.optional(v.number()),
  thermalReceiptRightPaddingPixels: v.optional(v.number()),
  thermalReceiptOrderHeaderHtml: v.optional(v.string()),
  thermalReceiptOrderFooterHtml: v.optional(v.string()),
  thermalReceiptInboundCryptoOrderDisclaimerHtml: v.optional(v.string()),
  thermalReceiptOutboundCryptoOrderDisclaimerHtml: v.optional(v.string()),
  thermalReceiptScheduledOrderDisclaimerHtml: v.optional(v.string()),
  
  orderUsbReceiptAutoPrintOnOrderComplete: v.optional(v.boolean()),
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_organization", ["clerkOrganizationId"]);
