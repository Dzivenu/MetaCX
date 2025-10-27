import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const getOrgSettings = query({
  args: {
    clerkOrganizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("org_settings")
      .withIndex("by_organization", (q) =>
        q.eq("clerkOrganizationId", args.clerkOrganizationId)
      )
      .first();

    return settings || null;
  },
});

export const createOrgSettingsIfNotExists = mutation({
  args: {
    clerkOrganizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("org_settings")
      .withIndex("by_organization", (q) =>
        q.eq("clerkOrganizationId", args.clerkOrganizationId)
      )
      .first();

    if (existing) {
      return existing;
    }

    const now = Date.now();
    const newSettings = {
      clerkOrganizationId: args.clerkOrganizationId,
      thermalReceiptFontSizePixels: 12,
      thermalReceiptFontFace: "monospace",
      thermalReceiptLeftPaddingPixels: 5,
      thermalReceiptRightPaddingPixels: 5,
      thermalReceiptOrderHeaderHtml: "",
      thermalReceiptOrderFooterHtml: "",
      thermalReceiptInboundCryptoOrderDisclaimerHtml: "",
      thermalReceiptOutboundCryptoOrderDisclaimerHtml: "",
      thermalReceiptScheduledOrderDisclaimerHtml: "",
      orderUsbReceiptAutoPrintOnOrderComplete: false,
      createdAt: now,
      updatedAt: now,
    };

    const settingsId = await ctx.db.insert("org_settings", newSettings);
    return { ...newSettings, _id: settingsId };
  },
});

export const updateOrgSettings = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const { clerkOrganizationId, ...updates } = args;

    const settings = await ctx.db
      .query("org_settings")
      .withIndex("by_organization", (q) =>
        q.eq("clerkOrganizationId", clerkOrganizationId)
      )
      .first();

    if (!settings) {
      const now = Date.now();
      const newSettings = {
        clerkOrganizationId,
        thermalReceiptFontSizePixels: updates.thermalReceiptFontSizePixels ?? 12,
        thermalReceiptFontFace: updates.thermalReceiptFontFace ?? "monospace",
        thermalReceiptLeftPaddingPixels: updates.thermalReceiptLeftPaddingPixels ?? 5,
        thermalReceiptRightPaddingPixels: updates.thermalReceiptRightPaddingPixels ?? 5,
        thermalReceiptOrderHeaderHtml: updates.thermalReceiptOrderHeaderHtml ?? "",
        thermalReceiptOrderFooterHtml: updates.thermalReceiptOrderFooterHtml ?? "",
        thermalReceiptInboundCryptoOrderDisclaimerHtml: updates.thermalReceiptInboundCryptoOrderDisclaimerHtml ?? "",
        thermalReceiptOutboundCryptoOrderDisclaimerHtml: updates.thermalReceiptOutboundCryptoOrderDisclaimerHtml ?? "",
        thermalReceiptScheduledOrderDisclaimerHtml: updates.thermalReceiptScheduledOrderDisclaimerHtml ?? "",
        orderUsbReceiptAutoPrintOnOrderComplete: updates.orderUsbReceiptAutoPrintOnOrderComplete ?? false,
        createdAt: now,
        updatedAt: now,
      };

      const settingsId = await ctx.db.insert("org_settings", newSettings);
      return { ...newSettings, _id: settingsId };
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (updates.thermalReceiptFontSizePixels !== undefined) {
      updateData.thermalReceiptFontSizePixels = updates.thermalReceiptFontSizePixels;
    }
    if (updates.thermalReceiptFontFace !== undefined) {
      updateData.thermalReceiptFontFace = updates.thermalReceiptFontFace;
    }
    if (updates.thermalReceiptLeftPaddingPixels !== undefined) {
      updateData.thermalReceiptLeftPaddingPixels = updates.thermalReceiptLeftPaddingPixels;
    }
    if (updates.thermalReceiptRightPaddingPixels !== undefined) {
      updateData.thermalReceiptRightPaddingPixels = updates.thermalReceiptRightPaddingPixels;
    }
    if (updates.thermalReceiptOrderHeaderHtml !== undefined) {
      updateData.thermalReceiptOrderHeaderHtml = updates.thermalReceiptOrderHeaderHtml;
    }
    if (updates.thermalReceiptOrderFooterHtml !== undefined) {
      updateData.thermalReceiptOrderFooterHtml = updates.thermalReceiptOrderFooterHtml;
    }
    if (updates.thermalReceiptInboundCryptoOrderDisclaimerHtml !== undefined) {
      updateData.thermalReceiptInboundCryptoOrderDisclaimerHtml = updates.thermalReceiptInboundCryptoOrderDisclaimerHtml;
    }
    if (updates.thermalReceiptOutboundCryptoOrderDisclaimerHtml !== undefined) {
      updateData.thermalReceiptOutboundCryptoOrderDisclaimerHtml = updates.thermalReceiptOutboundCryptoOrderDisclaimerHtml;
    }
    if (updates.thermalReceiptScheduledOrderDisclaimerHtml !== undefined) {
      updateData.thermalReceiptScheduledOrderDisclaimerHtml = updates.thermalReceiptScheduledOrderDisclaimerHtml;
    }
    if (updates.orderUsbReceiptAutoPrintOnOrderComplete !== undefined) {
      updateData.orderUsbReceiptAutoPrintOnOrderComplete = updates.orderUsbReceiptAutoPrintOnOrderComplete;
    }

    await ctx.db.patch(settings._id, updateData);

    return { ...settings, ...updateData };
  },
});
