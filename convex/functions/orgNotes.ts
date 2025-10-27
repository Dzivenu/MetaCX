import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Get a single note by ID for debugging
export const getOrgNoteById = query({
  args: {
    noteId: v.id("org_notes"),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    console.log("🔍 Retrieved note by ID:", JSON.stringify(note, null, 2));
    return note;
  },
});

// Get all notes for organization (basic test)
export const getAllOrgNotes = query({
  args: {
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) {
      return [];
    }

    console.log("🔍 Basic query - getting all notes for org:", orgId);

    const allNotes = await ctx.db
      .query("org_notes")
      .withIndex("by_organization", (q) =>
        q.eq("clerkOrganizationId", orgId)
      )
      .collect();

    console.log("🔍 Basic query - found notes:", allNotes.length);
    
    if (allNotes.length > 0) {
      console.log("🔍 Basic query - sample note org ID:", allNotes[0].clerkOrganizationId);
    }

    return allNotes;
  },
});

// Get notes for a specific entity (simplified version for debugging)
export const getOrgNotesByEntitySimple = query({
  args: {
    noteType: v.string(),
    entityId: v.string(),
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) {
      return [];
    }

    console.log("🔍 Simple query - fetching all notes for org:", orgId);

    // Get ALL notes for this organization first
    const allOrgNotes = await ctx.db
      .query("org_notes")
      .withIndex("by_organization", (q) =>
        q.eq("clerkOrganizationId", orgId)
      )
      .collect();

    console.log("🔍 Simple query - total org notes:", allOrgNotes.length);

    // Filter in JavaScript instead of Convex query
    const filteredNotes = allOrgNotes.filter((note) => {
      const matchesType = note.noteType === args.noteType;
      let matchesEntity = false;
      
      switch (args.noteType) {
        case "ORDER":
          matchesEntity = note.orderId === args.entityId;
          break;
        case "CUSTOMER":
          matchesEntity = note.customerId === args.entityId;
          break;
        case "SESSION":
          matchesEntity = note.sessionId === args.entityId;
          break;
        default:
          matchesEntity = false;
      }

      console.log("🔍 Simple query - note check:", {
        noteId: note._id,
        noteType: note.noteType,
        matchesType,
        entityId: note.orderId || note.customerId || note.sessionId,
        targetEntityId: args.entityId,
        matchesEntity
      });

      return matchesType && matchesEntity;
    });

    console.log("🔍 Simple query - filtered results:", filteredNotes.length);

    return filteredNotes.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get notes for a specific entity
export const getOrgNotesByEntity = query({
  args: {
    noteType: v.string(),
    entityId: v.string(),
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) {
      return [];
    }

    // Build query based on note type
    console.log("🔍 Querying notes:", {
      noteType: args.noteType,
      entityId: args.entityId,
      entityIdType: typeof args.entityId,
      orgId,
    });

    let notes: any[] = [];
    switch (args.noteType) {
      case "ORDER":
        // Query by organization and orderId directly
        notes = await ctx.db
          .query("org_notes")
          .withIndex("by_organization", (q) =>
            q.eq("clerkOrganizationId", orgId)
          )
          .filter((q) =>
            q.and(
              q.eq(q.field("noteType"), "ORDER"),
              q.eq(q.field("orderId"), args.entityId)
            )
          )
          .order("desc")
          .collect();
        
        console.log(
          "🔍 ORDER query details:",
          "orgId:",
          orgId,
          "entityId:",
          args.entityId,
          "found:",
          notes.length
        );
        
        // Debug: show what we're filtering for
        if (notes.length === 0) {
          const allOrgNotes = await ctx.db
            .query("org_notes")
            .withIndex("by_organization", (q) =>
              q.eq("clerkOrganizationId", orgId)
            )
            .collect();
          
          const orderNotes = allOrgNotes.filter(n => n.noteType === "ORDER");
          console.log(
            "🔍 Debug - all ORDER notes for org:",
            orderNotes.map(n => ({
              id: n._id,
              orderId: n.orderId,
              targetOrderId: args.entityId,
              matches: n.orderId === args.entityId
            }))
          );
        }
        break;
      case "CUSTOMER":
        notes = await ctx.db
          .query("org_notes")
          .withIndex("by_customer", (q) =>
            q.eq("customerId", args.entityId as any)
          )
          .filter((q) => q.eq(q.field("clerkOrganizationId"), orgId))
          .order("desc")
          .collect();
        break;
      case "SESSION":
        notes = await ctx.db
          .query("org_notes")
          .withIndex("by_session", (q) =>
            q.eq("sessionId", args.entityId as any)
          )
          .filter((q) => q.eq(q.field("clerkOrganizationId"), orgId))
          .order("desc")
          .collect();
        break;
      default:
        notes = [];
    }

    return notes;
  },
});

// Create a new note
export const createOrgNote = mutation({
  args: {
    noteType: v.string(),
    entityId: v.string(),
    title: v.optional(v.string()),
    message: v.string(),
    resolvable: v.boolean(),
    clerkOrganizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const orgId =
      args.clerkOrganizationId ||
      (typeof identity.org_id === "string" ? identity.org_id : undefined);
    if (!orgId) {
      throw new Error("No active organization selected");
    }

    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_id", (q) => q.eq("clerkOrganizationId", orgId))
      .first();

    if (!organization) {
      throw new Error("Organization not found");
    }

    const now = Date.now();

    // Build note data based on type
    const noteData: any = {
      clerkOrganizationId: orgId,
      clerk_org_id: orgId,
      org_id: organization._id,
      noteType: args.noteType,
      title: args.title,
      message: args.message,
      resolvable: args.resolvable,
      resolved: false,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    };

    // Set the appropriate entity ID field
    switch (args.noteType) {
      case "ORDER":
        noteData.orderId = args.entityId as any;
        break;
      case "CUSTOMER":
        noteData.customerId = args.entityId as any;
        break;
      case "SESSION":
        noteData.sessionId = args.entityId as any;
        break;
      case "EXPENSE":
        noteData.expenseId = args.entityId;
        break;
      case "TRANSFER":
        noteData.transferId = args.entityId;
        break;
      case "SWAP":
        noteData.swapId = args.entityId;
        break;
    }

    console.log("Creating note with data:", noteData);

    const noteId = await ctx.db.insert("org_notes", noteData);
    console.log("Note created with ID:", noteId);
    
    // Debug: Immediately query to verify the note was inserted correctly
    const insertedNote = await ctx.db.get(noteId);
    console.log("🔍 Verification - inserted note:", JSON.stringify(insertedNote, null, 2));
    
    // Debug: Query for all ORDER notes for this org to see if our note appears
    const allOrderNotes = await ctx.db
      .query("org_notes")
      .withIndex("by_organization", (q) =>
        q.eq("clerkOrganizationId", orgId)
      )
      .filter((q) => q.eq(q.field("noteType"), "ORDER"))
      .collect();
    console.log("🔍 All ORDER notes after creation:", allOrderNotes.length);
    console.log("🔍 Our note in the list:", allOrderNotes.find(n => n._id === noteId));
    
    return noteId;
  },
});

// Update a note
export const updateOrgNote = mutation({
  args: {
    noteId: v.id("org_notes"),
    title: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    const orgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    if (!orgId || note.clerkOrganizationId !== orgId) {
      throw new Error("Unauthorized");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updateData.title = args.title;
    }
    if (args.message !== undefined) {
      updateData.message = args.message;
    }

    await ctx.db.patch(args.noteId, updateData);
    return args.noteId;
  },
});

// Resolve a note
export const resolveOrgNote = mutation({
  args: {
    noteId: v.id("org_notes"),
    resolved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    const orgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    if (!orgId || note.clerkOrganizationId !== orgId) {
      throw new Error("Unauthorized");
    }

    if (!note.resolvable) {
      throw new Error("This note is not resolvable");
    }

    await ctx.db.patch(args.noteId, {
      resolved: args.resolved,
      resolvedAt: args.resolved ? Date.now() : undefined,
      resolvedBy: args.resolved ? user._id : undefined,
      updatedAt: Date.now(),
    });

    return args.noteId;
  },
});

// Delete a note
export const deleteOrgNote = mutation({
  args: {
    noteId: v.id("org_notes"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    const orgId =
      typeof identity.org_id === "string" ? identity.org_id : undefined;
    if (!orgId || note.clerkOrganizationId !== orgId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.noteId);
    return args.noteId;
  },
});
