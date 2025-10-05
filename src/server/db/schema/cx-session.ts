import {
  pgTable,
  text,
  timestamp,
  json,
} from "drizzle-orm/pg-core";
import { user, organization } from "./better-auth-schema";

export const cxSession = pgTable("cx_session", {
  id: text("id").primaryKey(),
  openStartDt: timestamp("open_start_dt"),
  openConfirmDt: timestamp("open_confirm_dt"),
  closeStartDt: timestamp("close_start_dt"),
  closeConfirmDt: timestamp("close_confirm_dt"),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
  status: text("status").default("DORMANT").notNull(),
  verifiedByUserId: text("verified_by_user_id").references(() => user.id),
  verifiedDt: timestamp("verified_dt"),
  openStartUserId: text("open_start_user_id").references(() => user.id),
  openConfirmUserId: text("open_confirm_user_id").references(() => user.id),
  closeStartUserId: text("close_start_user_id").references(() => user.id),
  closeConfirmUserId: text("close_confirm_user_id").references(() => user.id),
  // Active user ID - the user currently controlling the session
  activeUserId: text("active_user_id").references(() => user.id),
  // Authorized user IDs - array of user IDs who can access this session
  authorizedUserIds: json("authorized_user_ids").$type<string[]>().default([]),
});

// CX Session Access Log - tracks session access and user joins
export const cxSessionAccessLog = pgTable("cx_session_access_log", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => cxSession.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  startDt: timestamp("start_dt").notNull().$defaultFn(() => new Date()),
  startOwnerId: text("start_owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  userJoinDt: timestamp("user_join_dt"),
  userJoinId: text("user_join_id").references(() => user.id),
  authorizedUsers: json("authorized_users").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
});