import {
  pgTable,
  text,
  timestamp,
  json,
} from "drizzle-orm/pg-core";
import { user, organization } from "./better-auth-schema";
import { cxSession } from "./cx-session";

export const activity = pgTable("activity", {
  id: text("id").primaryKey(),
  event: text("event").notNull(), // e.g., 'SESSION_CREATED', 'SESSION_JOINED'
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  sessionId: text("session_id")
    .references(() => cxSession.id, { onDelete: "cascade" }),
  referenceId: text("reference_id"), // Reference to the entity being acted upon
  comment: text("comment"),
  meta: json("meta"), // Additional metadata about the activity
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export type Activity = typeof activity.$inferSelect;
export type NewActivity = typeof activity.$inferInsert;
